import {
  canonicalAccelerator,
  shadowedControlKeyBindings,
  terminalDefaultKeybinds,
  TERMINAL_ACTION_NAMES,
  type TerminalActionName,
} from "./contract/terminal-keybinds";

export type Platform = "darwin" | "linux" | "win32";
export type PaddingSide = "top" | "right" | "bottom" | "left";
export interface Configuration {
  version: 1;
  confirmClose?: boolean;
  logLevel?: "error" | "info" | "debug";
  windowsShell?: string;
  font?: {
    family?: string;
    size?: number;
    lineHeight?: number;
    ligatures?: boolean;
  };
  terminal?: { padding?: Partial<Record<PaddingSide, number>> };
  scrollback?: { lines?: number };
  keyboard?: { optionAsAlt?: "none" | "left" | "right" | "both" };
  window?: { alwaysOnTop?: boolean };
  theme?: { path: string };
  keybinds?: Partial<Record<TerminalActionName, string>>;
}

export const PADDING_SIDES = ["top", "right", "bottom", "left"] as const;
export const DEFAULT_PADDING = { top: 0, right: 8, bottom: 8, left: 8 };
export const DEFAULT_CONFIGURATION: Configuration = { version: 1 };

function object(value: unknown, location: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${location} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function keys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  location: string,
) {
  const invalid = Object.keys(value).find((key) => !allowed.includes(key));
  if (invalid !== undefined)
    throw new Error(`${location}.${invalid} is not supported.`);
}

function range(
  value: unknown,
  location: string,
  min: number,
  max: number,
  integer = true,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    throw new Error(
      `${location} must be ${integer ? "an integer" : "a number"} from ${min} to ${max}.`,
    );
  }
}

function boolean(value: unknown, location: string) {
  if (typeof value !== "boolean")
    throw new Error(`${location} must be a boolean.`);
}

function choice(value: unknown, allowed: readonly string[], location: string) {
  if (typeof value !== "string" || !allowed.includes(value))
    throw new Error(`${location} must be one of: ${allowed.join(", ")}.`);
}

function pathString(value: unknown, location: string): asserts value is string {
  if (typeof value !== "string" || !value.length || value.includes("\0"))
    throw new Error(`${location} must be a non-empty string without NUL.`);
}

function optionalObject(
  root: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
) {
  if (!(key in root)) return undefined;
  const result = object(root[key], key);
  keys(result, allowed, key);
  return result;
}

// Schema checks only: browsers cannot inspect the target machine's fonts, paths,
// shell executables, or native shortcut registration.
export function parseConfiguration(
  text: string,
  platform: Platform,
): Configuration {
  const root = object(JSON.parse(text) as unknown, "configuration");
  keys(
    root,
    [
      "version",
      "confirmClose",
      "logLevel",
      "windowsShell",
      "font",
      "terminal",
      "scrollback",
      "keyboard",
      "window",
      "theme",
      "keybinds",
    ],
    "configuration",
  );
  if (root.version !== 1) throw new Error("configuration.version must be 1.");
  if ("confirmClose" in root) boolean(root.confirmClose, "confirmClose");
  if ("logLevel" in root)
    choice(root.logLevel, ["error", "info", "debug"], "logLevel");
  if ("windowsShell" in root) {
    pathString(root.windowsShell, "windowsShell");
    if (
      platform === "win32" &&
      !/^(?:[a-z]:[\\/]|[\\/])/i.test(root.windowsShell)
    )
      throw new Error("windowsShell must be an absolute Windows path.");
  }
  const font = optionalObject(root, "font", [
    "family",
    "size",
    "lineHeight",
    "ligatures",
  ]);
  if (font) {
    if (
      "family" in font &&
      (typeof font.family !== "string" ||
        font.family.length === 0 ||
        font.family.length > 256 ||
        // Reject C0 and DEL at the font-family boundary, matching OMXTerm.
        // oxlint-disable-next-line no-control-regex
        /[\u0000-\u001f\u007f]/u.test(font.family))
    )
      throw new Error(
        "font.family must be a printable name of 1–256 characters.",
      );
    if ("size" in font) range(font.size, "font.size", 8, 72);
    if ("lineHeight" in font)
      range(font.lineHeight, "font.lineHeight", 1, 2, false);
    if ("ligatures" in font) boolean(font.ligatures, "font.ligatures");
  }
  const terminal = optionalObject(root, "terminal", ["padding"]);
  if (terminal && "padding" in terminal) {
    const padding = object(terminal.padding, "terminal.padding");
    keys(padding, PADDING_SIDES, "terminal.padding");
    for (const side of PADDING_SIDES)
      if (side in padding)
        range(padding[side], `terminal.padding.${side}`, 0, 128);
  }
  const scrollback = optionalObject(root, "scrollback", ["lines"]);
  if (scrollback && "lines" in scrollback)
    range(scrollback.lines, "scrollback.lines", 0, 100_000);
  const keyboard = optionalObject(root, "keyboard", ["optionAsAlt"]);
  if (keyboard && "optionAsAlt" in keyboard)
    choice(
      keyboard.optionAsAlt,
      ["none", "left", "right", "both"],
      "keyboard.optionAsAlt",
    );
  const window = optionalObject(root, "window", ["alwaysOnTop"]);
  if (window && "alwaysOnTop" in window)
    boolean(window.alwaysOnTop, "window.alwaysOnTop");
  const theme = optionalObject(root, "theme", ["path"]);
  if (theme) pathString(theme.path, "theme.path");
  const keybinds = optionalObject(root, "keybinds", TERMINAL_ACTION_NAMES);
  const effective = { ...terminalDefaultKeybinds(platform), ...keybinds };
  const seen = new Map<string, string>();
  for (const action of TERMINAL_ACTION_NAMES) {
    const value = effective[action];
    const canonical =
      typeof value === "string"
        ? canonicalAccelerator(value, platform)
        : undefined;
    if (canonical === undefined)
      throw new Error(
        `keybinds.${action} needs a non-Shift modifier and one key.`,
      );
    if (seen.has(canonical))
      throw new Error(
        `keybinds.${action} conflicts with ${seen.get(canonical)} on ${platform}.`,
      );
    seen.set(canonical, action);
  }
  return root as unknown as Configuration;
}

export function keybindWarnings(
  config: Configuration,
  platform: Platform,
): string[] {
  return shadowedControlKeyBindings(
    { ...terminalDefaultKeybinds(platform), ...config.keybinds },
    platform,
  ).map(
    ({ action, controlKey, shadows }) =>
      `${action}: ${controlKey} shadows ${shadows} on the target platform.`,
  );
}

export function resolvedAppearance(config: Configuration) {
  return {
    family: config.font?.family,
    size: config.font?.size ?? 16,
    lineHeight: config.font?.lineHeight ?? 1,
    ligatures: config.font?.ligatures ?? true,
    padding: { ...DEFAULT_PADDING, ...config.terminal?.padding },
  };
}
