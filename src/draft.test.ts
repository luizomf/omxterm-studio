import { expect, it } from "vitest";
import { decodeDraft, encodeDraft } from "./draft";
import omtheme from "./presets/omtheme.json";
import { parseTheme } from "./documents";

it.each(["darwin", "linux", "win32"] as const)(
  "round trips a %s draft while revalidating both untrusted documents",
  (platform) => {
    const draft = {
      theme: parseTheme(JSON.stringify(omtheme)),
      config: { version: 1 as const, font: { size: 20 } },
      platform,
    };
    expect(decodeDraft(encodeDraft(draft))).toEqual(draft);
    const invalid = {
      version: 1,
      ...draft,
      config: { version: 1, font: { size: 999 } },
    };
    expect(() => decodeDraft(JSON.stringify(invalid))).toThrow("font.size");
  },
);

it.each([
  { platform: ["win32"] },
  { platform: [["win32"]] },
  { platform: ["darwin"] },
  { platform: ["linux"] },
  { platform: { name: "win32" } },
  { platform: null },
])(
  "rejects non-string platforms before restoring a draft %#",
  ({ platform }) => {
    const saved = JSON.stringify({
      version: 1,
      theme: omtheme,
      platform,
      config: {
        version: 1,
        windowsShell: "pwsh.exe",
        keybinds: { newTab: "Control+Shift+Q" },
      },
    });
    expect(() => decodeDraft(saved)).toThrow();
  },
);

it.each([
  "garbage",
  "null",
  "[]",
  '{"version":2}',
  '{"version":1,"platform":"unknown"}',
  " ".repeat(524289),
])("rejects corrupt or oversized stored drafts %#", (text) => {
  expect(() => decodeDraft(text)).toThrow();
});
