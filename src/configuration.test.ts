import { describe, expect, it } from "vitest";
import { parseConfiguration, resolvedAppearance } from "./configuration";

const parse = (value: unknown) =>
  parseConfiguration(JSON.stringify(value), "darwin");

describe("configuration schema boundary", () => {
  it.each([
    null,
    [],
    {},
    { version: 2 },
    { version: 1, future: true },
    { version: 1, font: null },
    { version: 1, font: { size: 7 } },
    { version: 1, font: { size: 16.5 } },
    { version: 1, font: { lineHeight: 2.1 } },
    { version: 1, font: { family: "Bad\nFont" } },
    { version: 1, font: { ligatures: "yes" } },
    { version: 1, terminal: { padding: { left: -1 } } },
    { version: 1, terminal: { padding: { horizontal: 8 } } },
    { version: 1, scrollback: { lines: 100001 } },
    { version: 1, keyboard: { optionAsAlt: "sometimes" } },
    { version: 1, window: { alwaysOnTop: "false" } },
    { version: 1, window: { showTitleBar: "false" } },
    { version: 1, window: { showTabBar: 0 } },
    { version: 1, window: { blur: null } },
    { version: 1, window: { transparency: "0.5" } },
    { version: 1, window: { transparency: true } },
    { version: 1, window: { transparency: null } },
    { version: 1, window: { transparency: -0.001 } },
    { version: 1, window: { transparency: 1.001 } },
    { version: 1, window: { blurStrength: 20 } },
    { version: 1, window: { opacity: 0.5 } },
    { version: 1, windowsShell: "" },
    { version: 1, windowsShell: null },
    { version: 1, windowsShell: "C:\\bad\0shell.exe" },
    { version: 1, confirmClose: 1 },
    { version: 1, logLevel: "trace" },
    { version: 1, theme: {} },
    { version: 1, theme: { path: "bad\0path" } },
    { version: 1, keybinds: { inventedAction: "Ctrl+A" } },
    { version: 1, keybinds: { newTab: "Shift+A" } },
    { version: 1, keybinds: { newTab: "Cmd+W" } },
  ])("rejects unsupported or invalid configuration %#", (input) => {
    expect(() => parse(input)).toThrow();
  });

  it("preserves every supported field rather than exporting only the visible controls", () => {
    const input = {
      version: 1,
      confirmClose: false,
      logLevel: "debug",
      windowsShell: "C:\\Tools\\pwsh.exe",
      font: {
        family: "Example Mono",
        size: 72,
        lineHeight: 1.5,
        ligatures: false,
      },
      terminal: { padding: { top: 0, right: 128, bottom: 8, left: 16 } },
      scrollback: { lines: 0 },
      keyboard: { optionAsAlt: "right" },
      window: {
        alwaysOnTop: true,
        showTitleBar: false,
        showTabBar: false,
        blur: true,
        transparency: 0.375,
      },
      theme: { path: "./themes/example.json" },
      keybinds: { newTab: "Cmd+Shift+Y", toggleTitleBar: "Ctrl+Alt+D" },
    };
    expect(parse(input)).toEqual(input);
  });

  it.each([0, 0.001, 0.375, 1])(
    "preserves transparency %s without clamping",
    (transparency) => {
      const input = { version: 1, window: { transparency, blur: false } };
      expect(parse(input)).toEqual(input);
    },
  );

  it("rejects non-finite transparency in otherwise valid JSON", () => {
    expect(() =>
      parseConfiguration(
        '{"version":1,"window":{"transparency":1e999}}',
        "darwin",
      ),
    ).toThrow("window.transparency");
  });

  it.each([
    "C:\\Tools\\pwsh.exe",
    "C:/Tools/pwsh.exe",
    "\\\\server\\share\\shell.exe",
    "\\Tools\\shell.exe",
    "/Tools/shell.exe",
  ])(
    "accepts Windows absolute-path syntax without inspecting %s",
    (windowsShell) => {
      expect(
        parseConfiguration(
          JSON.stringify({ version: 1, windowsShell }),
          "win32",
        ).windowsShell,
      ).toBe(windowsShell);
    },
  );

  it.each(["shell.exe", "C:shell.exe", "~/shell.exe", "%HOME%/shell.exe"])(
    "requires absolute Windows syntax only on the Windows target: %s",
    (windowsShell) => {
      const text = JSON.stringify({ version: 1, windowsShell });
      expect(() => parseConfiguration(text, "win32")).toThrow("absolute");
      for (const platform of ["darwin", "linux"] as const)
        expect(parseConfiguration(text, platform).windowsShell).toBe(
          windowsShell,
        );
    },
  );

  it.each(["darwin", "linux", "win32"] as const)(
    "keeps omitted defaults implicit on %s",
    (platform) => {
      expect(parseConfiguration('{"version":1}', platform)).toEqual({
        version: 1,
      });
      expect(parseConfiguration('{"version":1,"window":{}}', platform)).toEqual(
        { version: 1, window: {} },
      );
    },
  );

  it("checks collisions after target-specific modifier canonicalization", () => {
    const text = JSON.stringify({
      version: 1,
      keybinds: { newTab: "Ctrl+W", closeTab: "CmdOrCtrl+W" },
    });
    expect(() => parseConfiguration(text, "darwin")).not.toThrow();
    expect(() => parseConfiguration(text, "linux")).toThrow("conflicts");
  });

  it("checks Windows shell syntax without making host filesystem claims", () => {
    expect(() =>
      parseConfiguration('{"version":1,"windowsShell":"pwsh.exe"}', "win32"),
    ).toThrow("absolute");
    expect(() =>
      parseConfiguration('{"version":1,"windowsShell":"pwsh.exe"}', "darwin"),
    ).not.toThrow();
    expect(
      parseConfiguration(
        JSON.stringify({
          version: 1,
          windowsShell: "C:\\NotInstalled\\pwsh.exe",
        }),
        "win32",
      ).windowsShell,
    ).toBe("C:\\NotInstalled\\pwsh.exe");
  });

  it("resolves appearance defaults without inserting them into exported configuration", () => {
    const config = parse({ version: 1, terminal: { padding: { top: 20 } } });
    expect(resolvedAppearance(config).padding).toEqual({
      top: 20,
      right: 8,
      bottom: 8,
      left: 8,
    });
    expect(config).toEqual({ version: 1, terminal: { padding: { top: 20 } } });
  });
});
