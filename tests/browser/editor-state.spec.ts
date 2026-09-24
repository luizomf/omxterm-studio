import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

const pendingNotice =
  "Unapplied configuration JSON. Downloads use the last applied configuration.";
const invalidThemeNotice =
  "Complete the invalid name or hex value in Theme before exporting a theme or pair.";

for (const input of [
  { label: "Selected color hex", pending: "#12", applied: "#123456" },
  { label: "Theme name", pending: "", applied: "A refined theme" },
]) {
  test(`preserves and protects invalid ${input.label} across sections`, async ({
    page,
  }) => {
    await page.getByLabel("Remember this draft on this device").check();
    await page
      .getByRole("textbox", { name: input.label, exact: true })
      .fill(input.pending);
    await page.getByRole("tab", { name: "Configuration", exact: true }).click();
    await expect(
      page.getByText(invalidThemeNotice, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download edited pair" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Theme JSON", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Config JSON", exact: true }),
    ).toBeEnabled();
    const dialogPromise = page.waitForEvent("dialog");
    await page.close({ runBeforeUnload: true });
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("beforeunload");
    await dialog.dismiss();
    await page.getByRole("tab", { name: "Theme", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: input.label, exact: true }),
    ).toHaveValue(input.pending);
    await page.getByRole("button", { name: "Collapse editor" }).click();
    await page.getByRole("button", { name: "Edit appearance" }).click();
    await expect(
      page.getByRole("textbox", { name: input.label, exact: true }),
    ).toHaveValue(input.pending);
    await page
      .getByRole("textbox", { name: input.label, exact: true })
      .fill(input.applied);
    await expect(
      page.getByText(invalidThemeNotice, { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Download edited pair" }),
    ).toBeEnabled();
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: input.label, exact: true }),
    ).toHaveValue(input.applied);
  });
}

test("protects unapplied JSON from page exit even when the validated draft is remembered", async ({
  page,
}) => {
  await page.getByLabel("Remember this draft on this device").check();
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page
    .getByText("Configuration JSON & keybindings", { exact: true })
    .click();
  const pending = '{"version":1,"font":{"size":22}}';
  await page
    .getByRole("textbox", { name: "Configuration JSON", exact: true })
    .fill(pending);
  await expect(page.getByText(pendingNotice, { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Theme", exact: true }).click();
  await expect(page.getByText(pendingNotice, { exact: true })).toBeVisible();
  const dialogPromise = page.waitForEvent("dialog");
  await page.close({ runBeforeUnload: true });
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  expect(page.isClosed()).toBe(false);
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Configuration JSON", exact: true }),
  ).toHaveValue(pending);
  await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
  await expect(page.getByText(pendingNotice, { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("terminal-preview")).toHaveCSS(
    "--preview-size",
    "22px",
  );
});

test("switching sections preserves palette selection and unapplied configuration JSON", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit blue", exact: true }).click();
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page
    .getByText("Configuration JSON & keybindings", { exact: true })
    .click();
  const pending = '{"version":1,"font":{"size":22}}';
  await page
    .getByRole("textbox", { name: "Configuration JSON", exact: true })
    .fill(pending);
  await page.getByRole("tab", { name: "Theme", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit blue", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Configuration JSON", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Configuration JSON", exact: true }),
  ).toHaveValue(pending);
  await expect(
    page.getByRole("textbox", { name: "Theme name", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Target platform")).toBeFocused();
  await expect(page.getByTestId("terminal-preview")).toHaveCSS(
    "--preview-size",
    "16px",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Config JSON", exact: true }).click();
  const download = await downloadPromise;
  expect(JSON.parse(await readFile((await download.path())!, "utf8"))).toEqual({
    version: 1,
  });
  await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
  await expect(page.getByTestId("terminal-preview")).toHaveCSS(
    "--preview-size",
    "22px",
  );
});
