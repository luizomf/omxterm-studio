import {
  parseConfiguration,
  type Configuration,
  type Platform,
} from "./configuration";

import {
  canonicalAccelerator,
  terminalDefaultKeybinds,
  TERMINAL_ACTION_NAMES,
  type TerminalActionName,
} from "./contract/terminal-keybinds";

export const KEYBIND_LABELS: Readonly<Record<TerminalActionName, string>> = {
  quit: "Quit OMXTerm",
  copy: "Copy",
  paste: "Paste",
  selectAll: "Select all",
  newWindow: "New window",
  closeWindow: "Close window",
  newTab: "New tab",
  closeTab: "Close tab",
  nextTab: "Next tab",
  previousTab: "Previous tab",
  selectTab1: "Select tab 1",
  selectTab2: "Select tab 2",
  selectTab3: "Select tab 3",
  selectTab4: "Select tab 4",
  selectTab5: "Select tab 5",
  selectTab6: "Select tab 6",
  selectTab7: "Select tab 7",
  selectTab8: "Select tab 8",
  selectTab9: "Select tab 9",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  actualSize: "Reset zoom",
  toggleFullScreen: "Toggle fullscreen",
  toggleSnippets: "Toggle snippets",
  toggleTabBar: "Toggle tab bar",
  reloadConfig: "Reload configuration",
};

export function keybindIssues(
  keybinds: KeybindOverrides,
  platform: Platform,
): Partial<Record<TerminalActionName, string>> {
  const effective = { ...terminalDefaultKeybinds(platform), ...keybinds };
  const issues: Partial<Record<TerminalActionName, string>> = {};
  const seen = new Map<string, TerminalActionName>();
  for (const action of TERMINAL_ACTION_NAMES) {
    const canonical = canonicalAccelerator(effective[action], platform);
    if (canonical === undefined) {
      issues[action] = "Use a non-Shift modifier and one key; spell + as Plus.";
      continue;
    }
    const other = seen.get(canonical);
    if (other) {
      issues[action] = `Conflicts with ${KEYBIND_LABELS[other]}.`;
      issues[other] = `Conflicts with ${KEYBIND_LABELS[action]}.`;
    } else seen.set(canonical, action);
  }
  return issues;
}

export type KeybindOverrides = NonNullable<Configuration["keybinds"]>;

export function applyKeybindSettings(
  config: Configuration,
  keybinds: KeybindOverrides,
  platform: Platform,
): Configuration {
  return parseConfiguration(
    JSON.stringify({
      ...config,
      keybinds: Object.keys(keybinds).length ? keybinds : undefined,
    }),
    platform,
  );
}
