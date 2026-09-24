import { strToU8, zipSync } from "fflate";
import { isTerminalTheme, type TerminalTheme } from "./contract/terminal-theme";
import {
  parseConfiguration,
  type Configuration,
  type Platform,
} from "./configuration";

export const MAX_DOCUMENT_BYTES = 256 * 1024;

export async function readDocumentFile(file: File): Promise<string> {
  if (file.size > MAX_DOCUMENT_BYTES)
    throw new Error("Choose a JSON file no larger than 256 KiB.");
  const bytes = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("The file must contain valid UTF-8 text.");
  }
}

export function download(
  name: string,
  content: string | Uint8Array,
  type: string,
): void {
  const part =
    typeof content === "string" ? content : new Uint8Array(content).buffer;
  const url = URL.createObjectURL(new Blob([part], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseTheme(text: string): TerminalTheme {
  const value: unknown = JSON.parse(text);
  if (!isTerminalTheme(value)) {
    throw new Error(
      "Expected a version-1 theme with a printable name and exactly 21 #RRGGBB colors. Unknown fields are not supported.",
    );
  }
  return value;
}

export function jsonDocument(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}

export function createBundle(
  config: Configuration,
  theme: TerminalTheme,
  platform: Platform,
): Uint8Array {
  const exported = parseConfiguration(
    jsonDocument({ ...config, theme: { path: "./themes/theme.json" } }),
    platform,
  );
  const palette = parseTheme(jsonDocument(theme));
  return zipSync({
    "config.json": strToU8(jsonDocument(exported)),
    "themes/theme.json": strToU8(jsonDocument(palette)),
  });
}
