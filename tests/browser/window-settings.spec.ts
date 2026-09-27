import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

async function importConfig(page: Page, config: object) {
  await page
    .getByLabel("Import configuration JSON", { exact: true })
    .setInputFiles({
      name: "config.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(config)),
    });
}

async function downloadConfig(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Config JSON", exact: true }).click();
  return JSON.parse(await readFile((await (await pending).path())!, "utf8"));
}

const windowSettings = {
  alwaysOnTop: true,
  showTitleBar: false,
  showTabBar: false,
  blur: true,
  transparency: 0.375,
};

const transparencyLabel = "Background transparency (0–1)";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page.getByLabel("Target platform").selectOption("darwin");
});

test("shows desktop window defaults without materializing them on focus or preview toggles", async ({
  page,
}) => {
  await expect(page.getByLabel(transparencyLabel)).toHaveValue("0");
  await expect(page.getByLabel("Request native blur")).not.toBeChecked();
  await expect(page.getByLabel("Show title bar in new windows")).toBeChecked();
  await expect(page.getByLabel("Show tab bar in new windows")).toBeChecked();
  await expect(page.getByLabel("New windows always on top")).not.toBeChecked();
  await page.getByLabel(transparencyLabel).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Request native blur")).toBeFocused();
  await page.getByRole("button", { name: "Tabs", exact: true }).click();
  expect(await downloadConfig(page)).toEqual({ version: 1 });
});

test("edits every window setting without dropping siblings or simulating native composition", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const config = {
    version: 1,
    font: { size: 19 },
    theme: { path: "https://invalid.example/fictional-theme.json" },
    windowsShell: "C:\\Example\\shell.exe",
    keybinds: { toggleTitleBar: "Alt+Shift+D" },
    window: {
      alwaysOnTop: false,
      showTitleBar: true,
      showTabBar: true,
      blur: false,
      transparency: 0,
    },
  };
  await importConfig(page, config);
  const preview = page.getByTestId("terminal-preview");
  const originalBackground = await preview.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const originalBounds = await preview.boundingBox();
  await page.getByLabel(transparencyLabel).fill("0.375");
  await page.getByLabel(transparencyLabel).press("Tab");
  await page.getByLabel("Request native blur").check();
  await page.getByLabel("Show title bar in new windows").uncheck();
  await page.getByLabel("Show tab bar in new windows").uncheck();
  await page.getByLabel("New windows always on top").check();
  const expected = { ...config, window: windowSettings };
  expect(await downloadConfig(page)).toEqual(expected);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download edited pair" }).click();
  const files = unzipSync(await readFile((await (await pending).path())!));
  expect(JSON.parse(strFromU8(files["config.json"]))).toEqual({
    ...expected,
    theme: { path: "./themes/theme.json" },
  });
  expect(
    JSON.parse(strFromU8(files["themes/theme.json"])).colors.background,
  ).toBe("#101014");
  expect(await preview.boundingBox()).toEqual(originalBounds);
  await expect(preview).toHaveCSS("opacity", "1");
  await expect(preview).toHaveCSS("filter", "none");
  await expect(preview).toHaveCSS("backdrop-filter", "none");
  await expect(preview).toHaveCSS("background-color", originalBackground);
  await expect(page.locator(".window-titlebar")).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "zsh · workspace" }),
  ).toBeVisible();
  await expect(page.locator(".terminal-copy")).toHaveCSS("opacity", "1");
  expect(requests).toEqual([]);
});

test("rejects invalid window imports and JSON without changing applied work or pending text", async ({
  page,
}) => {
  const config = { version: 1, window: windowSettings };
  await importConfig(page, config);
  await page
    .getByText("Configuration JSON & keybindings", { exact: true })
    .click();
  const json = page.getByRole("textbox", {
    name: "Configuration JSON",
    exact: true,
  });
  const invalid = '{"version":1,"window":{"transparency":1.01}}';
  await json.fill(invalid);
  await expect(page.getByLabel("Request native blur")).toBeDisabled();
  await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("window.transparency");
  await importConfig(page, { version: 1, window: { blur: "true" } });
  await expect(page.getByRole("alert")).toContainText("current work kept");
  await expect(json).toHaveValue(invalid);
  await page.getByRole("tab", { name: "Theme", exact: true }).click();
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(json).toHaveValue(invalid);
  expect(await downloadConfig(page)).toEqual(config);
  await page
    .getByRole("button", { name: "Discard JSON edits", exact: true })
    .click();
  await expect(page.getByLabel("Request native blur")).toBeEnabled();
  await page.getByLabel(transparencyLabel).fill("-1");
  await page.getByLabel(transparencyLabel).press("Tab");
  await expect(page.getByLabel(transparencyLabel)).toHaveValue("0.375");
  expect(await downloadConfig(page)).toEqual(config);
});

