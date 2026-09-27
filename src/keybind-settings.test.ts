import { expect, it } from "vitest";
import { applyKeybindSettings, keybindIssues } from "./keybind-settings";
import { keybindWarnings, type Configuration } from "./configuration";
import {
  TERMINAL_ACTION_NAMES,
  terminalDefaultKeybinds,
} from "./contract/terminal-keybinds";

it("covers exactly the desktop's 27 configuration actions", () => {
  expect(TERMINAL_ACTION_NAMES).toEqual([
    "quit",
    "copy",
    "paste",
    "selectAll",
    "newWindow",
    "closeWindow",
    "newTab",
    "closeTab",
    "nextTab",
    "previousTab",
    "selectTab1",
    "selectTab2",
    "selectTab3",
    "selectTab4",
    "selectTab5",
    "selectTab6",
    "selectTab7",
    "selectTab8",
    "selectTab9",
    "zoomIn",
    "zoomOut",
    "actualSize",
    "toggleFullScreen",
    "toggleSnippets",
    "toggleTabBar",
    "toggleTitleBar",
    "reloadConfig",
  ]);
});

it.each([
  ["darwin", "CommandOrControl+Shift+D", "Cmd+Shift+D"],
  ["linux", "Control+Shift+D", "Ctrl+Shift+D"],
  ["win32", "Control+Shift+D", "Ctrl+Shift+D"],
] as const)(
  "inherits the title-bar shortcut and checks aliases on %s",
  (platform, inherited, alias) => {
    expect(terminalDefaultKeybinds(platform).toggleTitleBar).toBe(inherited);
    expect(keybindIssues({}, platform)).toEqual({});
    expect(keybindIssues({ newTab: alias }, platform)).toEqual({
      newTab: "Conflicts with Toggle title bar.",
      toggleTitleBar: "Conflicts with New tab.",
    });
    const config: Configuration = {
      version: 1,
      window: { showTitleBar: false, blur: true, transparency: 0.4 },
    };
    expect(
      applyKeybindSettings(config, { toggleTitleBar: "Alt+Shift+D" }, platform),
    ).toEqual({ ...config, keybinds: { toggleTitleBar: "Alt+Shift+D" } });
    expect(applyKeybindSettings(config, {}, platform)).toEqual(config);
  },
);

it("rechecks the title-bar default against target-specific CmdOrCtrl aliases", () => {
  const overrides = { newTab: "Ctrl+Shift+D" };
  expect(keybindIssues(overrides, "darwin")).toEqual({});
  expect(keybindIssues(overrides, "linux").newTab).toContain(
    "Toggle title bar",
  );
  expect(keybindIssues(overrides, "win32").newTab).toContain(
    "Toggle title bar",
  );
});

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
