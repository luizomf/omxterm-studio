import { expect, it } from "vitest";
import {
  createHistory,
  changeTheme,
  undoTheme,
  redoTheme,
} from "./theme-history";
import { parseTheme } from "./documents";
import omtheme from "./presets/omtheme.json";

it("restores prior colors and discards redo after a different edit", () => {
  const first = parseTheme(JSON.stringify(omtheme));
  const edited = { ...first, colors: { ...first.colors, blue: "#123456" } };
  const history = changeTheme(createHistory(first), edited);
  const undone = undoTheme(history);
  expect(undone.present.colors.blue).toBe("#88aaf2");
  expect(redoTheme(undone).present.colors.blue).toBe("#123456");
  const branch = changeTheme(undone, { ...first, name: "new branch" });
  expect(redoTheme(branch).present.name).toBe("new branch");
});
