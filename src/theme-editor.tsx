import { useEffect, useState } from "react";
import {
  isTerminalThemeColor,
  isTerminalThemeName,
  type TerminalTheme,
  type TerminalThemeColorKey,
} from "./contract/terminal-theme";
import { ANSI_NAMES, BRIGHT_NAMES } from "./preview";
import { Icon } from "./icons";

export const colorLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
const BASE_COLORS = [
  "background",
  "foreground",
  "cursor",
  "selectionBackground",
  "selectionForeground",
] as const;

export function ThemeEditor({
  theme,
  presets,
  reference,
  onChange,
  onPreset,
  onValidity,
}: {
  theme: TerminalTheme;
  presets: TerminalTheme[];
  reference: TerminalTheme;
  onChange: (theme: TerminalTheme) => void;
  onPreset: (theme: TerminalTheme) => void;
  onValidity: (valid: boolean) => void;
}) {
  const [selected, setSelected] =
    useState<TerminalThemeColorKey>("brightBlack");
  const [hex, setHex] = useState(theme.colors[selected]);
  const [name, setName] = useState(theme.name);
  const valid = isTerminalThemeColor(hex) && isTerminalThemeName(name);
  useEffect(() => setHex(theme.colors[selected]), [theme.colors, selected]);
  useEffect(() => setName(theme.name), [theme.name]);
  useEffect(() => {
    onValidity(valid);
    return () => onValidity(true);
  }, [valid, onValidity]);
  const changeColor = (value: string) => {
    setHex(value);
    if (isTerminalThemeColor(value))
      onChange({
        ...theme,
        colors: { ...theme.colors, [selected]: value.toLowerCase() },
      });
  };
  const swatch = (key: TerminalThemeColorKey) => (
    <button
      key={key}
      className={`swatch ${key === selected ? "is-selected" : ""}`}
      aria-label={`Edit ${colorLabel(key).toLowerCase()}`}
      aria-pressed={key === selected}
      onClick={() => setSelected(key)}
    >
      <i style={{ background: theme.colors[key] }} />
      <span>{colorLabel(key)}</span>
    </button>
  );
  return (
    <>
      <div className="section-heading">
        <h2>A starting point</h2>
        <span>Original palettes</span>
      </div>
      <div className="preset-list">
        {presets.map((preset) => (
          <button key={preset.name} onClick={() => onPreset(preset)}>
            <span>
              {preset.name === "omtheme-darkice" ? "Dark Ice" : "OMTheme"}
            </span>
            <span className="mini-palette">
              {["red", "green", "blue", "magenta"].map((key) => (
                <i
                  key={key}
                  style={{
                    background: preset.colors[key as TerminalThemeColorKey],
                  }}
                />
              ))}
            </span>
          </button>
        ))}
      </div>
      <label className="field">
        Theme name
        <input
          value={name}
          aria-invalid={!isTerminalThemeName(name)}
          onChange={(e) => {
            setName(e.target.value);
            if (isTerminalThemeName(e.target.value))
              onChange({ ...theme, name: e.target.value });
          }}
        />
      </label>
      {!isTerminalThemeName(name) && (
        <p className="field-error">
          Use 1–64 printable characters. This name has not been applied.
        </p>
      )}
      <div className="color-inspector">
        <div className="inspector-title">
          <strong>{colorLabel(selected)}</strong>
          <button
            className="icon-button"
            title="Restore this color from the reference"
            aria-label="Restore selected color"
            onClick={() => changeColor(reference.colors[selected])}
          >
            <Icon name="undo" />
          </button>
        </div>
        <div className="color-entry">
          <input
            type="color"
            aria-label={`${colorLabel(selected)} color picker`}
            value={theme.colors[selected]}
            onChange={(e) => changeColor(e.target.value)}
          />
          <input
            aria-label="Selected color hex"
            aria-invalid={!isTerminalThemeColor(hex)}
            value={hex}
            spellCheck={false}
            maxLength={7}
            onChange={(e) => changeColor(e.target.value)}
          />
        </div>
        {!isTerminalThemeColor(hex) && (
          <p className="field-error">
            Use #RRGGBB. This color has not been applied.
          </p>
        )}
        <div
          className="color-specimen"
          style={{
            background: theme.colors.background,
            color: theme.colors[selected],
          }}
        >
          <span>Normal</span>
          <strong>Bold</strong>
          <span style={{ opacity: 0.5 }}>Dim</span>
        </div>
      </div>
      <div className="section-heading">
        <h2>Surface</h2>
        <span>5 colors</span>
      </div>
      <div className="surface-colors">{BASE_COLORS.map(swatch)}</div>
      <div className="section-heading">
        <h2>ANSI palette</h2>
        <span>Normal / bright</span>
      </div>
      <div className="ansi-colors">
        {ANSI_NAMES.map((key, i) => (
          <div className="ansi-pair" key={key}>
            {swatch(key)}
            {swatch(BRIGHT_NAMES[i])}
          </div>
        ))}
      </div>
    </>
  );
}
