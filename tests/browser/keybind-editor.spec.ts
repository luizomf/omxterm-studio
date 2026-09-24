import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

async function downloadConfig(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Config JSON", exact: true }).click();
  return JSON.parse(await readFile((await (await pending).path())!, "utf8"));
}

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page.getByLabel("Target platform").selectOption("darwin");
});

test("refreshes replaced bindings and includes applied shortcuts in a coherent ZIP", async ({
  page,
}) => {
  const upload = async (config: object) =>
    page
      .getByLabel("Import configuration JSON", { exact: true })
      .setInputFiles({
        name: "config.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(config)),
      });
  await upload({ version: 1, keybinds: { newTab: "Ctrl+Alt+A" } });
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("New tab");
  const newTab = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  await newTab.fill("Ctrl+Alt+P");
  const imported = {
    version: 1,
    font: { size: 19, ligatures: false },
    terminal: { padding: { left: 11 } },
    scrollback: { lines: 5000 },
    confirmClose: false,
    keyboard: { optionAsAlt: "both" },
    window: { alwaysOnTop: true },
    windowsShell: "C:\\Tools\\shell.exe",
    logLevel: "error",
    theme: { path: "./original-theme.json" },
    keybinds: { newWindow: "Ctrl+Alt+N" },
  };
  await upload(imported);
  await expect(newTab).toHaveValue("CommandOrControl+T");
  await expect(
    page.getByRole("button", { name: "Discard shortcut edits", exact: true }),
  ).toBeDisabled();
  await newTab.fill("Ctrl+Alt+Y");
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  const applied = {
    ...imported,
    keybinds: { newWindow: "Ctrl+Alt+N", newTab: "Ctrl+Alt+Y" },
  };
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download edited pair", exact: false })
    .click();
  const zip = unzipSync(await readFile((await (await download).path())!));
  expect(Object.keys(zip).sort()).toEqual(["config.json", "themes/theme.json"]);
  expect(JSON.parse(strFromU8(zip["config.json"]))).toEqual({
    ...applied,
    theme: { path: "./themes/theme.json" },
  });
  expect(await downloadConfig(page)).toEqual(applied);
});

test("keeps narrow shortcut editing inside the overlay without moving the preview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const preview = await page.getByTestId("terminal-preview").boundingBox();
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("Reload configuration");
  await page
    .getByRole("textbox", {
      name: "Reload configuration shortcut",
      exact: true,
    })
    .fill("Ctrl+Alt+R");
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Dismiss message", exact: true })
    .click();
  expect(await page.getByTestId("terminal-preview").boundingBox()).toEqual(
    preview,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/keybinds-mobile.png" });
  expect(await downloadConfig(page)).toEqual({
    version: 1,
    keybinds: { reloadConfig: "Ctrl+Alt+R" },
  });
});

test("rechecks explicit drafts for the target platform and warns without rejecting shell-control keys", async ({
  page,
}) => {
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("New tab");
  const newTab = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  await newTab.fill("CmdOrCtrl+Shift+Q");
  await expect(
    page.getByRole("button", { name: "Apply shortcuts", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Target platform").selectOption("linux");
  await expect(newTab).toHaveValue("CmdOrCtrl+Shift+Q");
  await expect(newTab).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("Conflicts with Close window.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply shortcuts", exact: true }),
  ).toBeDisabled();
  await newTab.fill("Ctrl+C");
  await expect(page.getByText(/SIGINT/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply shortcuts", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  expect(await downloadConfig(page)).toEqual({
    version: 1,
    keybinds: { newTab: "Ctrl+C" },
  });
  await expect(page.getByText(/SIGINT/)).toBeVisible();
});

test("coordinates shortcut and full-document drafts without overwriting unfinished edits", async ({
  page,
}) => {
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("New tab");
  const newTab = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  await newTab.fill("Ctrl+Alt+Y");
  await page
    .getByText("Configuration JSON & keybindings", { exact: true })
    .click();
  const json = page.getByRole("textbox", {
    name: "Configuration JSON",
    exact: true,
  });
  await expect(json).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Apply JSON", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Discard shortcut edits", exact: true })
    .click();
  await expect(json).toBeEnabled();
  await json.fill("{");
  await expect(newTab).toBeDisabled();
  await expect(page.getByLabel("Font size (px)")).toBeDisabled();
  await expect(page.getByLabel("Target platform")).toBeEnabled();
  await page
    .getByRole("button", { name: "Discard JSON edits", exact: true })
    .click();
  await expect(newTab).toBeEnabled();
  expect(JSON.parse(await json.inputValue())).toEqual({ version: 1 });
  const applied = {
    version: 1,
    font: { size: 23 },
    keybinds: { newTab: "Ctrl+Alt+Y" },
  };
  await json.fill(JSON.stringify(applied));
  await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
  await expect(newTab).toHaveValue("Ctrl+Alt+Y");
  await expect(page.getByLabel("Font size (px)")).toHaveValue("23");
  await newTab.fill("Shift+T");
  await expect(newTab).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByRole("button", { name: "Apply shortcuts", exact: true }),
  ).toBeDisabled();
  expect(await downloadConfig(page)).toEqual(applied);
  await page
    .getByRole("button", { name: "Discard shortcut edits", exact: true })
    .click();
  await expect(newTab).toHaveValue("Ctrl+Alt+Y");
  await page
    .getByLabel("Installed font family")
    .pressSequentially("Example Mono");
  await expect(page.getByLabel("Installed font family")).toHaveValue(
    "Example Mono",
  );
  await expect(json).toBeEnabled();
});

