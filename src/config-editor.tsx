import { useEffect, useState } from "react";
import {
  DEFAULT_PADDING,
  keybindWarnings,
  PADDING_SIDES,
  type Configuration,
  type Platform,
} from "./configuration";
import { jsonDocument } from "./documents";

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onError,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onError: (message: string) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <label className="field">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onBlur={() => {
          const number = Number(text);
          if (
            !text ||
            !Number.isFinite(number) ||
            number < min ||
            number > max ||
            (step === 1 && !Number.isInteger(number))
          ) {
            setText(String(value));
            onError(
              `${label}: use ${min}–${max}${step === 1 ? " in whole numbers" : ""}. The invalid edit was not applied.`,
            );
            return;
          }
          onChange(number);
        }}
      />
    </label>
  );
}

export function ConfigEditor({
  config,
  platform,
  onChange,
  onPlatform,
  onApplyJson,
  onPendingJson,
  onError,
}: {
  config: Configuration;
  platform: Platform;
  onChange: (value: Configuration) => void;
  onPlatform: (value: Platform) => void;
  onApplyJson: (text: string) => void;
  onPendingJson: (pending: boolean) => void;
  onError: (message: string) => void;
}) {
  const [json, setJson] = useState(jsonDocument(config));
  const [shell, setShell] = useState(config.windowsShell ?? "");
  const pendingJson = json !== jsonDocument(config);
  useEffect(() => setJson(jsonDocument(config)), [config]);
  useEffect(() => onPendingJson(pendingJson), [pendingJson, onPendingJson]);
  useEffect(() => setShell(config.windowsShell ?? ""), [config.windowsShell]);
  const font = (value: NonNullable<Configuration["font"]>) =>
    onChange({ ...config, font: { ...config.font, ...value } });
  const warnings = keybindWarnings(config, platform);
  return (
    <>
      <div className="section-heading">
        <h2>Make it yours</h2>
        <span>Config v1</span>
      </div>
      <label className="field">
        Target platform
        <select
          value={platform}
          onChange={(e) => onPlatform(e.target.value as Platform)}
        >
          <option value="darwin">macOS</option>
          <option value="linux">Linux</option>
          <option value="win32">Windows</option>
        </select>
      </label>
      <label className="field">
        Installed font family
        <input
          placeholder="OMXTerm default"
          maxLength={256}
          value={config.font?.family ?? ""}
          onChange={(e) => font({ family: e.target.value || undefined })}
        />
      </label>
      <p className="hint">
        The browser tries this local family, then monospace. No font files are
        read. Availability and rendering can differ in OMXTerm.
      </p>
      <div className="field-pair">
        <NumberField
          label="Font size (px)"
          value={config.font?.size ?? 16}
          min={8}
          max={72}
          onChange={(size) => font({ size })}
          onError={onError}
        />
        <NumberField
          label="Line height"
          value={config.font?.lineHeight ?? 1}
          min={1}
          max={2}
          step={0.05}
          onChange={(lineHeight) => font({ lineHeight })}
          onError={onError}
        />
      </div>
      <label className="check-field">
        <input
          type="checkbox"
          checked={config.font?.ligatures ?? true}
          onChange={(e) => font({ ligatures: e.target.checked })}
        />
        Programming ligatures
      </label>
      <div className="section-heading">
        <h2>Breathing room</h2>
        <span>Padding · px</span>
      </div>
      <div className="padding-fields">
        {PADDING_SIDES.map((side) => (
          <NumberField
            key={side}
            label={side[0].toUpperCase() + side.slice(1)}
            value={config.terminal?.padding?.[side] ?? DEFAULT_PADDING[side]}
            min={0}
            max={128}
            onChange={(value) =>
              onChange({
                ...config,
                terminal: {
                  padding: { ...config.terminal?.padding, [side]: value },
                },
              })
            }
            onError={onError}
          />
        ))}
      </div>
      <div className="section-heading">
        <h2>Beyond appearance</h2>
        <span>Export only</span>
      </div>
      <NumberField
        label="Scrollback lines"
        value={config.scrollback?.lines ?? 10000}
        min={0}
        max={100000}
        onChange={(lines) => onChange({ ...config, scrollback: { lines } })}
        onError={onError}
      />
      <label className="field">
        Option key as Alt
        <select
          value={config.keyboard?.optionAsAlt ?? "none"}
          onChange={(e) =>
            onChange({
              ...config,
              keyboard: {
                optionAsAlt: e.target.value as
                  "none" | "left" | "right" | "both",
              },
            })
          }
        >
          {["none", "left", "right", "both"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Log level
        <select
          value={config.logLevel ?? "info"}
          onChange={(e) =>
            onChange({
              ...config,
              logLevel: e.target.value as "info" | "debug" | "error",
            })
          }
        >
          {["error", "info", "debug"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={config.confirmClose ?? true}
          onChange={(e) =>
            onChange({ ...config, confirmClose: e.target.checked })
          }
        />
        Confirm closing busy sessions
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={config.window?.alwaysOnTop ?? false}
          onChange={(e) =>
            onChange({ ...config, window: { alwaysOnTop: e.target.checked } })
          }
        />
        New windows always on top
      </label>
      <label className="field">
        Windows shell path
        <input
          placeholder="Use the application default"
          value={shell}
          onChange={(e) => setShell(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onBlur={() =>
            onChange({ ...config, windowsShell: shell || undefined })
          }
        />
      </label>
      <p className="hint">
        Native behavior is not simulated. The browser cannot validate installed
        fonts, files, or shell executables.
      </p>
      <details className="json-editor">
        <summary>Configuration JSON & keybindings</summary>
        <p className="hint">
          Edit any supported v1 field. Apply validates the entire document for
          the target platform. Imported paths are never opened. Unapplied text
          stays in this tab only; apply it to include it in downloads and saved
          drafts.
        </p>
        <textarea
          aria-label="Configuration JSON"
          spellCheck={false}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          maxLength={262144}
        />
        <button className="secondary-button" onClick={() => onApplyJson(json)}>
          Apply JSON
        </button>
      </details>
      {warnings.map((warning) => (
        <p className="warning" key={warning}>
          {warning}
        </p>
      ))}
    </>
  );
}
