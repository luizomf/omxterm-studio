import { expect, test } from "@playwright/test";
import omtheme from "../../src/presets/omtheme.json" with { type: "json" };

const slots = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
];

test("renders a complete fictional diff while keeping foreground, selection and cursor samples", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Import theme JSON", { exact: true }).setInputFiles({
    name: "sample.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(omtheme)),
  });
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  const buffer = page.getByRole("region", {
    name: "Text and ANSI samples",
    exact: true,
  });
  await expect(
    buffer.getByText("diff --git a/prompt.ts b/prompt.ts", { exact: true }),
  ).toHaveCSS("color", "rgb(80, 80, 104)");
  await expect(buffer.getByText("--- a/prompt.ts", { exact: true })).toHaveCSS(
    "color",
    "rgb(255, 126, 154)",
  );
  await expect(buffer.getByText("+++ b/prompt.ts", { exact: true })).toHaveCSS(
    "color",
    "rgb(55, 254, 183)",
  );
  await expect(buffer.getByText("@@ -1,3 +1,3 @@", { exact: true })).toHaveCSS(
    "color",
    "rgb(107, 204, 255)",
  );
  await expect(buffer.getByText("const prompt = {", { exact: true })).toHaveCSS(
    "color",
    "rgb(240, 240, 255)",
  );
  const removed = buffer.getByText('"quiet"', { exact: true });
  const added = buffer.getByText('"vivid"', { exact: true });
  await expect(removed).toHaveCSS("background-color", "rgb(255, 126, 154)");
  await expect(added).toHaveCSS("background-color", "rgb(55, 254, 183)");
  await expect(removed).toHaveCSS("color", "rgb(0, 0, 0)");
  await expect(added).toHaveCSS("color", "rgb(0, 0, 0)");
  const selection = buffer.getByText("a little selected text", { exact: true });
  await expect(selection).toHaveCSS("background-color", "rgb(59, 79, 166)");
  await expect(selection).toHaveCSS("color", "rgb(255, 255, 255)");
  const cursors = buffer.locator(".cursor");
  await expect(cursors).toHaveCount(2);
  for (const cursor of await cursors.all())
    await expect(cursor).toHaveCSS("background-color", "rgb(240, 240, 255)");
});

test("keeps the ANSI samples reachable on a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  for (const name of slots) {
    const background = page
      .getByRole("group", { name: `${name} background samples`, exact: true })
      .getByText(name, { exact: true })
      .last();
    await background.evaluate((element) =>
      element.scrollIntoView({ block: "center", inline: "center" }),
    );
    await expect(background).toBeInViewport({ ratio: 1 });
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/preview-samples-mobile.png" });
});

test("shows every ANSI slot as plain, bold, dim and background text without changing its color", async ({
  page,
}) => {
  await page.goto("./");
  const colors = Object.fromEntries(
    slots.map((name, index) => [
      name,
      `#${(index + 1).toString(16).padStart(2, "0").repeat(3)}`,
    ]),
  );
  await page.getByLabel("Import theme JSON", { exact: true }).setInputFiles({
    name: "sample.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...omtheme,
        colors: { ...omtheme.colors, ...colors, background: "#010101" },
      }),
    ),
  });
  await page
    .getByRole("button", { name: "Collapse editor", exact: true })
    .click();
  await expect(page.getByRole("group", { name: / ANSI samples$/ })).toHaveCount(
    16,
  );
  for (const [index, name] of slots.entries()) {
    const row = page.getByRole("group", {
      name: `${name} ANSI samples`,
      exact: true,
    });
    await expect(row.locator(":scope > span").first()).toHaveText(name);
    const samples = row.locator(
      ":scope > span:nth-child(n + 2):nth-child(-n + 4)",
    );
    await expect(samples).toHaveCount(3);
    const color = `rgb(${index + 1}, ${index + 1}, ${index + 1})`;
    for (const sample of await samples.all())
      await expect(sample).toHaveCSS("color", color);
    await expect(samples.nth(1)).toHaveCSS("font-weight", "700");
    await expect(samples.nth(2)).toHaveCSS("opacity", "0.5");
    const backgrounds = row
      .getByRole("group", { name: `${name} background samples`, exact: true })
      .getByText(name, { exact: true });
    await expect(backgrounds).toHaveCount(2);
    for (const sample of await backgrounds.all())
      await expect(sample).toHaveCSS("background-color", color);
    await expect(backgrounds.nth(0)).toHaveCSS("color", "rgb(1, 1, 1)");
    await expect(backgrounds.nth(1)).toHaveCSS("color", "rgb(8, 8, 8)");
  }
});
