import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import omtheme from "../../src/presets/omtheme.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("edits, compares, and undoes colors without changing the overlay's own palette", async ({
  page,
}) => {
  const preview = page.getByTestId("terminal-preview");
  const editor = page.getByRole("complementary", {
    name: "Theme and configuration editor",
  });
  const editorColor = await editor.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await page.getByRole("button", { name: "Edit blue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Selected color hex" })
    .fill("#123456");
  await expect(preview).toHaveCSS("--ansi-blue", "#123456");
  await expect(editor).toHaveCSS("background-color", editorColor);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(preview).toHaveCSS("--ansi-blue", "#88aaf2");
  await page
    .getByRole("button", { name: "Viewing reference · Return to edits" })
    .click();
  await page.getByRole("button", { name: "Undo theme edit" }).click();
  await expect(preview).toHaveCSS("--ansi-blue", "#88aaf2");
  await page.getByRole("button", { name: "Redo theme edit" }).click();
  await expect(preview).toHaveCSS("--ansi-blue", "#123456");
  await expect(
    page.getByRole("textbox", { name: "Selected color hex" }),
  ).toHaveValue("#123456");
  await page.screenshot({ path: "test-results/pilot-editor.png" });
});

test("collapse, reopen, and moving the panel never resize or dim the preview", async ({
  page,
}) => {
  const preview = page.getByTestId("terminal-preview");
  const bounds = await preview.boundingBox();
  await page.getByRole("button", { name: "Move editor right" }).click();
  expect(await preview.boundingBox()).toEqual(bounds);
  await page.getByRole("button", { name: "Collapse editor" }).click();
  expect(await preview.boundingBox()).toEqual(bounds);
  await expect(preview).toHaveCSS("opacity", "1");
  await expect(preview).toHaveCSS("filter", "none");
  await page.getByRole("button", { name: "Snippets", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Simulated snippets sidebar" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/pilot-preview.png" });
  await page.getByRole("button", { name: "Edit appearance" }).click();
  await expect(
    page.getByRole("heading", { name: "Make it feel like you." }),
  ).toBeFocused();
});

test("downloads a coherent pair and keeps the current edit when comparing", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Edit blue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Selected color hex" })
    .fill("#123456");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download edited pair" }).click();
  const file = await downloadPromise;
  expect(file.suggestedFilename()).toBe("omxterm-config.zip");
  const path = await file.path();
  expect(path).not.toBeNull();
  const contents = unzipSync(await readFile(path!));
  expect(Object.keys(contents).sort()).toEqual([
    "config.json",
    "themes/theme.json",
  ]);
  expect(JSON.parse(strFromU8(contents["config.json"])).theme.path).toBe(
    "./themes/theme.json",
  );
  expect(JSON.parse(strFromU8(contents["themes/theme.json"])).colors.blue).toBe(
    "#123456",
  );
});

test("rejects malformed imports without losing the current theme", async ({
  page,
}) => {
  const preview = page.getByTestId("terminal-preview");
  await page.getByLabel("Import theme JSON", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"colors":{}}'),
  });
  await expect(page.getByRole("alert")).toContainText("current work kept");
  await expect(preview).toHaveCSS("--ansi-background", "#101014");
  await page.getByRole("button", { name: "Dismiss message" }).click();
  await page.getByLabel("Import theme JSON", { exact: true }).setInputFiles({
    name: "invalid-utf8.json",
    mimeType: "application/json",
    buffer: Buffer.from([0xff]),
  });
  await expect(page.getByRole("alert")).toContainText("UTF-8");
});

test("imports configuration without fetching its path or dropping keybindings", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const config = {
    version: 1,
    font: { size: 20, family: "Example Local Font" },
    theme: { path: "https://invalid.example/private-theme.json" },
    keybinds: { newTab: "Cmd+Shift+Y" },
    scrollback: { lines: 3000 },
  };
  await page
    .getByLabel("Import configuration JSON", { exact: true })
    .setInputFiles({
      name: "config.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(config)),
    });
  await expect(page.getByRole("status")).toContainText(
    "theme.path was not opened",
  );
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await expect(page.getByLabel("Installed font family")).toHaveValue(
    "Example Local Font",
  );
  await expect(page.getByTestId("terminal-preview")).toHaveCSS(
    "--preview-size",
    "20px",
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Config JSON", exact: true }).click();
  expect(
    JSON.parse(await readFile((await (await downloaded).path())!, "utf8")),
  ).toEqual(config);
  expect(requests.some((url) => url.includes("invalid.example"))).toBe(false);
});

test("treats imported names as text, not markup", async ({ page }) => {
  await page.getByLabel("Import theme JSON", { exact: true }).setInputFiles({
    name: "theme.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ ...omtheme, name: '<img src=x onerror="alert(1)">' }),
    ),
  });
  await expect(page.getByTestId("terminal-preview")).toContainText(
    '<img src=x onerror="alert(1)">',
  );
  expect(await page.locator("img").count()).toBe(0);
});

test("keeps draft storage opt-in and restores only a validated draft", async ({
  page,
}) => {
  expect(
    await page.evaluate(() => localStorage.getItem("omxterm-studio:draft:v1")),
  ).toBeNull();
  await page.getByRole("button", { name: "Edit blue", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Selected color hex" })
    .fill("#123456");
  await page.getByLabel("Remember this draft on this device").check();
  await page.reload();
  await expect(page.getByTestId("terminal-preview")).toHaveCSS(
    "--ansi-blue",
    "#123456",
  );
  await page.getByLabel("Remember this draft on this device").uncheck();
  expect(
    await page.evaluate(() => localStorage.getItem("omxterm-studio:draft:v1")),
  ).toBeNull();
});

test("can type a complete Windows shell path and navigate tabs by keyboard", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page.getByLabel("Target platform").selectOption("win32");
  const shell = page.getByLabel("Windows shell path");
  await shell.pressSequentially("C:\\Tools\\pwsh.exe");
  await shell.press("Tab");
  await expect(shell).toHaveValue("C:\\Tools\\pwsh.exe");
  await page.getByRole("tab", { name: "Theme", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Configuration", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Collapse editor" }).click();
  await expect(
    page.getByRole("button", { name: "Edit appearance" }),
  ).toBeFocused();
});

test("font size and line height affect every terminal scene, while chrome retains UI typography", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page.getByLabel("Font size (px)").fill("20");
  await page.getByLabel("Font size (px)").press("Tab");
  await page.getByLabel("Line height", { exact: true }).fill("1.5");
  await page.getByLabel("Line height", { exact: true }).press("Tab");
  for (const selector of [
    ".terminal-copy",
    ".text-scene pre",
    ".fetch-facts",
    ".process-row",
    ".tmux-status",
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS("font-size", "20px");
    await expect(page.locator(selector).first()).toHaveCSS(
      "line-height",
      "37.5px",
    );
  }
  await expect(page.getByRole("tab", { name: "zsh · workspace" })).toHaveCSS(
    "font-size",
    "12px",
  );
});

test("works at a narrow viewport without horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Download edited pair" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/pilot-mobile.png" });
  await page.getByRole("button", { name: "Collapse editor" }).click();
  await expect(
    page.getByRole("button", { name: "Edit appearance" }),
  ).toBeVisible();
});

test("starts without runtime errors, CSP violations, or third-party requests", async ({
  page,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => requests.push(request.url()));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "OMXTerm Studio" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  const origin = new URL(page.url()).origin;
  expect(requests.every((url) => url.startsWith(origin + "/"))).toBe(true);
});
