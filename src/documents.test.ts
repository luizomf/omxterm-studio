import { describe, expect, it } from "vitest";
import { createBundle, parseTheme, readDocumentFile } from "./documents";
import { strFromU8, unzipSync } from "fflate";
import { parseConfiguration } from "./configuration";
import omtheme from "./presets/omtheme.json";

describe("file import", () => {
  it("rejects oversized or invalid UTF-8 files before they can replace a draft", async () => {
    await expect(
      readDocumentFile(new File([new Uint8Array([0xff])], "bad.json")),
    ).rejects.toThrow("UTF-8");
    await expect(
      readDocumentFile(new File([" ".repeat(262145)], "large.json")),
    ).rejects.toThrow("256 KiB");
  });
});

describe("local configuration documents", () => {
  it("keeps supported settings and rejects unknown nested fields", () => {
    const input = {
      version: 1,
      font: { family: "Fira Code", size: 18 },
      keybinds: { newTab: "Cmd+Shift+Y" },
      theme: { path: "./my-theme.json" },
    };
    expect(parseConfiguration(JSON.stringify(input), "darwin")).toEqual(input);
    expect(() =>
      parseConfiguration('{"version":1,"font":{"tracking":2}}', "darwin"),
    ).toThrow("font.tracking");
  });
});

describe("paired export", () => {
  it("downloads a self-contained pair without changing the user's selected path", () => {
    const config = {
      version: 1 as const,
      theme: { path: "C:\\themes\\old.json" },
      font: { size: 18 },
    };
    const files = unzipSync(
      createBundle(config, parseTheme(JSON.stringify(omtheme)), "darwin"),
    );
    expect(Object.keys(files).sort()).toEqual([
      "config.json",
      "themes/theme.json",
    ]);
    expect(JSON.parse(strFromU8(files["config.json"]))).toEqual({
      version: 1,
      theme: { path: "./themes/theme.json" },
      font: { size: 18 },
    });
    expect(
      JSON.parse(strFromU8(files["themes/theme.json"])).colors.brightBlack,
    ).toBe("#505068");
    expect(config.theme.path).toBe("C:\\themes\\old.json");
  });
});

describe("local theme documents", () => {
  it("imports a complete OMXTerm palette without changing its ANSI colors", () => {
    const theme = parseTheme(JSON.stringify(omtheme));
    expect(theme.colors.brightBlack).toBe("#505068");
    expect(theme.colors.white).toBe("#f0f0ff");
    expect(theme.name).toBe("omtheme");
  });
});