test("retains pending shortcuts across sections and appearance edits, protecting exit with Remember", async ({
  page,
  context,
}) => {
  await page.getByLabel("Remember this draft on this device").check();
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("New tab");
  const newTab = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  await newTab.fill("Ctrl+Alt+Y");
  const warning =
    "Unapplied shortcut edits. Downloads use the last applied configuration.";
  await expect(page.getByText(warning, { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Theme", exact: true }).click();
  await expect(newTab).toHaveCount(0);
  await expect(page.getByText(warning, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit appearance", exact: true })
    .click();
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(newTab).toHaveValue("Ctrl+Alt+Y");
  await page.getByLabel("Font size (px)").fill("20");
  await page.getByLabel("Installed font family").click();
  await expect(newTab).toHaveValue("Ctrl+Alt+Y");
  expect(await downloadConfig(page)).toEqual({
    version: 1,
    font: { size: 20 },
  });
  const leave = page.waitForEvent("dialog");
  await page.close({ runBeforeUnload: true });
  const dialog = await leave;
  expect(dialog.type()).toBe("beforeunload");
  await dialog.dismiss();
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  await expect(page.getByText(warning, { exact: true })).toHaveCount(0);
  await newTab.fill("Ctrl+Alt+U");
  await expect(page.getByText(warning, { exact: true })).toBeVisible();
  const leaveAgain = page.waitForEvent("dialog");
  await page.close({ runBeforeUnload: true });
  await (await leaveAgain).accept();
  const restored = await context.newPage();
  await restored.goto("./");
  await restored
    .getByRole("tab", { name: "Configuration", exact: true })
    .click();
  await restored.getByText("Keyboard shortcuts", { exact: true }).click();
  await expect(
    restored.getByRole("textbox", { name: "New tab shortcut", exact: true }),
  ).toHaveValue("Ctrl+Alt+Y");
  expect(await downloadConfig(restored)).toEqual({
    version: 1,
    font: { size: 20 },
    keybinds: { newTab: "Ctrl+Alt+Y" },
  });
});

test("filters actions, discards staged changes, and restores sparse imported overrides", async ({
  page,
}) => {
  const imported = {
    version: 1,
    font: { size: 20 },
    scrollback: { lines: 2500 },
    theme: { path: "./keep-this-theme.json" },
    keybinds: { newTab: "Ctrl+Alt+Y", toggleSnippets: "Ctrl+Alt+S" },
  };
  await page
    .getByLabel("Import configuration JSON", { exact: true })
    .setInputFiles({
      name: "config.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(imported)),
    });
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  await page.getByLabel("Filter shortcuts").fill("New tab");
  await expect(page.getByRole("textbox", { name: / shortcut$/ })).toHaveCount(
    1,
  );
  const newTab = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  await expect(newTab).toHaveValue("Ctrl+Alt+Y");
  await page
    .getByRole("button", { name: "Restore New tab default", exact: true })
    .click();
  await expect(newTab).toHaveValue("CommandOrControl+T");
  expect(await downloadConfig(page)).toEqual(imported);
  await page
    .getByRole("button", { name: "Discard shortcut edits", exact: true })
    .click();
  await expect(newTab).toHaveValue("Ctrl+Alt+Y");
  await page
    .getByRole("button", { name: "Restore New tab default", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  expect(await downloadConfig(page)).toEqual({
    ...imported,
    keybinds: { toggleSnippets: "Ctrl+Alt+S" },
  });
  await page.getByLabel("Filter shortcuts").fill("Toggle snippets");
  await page
    .getByRole("button", {
      name: "Restore Toggle snippets default",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  expect(await downloadConfig(page)).toEqual({
    version: 1,
    font: { size: 20 },
    scrollback: { lines: 2500 },
    theme: { path: "./keep-this-theme.json" },
  });
});

test("shows platform defaults and applies shortcut swaps only as a complete batch", async ({
  page,
}) => {
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  const newTab = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  const closeTab = page.getByRole("textbox", {
    name: "Close tab shortcut",
    exact: true,
  });
  await expect(page.getByRole("textbox", { name: / shortcut$/ })).toHaveCount(
    26,
  );
  await expect(newTab).toHaveValue("CommandOrControl+T");
  await page.getByLabel("Target platform").selectOption("linux");
  await expect(newTab).toHaveValue("Control+Shift+T");
  await page.getByLabel("Target platform").selectOption("win32");
  await expect(newTab).toHaveValue("Control+Shift+T");
  await page.getByLabel("Target platform").selectOption("darwin");
  await newTab.fill("Cmd+W");
  await expect(newTab).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("Conflicts with Close tab.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Apply shortcuts", exact: true }),
  ).toBeDisabled();
  await closeTab.fill("Cmd+T");
  await expect(newTab).toHaveAttribute("aria-invalid", "false");
  expect(await downloadConfig(page)).toEqual({ version: 1 });
  await page
    .getByRole("button", { name: "Apply shortcuts", exact: true })
    .click();
  expect(await downloadConfig(page)).toEqual({
    version: 1,
    keybinds: { newTab: "Cmd+W", closeTab: "Cmd+T" },
  });
});
