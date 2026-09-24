import { expect, it } from "vitest";
import { applyKeybindSettings, keybindIssues } from "./keybind-settings";
import { keybindWarnings, type Configuration } from "./configuration";

it.each(["darwin", "linux", "win32"] as const)(
  "restores inherited defaults without exporting a full %s key map",
  (platform) => {
    const original: Configuration = {
      version: 1,
      font: { size: 20 },
      keybinds: { newTab: "Ctrl+Alt+Y", toggleSnippets: "Ctrl+Alt+S" },
    };
    const oneRestored = applyKeybindSettings(
      original,
      { toggleSnippets: "Ctrl+Alt+S" },
      platform,
    );
    expect(oneRestored.keybinds).toEqual({ toggleSnippets: "Ctrl+Alt+S" });
    expect(applyKeybindSettings(original, {}, platform)).toEqual({
      version: 1,
      font: { size: 20 },
    });
    expect(original.keybinds?.newTab).toBe("Ctrl+Alt+Y");
  },
);

it.each(["", "T", "Shift+T", "Ctrl+", "Cmd++", " Cmd+T", "Cmd+T ", "Alt+F25"])(
  "flags malformed shortcut text %j without applying it",
  (shortcut) => {
    expect(keybindIssues({ newTab: shortcut }, "darwin").newTab).toBeDefined();
    expect(() =>
      applyKeybindSettings({ version: 1 }, { newTab: shortcut }, "darwin"),
    ).toThrow();
  },
);

it.each(["darwin", "linux", "win32"] as const)(
  "retains warning-only shell-control remaps on %s",
  (platform) => {
    expect(keybindIssues({}, platform)).toEqual({});
    expect(keybindIssues({ newTab: "Ctrl+C" }, platform)).toEqual({});
    const config = applyKeybindSettings(
      { version: 1 },
      { newTab: "Ctrl+C" },
      platform,
    );
    expect(config.keybinds?.newTab).toBe("Ctrl+C");
    expect(keybindWarnings(config, platform)).toEqual([
      expect.stringContaining("SIGINT"),
    ]);
  },
);

it("identifies both sides of collisions against effective platform bindings", () => {
  const inherited = keybindIssues({ newTab: "Cmd+W" }, "darwin");
  expect(inherited.newTab).toContain("Close tab");
  expect(inherited.closeTab).toContain("New tab");
  const aliases = { newTab: "Ctrl+W", closeTab: "CmdOrCtrl+W" };
  expect(keybindIssues(aliases, "darwin")).toEqual({});
  expect(Object.keys(keybindIssues(aliases, "linux")).sort()).toEqual([
    "closeTab",
    "newTab",
  ]);
});

it("applies a shortcut swap atomically without changing unrelated configuration", () => {
  const original: Configuration = {
    version: 1,
    font: { family: "Example Mono", size: 18 },
    terminal: { padding: { top: 12 } },
    theme: { path: "./themes/mine.json" },
    logLevel: "debug",
  };
  const overrides = { newTab: "Cmd+W", closeTab: "Cmd+T" };
  expect(() =>
    applyKeybindSettings(original, { newTab: "Cmd+W" }, "darwin"),
  ).toThrow();
  expect(applyKeybindSettings(original, overrides, "darwin")).toEqual({
    ...original,
    keybinds: overrides,
  });
  expect(original).not.toHaveProperty("keybinds");
});
