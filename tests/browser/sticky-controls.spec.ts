import { expect, test, type Locator, type Page } from "@playwright/test";

async function pinInEditor(page: Page, selector: string) {
  await page.locator(".editor-scroll").evaluate((scroller, stickySelector) => {
    const sticky = document.querySelector(stickySelector)!;
    scroller.scrollTop +=
      sticky.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      100;
  }, selector);
  const top = await page
    .locator(selector)
    .evaluate((element) => element.getBoundingClientRect().top);
  const scrollerTop = await page
    .locator(".editor-scroll")
    .evaluate(
      (element) =>
        element.getBoundingClientRect().top +
        parseFloat(getComputedStyle(element).paddingTop),
    );
  expect(Math.abs(top - scrollerTop)).toBeLessThanOrEqual(2);
}

async function expectHitTarget(control: Locator) {
  await expect(control).toBeVisible();
  expect(
    await control.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      return hit === element || element.contains(hit);
    }),
  ).toBe(true);
}

test("keeps sticky color Restore visible and clickable below the tabs", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await page.goto("./");
  const hex = page.getByRole("textbox", { name: "Selected color hex" });
  const original = await hex.inputValue();
  await hex.fill("#123456");
  await pinInEditor(page, ".color-inspector");
  const restore = page.getByRole("button", { name: "Restore selected color" });
  await expectHitTarget(restore);
  await page.screenshot({ path: testInfo.outputPath("sticky-restore.png") });
  await restore.click({ timeout: 4000 });
  await expect(hex).toHaveValue(original);
});

test("keeps sticky shortcut Apply and Discard visible and clickable below the tabs", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 720 });
  await page.goto("./");
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page.getByLabel("Target platform").selectOption("darwin");
  await page.getByText("Keyboard shortcuts", { exact: true }).click();
  const shortcut = page.getByRole("textbox", {
    name: "New tab shortcut",
    exact: true,
  });
  await shortcut.fill("Ctrl+Alt+Y");
  await pinInEditor(page, ".keybind-toolbar");
  const apply = page.getByRole("button", {
    name: "Apply shortcuts",
    exact: true,
  });
  const discard = page.getByRole("button", {
    name: "Discard shortcut edits",
    exact: true,
  });
  await expectHitTarget(apply);
  await expectHitTarget(discard);
  await page.screenshot({ path: testInfo.outputPath("sticky-shortcuts.png") });
  await apply.click({ timeout: 4000 });
  await expect(discard).toBeDisabled();
  await shortcut.fill("Ctrl+Alt+U");
  await pinInEditor(page, ".keybind-toolbar");
  await expectHitTarget(discard);
  await discard.click({ timeout: 4000 });
  await expect(shortcut).toHaveValue("Ctrl+Alt+Y");
});
