import type { TerminalTheme } from "./contract/terminal-theme";

export interface ThemeHistory {
  past: TerminalTheme[];
  present: TerminalTheme;
  future: TerminalTheme[];
}

export function createHistory(theme: TerminalTheme): ThemeHistory {
  return { past: [], present: theme, future: [] };
}

export function changeTheme(
  history: ThemeHistory,
  theme: TerminalTheme,
): ThemeHistory {
  if (JSON.stringify(theme) === JSON.stringify(history.present)) return history;
  return {
    past: [...history.past, history.present].slice(-60),
    present: theme,
    future: [],
  };
}

export function undoTheme(history: ThemeHistory): ThemeHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoTheme(history: ThemeHistory): ThemeHistory {
  const next = history.future[0];
  if (!next) return history;
  return {
    past: [...history.past, history.present].slice(-60),
    present: next,
    future: history.future.slice(1),
  };
}
