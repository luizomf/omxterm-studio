import {
  parseConfiguration,
  type Configuration,
  type Platform,
} from "./configuration";
import type { TerminalTheme } from "./contract/terminal-theme";
import { MAX_DOCUMENT_BYTES, parseTheme } from "./documents";

export const DRAFT_KEY = "omxterm-studio:draft:v1";
export interface Draft {
  theme: TerminalTheme;
  config: Configuration;
  platform: Platform;
}

export function decodeDraft(text: string): Draft {
  if (text.length > MAX_DOCUMENT_BYTES * 2)
    throw new Error("Saved draft is too large.");
  const value: unknown = JSON.parse(text);
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Invalid saved draft.");
  const draft = value as Record<string, unknown>;
  if (
    draft.version !== 1 ||
    typeof draft.platform !== "string" ||
    !["darwin", "linux", "win32"].includes(draft.platform)
  )
    throw new Error("Unsupported saved draft.");
  const platform = draft.platform as Platform;
  return {
    theme: parseTheme(JSON.stringify(draft.theme)),
    config: parseConfiguration(JSON.stringify(draft.config), platform),
    platform,
  };
}

export function encodeDraft(draft: Draft): string {
  return JSON.stringify({ version: 1, ...draft });
}
