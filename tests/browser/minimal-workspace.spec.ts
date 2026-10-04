import { test, expect } from "@playwright/test";
import omtheme from "../../src/presets/omtheme.json" with { type: "json" };

for (const width of [1440, 390, 320]) {
  test(`keeps the terminal central and the sky viewport-wide at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("./");
    await page.getByRole("tab", { name: "Configuration", exact: true }).click();
    await page.getByLabel("Background transparency (0–1)").fill("0.65");
    await page.getByLabel("Background transparency (0–1)").press("Tab");
    await expect(page.getByRole("status")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Collapse editor", exact: true })
      .click();
    await expect(page.locator(".studio-footer")).toHaveCount(0);
    await expect(
      page.getByText("Simulated desktop", { exact: true }),
    ).toHaveCount(0);
    expect(await page.locator(".preview-sky").boundingBox()).toEqual({
      x: 0,
      y: 0,
      width,
      height: 960,
    });
    const preview = (await page.getByTestId("terminal-preview").boundingBox())!;
    expect(preview.y).toBeLessThanOrEqual(48);
    expect(preview.height).toBeGreaterThan(900);
    const tools = (await page.locator(".studio-header").boundingBox())!;
    expect(tools.y + tools.height).toBeLessThanOrEqual(preview.y);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Edit appearance", exact: true })
      .click();
    expect(await page.getByTestId("terminal-preview").boundingBox()).toEqual(
      preview,
    );
  });
}

test("keeps the control row in view on short landscape screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Minimize system demos column" })
    .click();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  for (const name of [
    "Edit appearance",
    "Pause sky animation",
    "Restore system demos column",
  ]) {
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toBeInViewport({ ratio: 1 });
  }
});

test("keeps landscape errors and pending edits recoverable without hiding exports", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("./");
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page
    .getByText("Configuration JSON & keybindings", { exact: true })
    .click();
  const json = page.getByRole("textbox", {
    name: "Configuration JSON",
    exact: true,
  });
  await json.fill("{");
  await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
  await expect(page.getByRole("alert")).toBeInViewport({ ratio: 1 });
  const editor = page.getByRole("complementary", {
    name: "Theme and configuration editor",
  });
  const bounds = (await editor.boundingBox())!;
  await page.mouse.move(bounds.x + 5, bounds.y + bounds.height - 5);
  await page.mouse.wheel(0, 2000);
  await expect
    .poll(() => editor.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  for (const name of ["Theme JSON", "Config JSON"]) {
    const button = page.getByRole("button", { name, exact: true });
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeInViewport({ ratio: 1 });
    expect(
      await button.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
          ),
        );
      }),
    ).toBe(true);
    const download = page.waitForEvent("download");
    await button.click();
    await download;
  }
  await expect(json).toHaveValue("{");
  await page
    .getByRole("button", { name: "Discard JSON edits", exact: true })
    .click();
  await expect(json).not.toHaveValue("{");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Edit appearance", exact: true }),
  ).toBeFocused();
});

test("keeps the moon in the backdrop under the same transparency and blur", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page.getByLabel("Background transparency (0–1)").fill("0.2");
  await page.getByLabel("Background transparency (0–1)").press("Tab");
  const moon = page.locator('.preview-sky[aria-hidden="true"] .preview-moon');
  await expect(moon).toHaveCount(1);
  expect((await moon.boundingBox())!.width).toBeGreaterThanOrEqual(36);
  const preview = page.getByTestId("terminal-preview");
  expect(await preview.locator(".preview-moon").count()).toBe(0);
  const before = await moon.boundingBox();
  await page.getByLabel("Request native blur").check();
  await expect(preview).toHaveCSS("backdrop-filter", "blur(4px)");
  await expect(preview).toHaveCSS("--preview-background-opacity", "0.8");
  expect(await moon.boundingBox()).toEqual(before);
  await page.getByLabel("Request native blur").uncheck();
  await expect(preview).toHaveCSS("backdrop-filter", "none");
  expect(await moon.boundingBox()).toEqual(before);
});

test("keeps errors inside the editor, never floating over the terminal", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Import theme JSON", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  const editor = page.getByRole("complementary", {
    name: "Theme and configuration editor",
  });
  await expect(editor.getByRole("alert")).toContainText("current work kept");
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Edit appearance", exact: true })
    .click();
  await expect(editor.getByRole("alert")).toBeVisible();
  await page
    .getByRole("button", { name: "Dismiss message", exact: true })
    .click();
  await expect(editor.getByRole("alert")).toHaveCount(0);
});

test("starts with current desktop OMTheme and keeps neutral controls legible with a light palette", async ({
  page,
}) => {
  await page.goto("./");
  const preview = page.getByTestId("terminal-preview");
  await expect(preview).toHaveCSS("--ansi-background", "#000000");
  await expect(preview).toHaveCSS("--ansi-blue", "#80aaff");
  await expect(preview).toHaveCSS("--ansi-selectionBackground", "#505064");
  const editor = page.getByRole("complementary", {
    name: "Theme and configuration editor",
  });
  const neutral = await editor.evaluate(
    (e) => getComputedStyle(e).backgroundColor,
  );
  await page.getByLabel("Import theme JSON", { exact: true }).setInputFiles({
    name: "light.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...omtheme,
        name: "Light test",
        colors: {
          ...omtheme.colors,
          background: "#fafafa",
          foreground: "#202030",
          cursor: "#202030",
        },
      }),
    ),
  });
  await expect(preview).toHaveCSS("color", "rgb(32, 32, 48)");
  await expect(editor).toHaveCSS("background-color", neutral);
  await expect(page.getByRole("status")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit appearance", exact: true }),
  ).toBeInViewport({ ratio: 1 });
  await expect(preview).toHaveCSS("--preview-background-opacity", "1");
});
