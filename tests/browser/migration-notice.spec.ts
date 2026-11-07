import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("explains the released workflow and leaves the workshop usable", async ({
  page,
}) => {
  await page.goto("./");
  const notice = page.getByRole("region", {
    name: "Your theme workshop is now in OMXTerm",
  });
  await expect(notice).toContainText("0.25.0 or newer");
  await expect(notice).toContainText("Use saved theme");
  await expect(
    notice.getByRole("link", { name: "Theme guide" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/luizomf/omxterm/blob/main/docs/configuration.md#author-a-theme",
  );
  await expect(
    notice.getByRole("link", { name: "Get OMXTerm 0.25.0" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/luizomf/omxterm/releases/tag/v0.25.0",
  );
  await notice.getByRole("button", { name: "Continue in Studio" }).click();
  await expect(notice).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Make it feel like you." }),
  ).toBeFocused();
  await page
    .getByRole("textbox", { name: "Theme name" })
    .fill("A synthetic theme");
  const result = page.waitForEvent("download");
  await page.getByRole("button", { name: "Theme JSON", exact: true }).click();
  expect(
    JSON.parse(await readFile((await (await result).path())!, "utf8")).name,
  ).toBe("A synthetic theme");
});

test("dismissal preserves remembered, invalid and pending edits and their recovery", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Remember this draft on this device").check();
  await page
    .getByRole("textbox", { name: "Theme name" })
    .fill("Remembered synthetic theme");
  await page.getByRole("textbox", { name: "Theme name" }).fill("");
  await page.getByRole("tab", { name: "Configuration", exact: true }).click();
  await page
    .getByText("Configuration JSON & keybindings", { exact: true })
    .click();
  const pending = '{"version":1,"font":{"size":22}}';
  await page
    .getByRole("textbox", { name: "Configuration JSON", exact: true })
    .fill(pending);
  await page.getByRole("button", { name: "Continue in Studio" }).click();
  await expect(
    page.getByRole("textbox", { name: "Configuration JSON", exact: true }),
  ).toHaveValue(pending);
  await expect(
    page.getByText(
      "Unapplied configuration JSON. Downloads use the last applied configuration.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Theme JSON", exact: true }),
  ).toBeDisabled();
  const result = page.waitForEvent("download");
  await page.getByRole("button", { name: "Config JSON", exact: true }).click();
  expect(
    JSON.parse(await readFile((await (await result).path())!, "utf8")),
  ).toEqual({ version: 1 });
  await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
  await page.getByRole("tab", { name: "Theme", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Theme name" })).toHaveValue(
    "",
  );
  await page
    .getByRole("textbox", { name: "Theme name" })
    .fill("Recovered synthetic theme");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Theme name" })).toHaveValue(
    "Recovered synthetic theme",
  );
  await expect(page.getByTestId("terminal-preview")).toHaveCSS(
    "--preview-size",
    "22px",
  );
  await expect(
    page.getByRole("button", { name: "Continue in Studio" }),
  ).toBeVisible();
});

for (const height of [561, 600, 640]) {
  test(`keeps recovery and exports usable with the notice open at ${height}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height });
    await page.goto("./");
    const notice = page.getByRole("region", {
      name: "Your theme workshop is now in OMXTerm",
    });
    await page.getByRole("textbox", { name: "Theme name" }).fill("");
    await page.getByRole("tab", { name: "Configuration", exact: true }).click();
    await page
      .getByText("Configuration JSON & keybindings", { exact: true })
      .click();
    const json = page.getByRole("textbox", {
      name: "Configuration JSON",
      exact: true,
    });
    await json.fill('{"version":');
    await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByText(
        "Unapplied configuration JSON. Downloads use the last applied configuration.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Complete the invalid name or hex value in Theme before exporting a theme or pair.",
      ),
    ).toBeVisible();
    const geometry = await page.evaluate(() => {
      const panel = document.querySelector(".editor-panel")!;
      const scroller = document.querySelector(".editor-scroll")!;
      const footer = document.querySelector(".panel-export")!;
      return {
        scrollerHeight: scroller.clientHeight,
        footerBottom: footer.getBoundingClientRect().bottom,
        panelBottom: panel.getBoundingClientRect().bottom,
      };
    });
    expect(geometry.scrollerHeight).toBeGreaterThanOrEqual(100);
    expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.panelBottom);
    if (height === 600) {
      await page.screenshot({
        path: testInfo.outputPath("error-pending-600.png"),
      });
      await page.locator(".editor-scroll").evaluate((element) => {
        element.scrollTop = 0;
      });
      await page.screenshot({
        path: testInfo.outputPath("notice-error-600.png"),
      });
    }
    await json.click({ timeout: 4000 });
    await expect(json).toBeFocused();
    await page
      .getByRole("button", { name: "Discard JSON edits" })
      .click({ timeout: 4000 });
    await expect(json).not.toHaveValue('{"version":');
    await json.fill('{"version":');
    await page.getByRole("button", { name: "Apply JSON", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    const download = page.waitForEvent("download", { timeout: 4000 });
    await page
      .getByRole("button", { name: "Config JSON", exact: true })
      .click({ timeout: 4000 });
    expect(
      JSON.parse(await readFile((await (await download).path())!, "utf8")),
    ).toEqual({ version: 1 });
    await expect(json).toHaveValue('{"version":');
    await page
      .getByRole("button", { name: "Discard JSON edits" })
      .click({ timeout: 4000 });
    await page.getByRole("tab", { name: "Theme", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Theme name" })
      .fill("Recovered theme", { timeout: 4000 });
    const themeDownload = page.waitForEvent("download", { timeout: 4000 });
    await page.getByRole("button", { name: "Theme JSON", exact: true }).click();
    expect(
      JSON.parse(await readFile((await (await themeDownload).path())!, "utf8"))
        .name,
    ).toBe("Recovered theme");
    await expect(notice).toHaveCount(1);
  });
}

for (const width of [320, 1440]) {
  test(`notice is readable and dismissible at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("./");
    const notice = page.getByRole("region", {
      name: "Your theme workshop is now in OMXTerm",
    });
    await expect(notice).toBeVisible();
    await expect(
      notice.getByRole("button", { name: "Continue in Studio" }),
    ).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: testInfo.outputPath(`notice-${width}.png`) });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await notice.getByRole("button", { name: "Continue in Studio" }).click();
    await expect(
      page.getByRole("button", { name: "Download edited pair" }),
    ).toBeVisible();
  });
}