test("persists validated window settings while preserving staged title-bar shortcuts through edits", async ({
  page,
}) => {
  await page.getByLabel("Remember this draft on this device").check();
  await importConfig(page, { version: 1, window: windowSettings });
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("title bar");
  const title = page.getByRole("textbox", {
    name: "Toggle title bar shortcut",
    exact: true,
  });
  await expect(title).toHaveValue("CommandOrControl+Shift+D");
  await title.fill("Ctrl+Alt+D");
  await page.getByLabel("New windows always on top").uncheck();
  await expect(title).toHaveValue("Ctrl+Alt+D");
  await page.getByRole("tab", { name: "Theme", exact: true }).click();
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(title).toHaveValue("Ctrl+Alt+D");
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  const expected = {
    version: 1,
    window: { ...windowSettings, alwaysOnTop: false },
    keybinds: { toggleTitleBar: "Ctrl+Alt+D" },
  };
  expect(await downloadConfig(page)).toEqual(expected);
  await page.reload();
  expect(await downloadConfig(page)).toEqual(expected);
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(page.getByLabel(transparencyLabel)).toHaveValue("0.375");
  await expect(
    page.getByLabel("Show title bar in new windows"),
  ).not.toBeChecked();
});

test("checks the inherited title-bar shortcut against target-specific conflicts", async ({
  page,
}) => {
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("new tab");
  const newTab = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  await newTab.fill("Ctrl+Shift+D");
  await expect(newTab).toHaveAttribute("aria-invalid", "false");
  for (const platform of ["linux", "win32"]) {
    await page.getByLabel("Target platform").selectOption(platform);
    await expect(newTab).toHaveValue("Ctrl+Shift+D");
    await expect(newTab).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByText("Conflicts with Toggle title bar.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Apply shortcuts", exact: true }),
    ).toBeDisabled();
  }
  await page
    .getByRole("button", { name: "Discard shortcut edits", exact: true })
    .click();
  await page.getByLabel("Filter shortcuts").fill("title bar");
  await expect(
    page.getByRole("textbox", {
      name: "Toggle title bar shortcut",
      exact: true,
    }),
  ).toHaveValue("Control+Shift+D");
  expect(await downloadConfig(page)).toEqual({ version: 1 });
});

for (const width of [1440, 390, 320]) {
  test(`keeps window controls, focus and setup guidance usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 960 });
    await page.getByLabel("Target platform").selectOption("win32");
    await expect(
      page.getByText(/Windows stays opaque without blur/),
    ).toBeVisible();
    const summary = page.getByText("Window & background", { exact: true });
    await summary.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(transparencyLabel)).toBeFocused();
    await page.getByLabel(transparencyLabel).fill("1");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Request native blur")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.getByLabel("Request native blur")).toBeChecked();
    await page
      .getByRole("button", { name: "Dismiss message", exact: true })
      .click();
    await summary.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/window-settings-${width}.png`,
    });
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel(transparencyLabel)).toBeHidden();
    await page.keyboard.press("Tab");
    await expect(
      page.getByText("Keyboard shortcuts", { exact: true }),
    ).toBeFocused();
    await page.getByText("Use these files in OMXTerm", { exact: true }).click();
    await expect(
      page.getByText("%USERPROFILE%\\.config\\omxterm", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("View → Reload User Configuration", { exact: true }),
    ).toBeVisible();
    const guide = page.getByRole("link", {
      name: "Open the desktop configuration guide",
    });
    await guide.focus();
    await expect(guide).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: `test-results/setup-guide-${width}.png` });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const panel = page.getByRole("complementary", {
      name: "Theme and configuration editor",
    });
    expect(
      await panel.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Edit appearance" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Make it feel like you." }),
    ).toBeFocused();
  });
}
