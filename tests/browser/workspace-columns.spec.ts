import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
});

test("minimizes either column, expands the other, and restores by keyboard", async ({
  page,
}) => {
  const samples = page.getByRole("region", { name: "Text and ANSI samples" });
  const fetch = page.getByRole("region", { name: "Simulated fastfetch" });
  const htop = page.getByRole("region", { name: "Simulated htop" });
  const originalWidth = (await samples.boundingBox())!.width;
  const systemButton = page.getByRole("button", {
    name: "Minimize system demos column",
  });
  await systemButton.focus();
  await page.keyboard.press("Enter");
  const restoreSystem = page.getByRole("button", {
    name: "Restore system demos column",
  });
  await expect(restoreSystem).toBeFocused();
  await expect(restoreSystem).toHaveAttribute("aria-expanded", "false");
  await expect(fetch).toHaveCount(0);
  await expect(htop).toHaveCount(0);
  expect((await samples.boundingBox())!.width).toBeGreaterThan(
    originalWidth * 1.5,
  );
  await expect(
    page.getByRole("button", { name: "Minimize color samples column" }),
  ).toBeDisabled();
  await page.keyboard.press("Space");
  await expect(fetch).toBeVisible();
  await expect(htop).toBeVisible();
  expect((await samples.boundingBox())!.width).toBe(originalWidth);

  const originalSystemWidth = (await fetch.boundingBox())!.width;
  await page
    .getByRole("button", { name: "Minimize color samples column" })
    .click();
  await expect(samples).toHaveCount(0);
  expect((await fetch.boundingBox())!.width).toBeGreaterThan(
    originalSystemWidth * 1.5,
  );
  await expect(
    page.getByRole("button", { name: "Minimize system demos column" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Restore color samples column" })
    .click();
  await expect(samples).toBeVisible();
});

test("keeps column visibility local to workspace and out of exported configuration", async ({
  page,
}) => {
  async function downloadConfig() {
    await page.getByRole("button", { name: "Edit appearance" }).click();
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Config JSON", exact: true })
      .click();
    const text = await readFile((await (await download).path())!, "utf8");
    await page
      .getByRole("button", { name: "Collapse editor", exact: true })
      .click();
    return text;
  }
  const before = await downloadConfig();
  await page
    .getByRole("button", { name: "Minimize system demos column" })
    .click();
  for (const [tab, region] of [
    ["fastfetch · demo", "Simulated fastfetch"],
    ["htop · demo", "Simulated htop"],
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await expect(
      page.getByRole("group", { name: "Workspace columns" }),
    ).toHaveCount(0);
    await expect(page.getByRole("region", { name: region })).toBeVisible();
  }
  await page.getByRole("tab", { name: "zsh · workspace" }).click();
  await expect(
    page.getByRole("button", { name: "Restore system demos column" }),
  ).toBeVisible();
  expect(await downloadConfig()).toBe(before);
  await page.getByRole("button", { name: "Tabs", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restore system demos column" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Minimize system demos column" }),
  ).toHaveAttribute("aria-expanded", "true");
});

test("keeps large-font samples scrollable and restore controls reachable on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Edit appearance" }).click();
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page.getByLabel("Font size (px)").fill("26");
  await page.getByLabel("Font size (px)").press("Tab");
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Minimize system demos column" })
    .click();
  await expect(page.locator(".terminal-copy")).toHaveCSS("font-size", "26px");
  const background = page
    .getByRole("group", { name: "brightWhite background samples", exact: true })
    .locator("span")
    .last();
  await background.evaluate((element) =>
    element.scrollIntoView({ block: "center", inline: "center" }),
  );
  await expect(background).toBeInViewport({ ratio: 1 });
  const restore = page.getByRole("button", {
    name: "Restore system demos column",
  });
  await expect(restore).toBeInViewport({ ratio: 1 });
  await restore.click();
  await page
    .getByRole("button", { name: "Minimize color samples column" })
    .click();
  await expect(
    page.getByRole("region", { name: "Simulated htop" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Restore color samples column" }),
  ).toBeInViewport({ ratio: 1 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
