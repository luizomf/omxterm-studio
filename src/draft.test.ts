import { expect, it } from "vitest";
import { decodeDraft, encodeDraft } from "./draft";
import omtheme from "./presets/omtheme.json";
import { parseTheme } from "./documents";

it("round trips a draft while revalidating both untrusted documents", () => {
  const draft = {
    theme: parseTheme(JSON.stringify(omtheme)),
    config: { version: 1 as const, font: { size: 20 } },
    platform: "darwin" as const,
  };
  expect(decodeDraft(encodeDraft(draft))).toEqual(draft);
  const invalid = {
    version: 1,
    ...draft,
    config: { version: 1, font: { size: 999 } },
  };
  expect(() => decodeDraft(JSON.stringify(invalid))).toThrow("font.size");
});

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
