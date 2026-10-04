import { useEffect, useState } from "react";
import {
  DEFAULT_PADDING,
  keybindWarnings,
  PADDING_SIDES,
  type Configuration,
  type Platform,
} from "./configuration";
import { jsonDocument } from "./documents";
import { KeybindEditor } from "./keybind-editor";

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
  step?: number | "any";
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
          if (number !== value) onChange(number);
        }}
      />
    </label>
  );
}

export function ConfigEditor({
  config,
  platform,
  pendingShortcuts,
  onChange,
  onPlatform,
  onApplyJson,
  onPendingJson,
  onPendingShortcuts,
  onError,
}: {
  config: Configuration;
  platform: Platform;
  pendingShortcuts: boolean;
  onChange: (value: Configuration) => void;
  onPlatform: (value: Platform) => void;
  onApplyJson: (text: string) => void;
  onPendingJson: (pending: boolean) => void;
  onPendingShortcuts: (pending: boolean) => void;
  onError: (message: string) => void;
}) {
  const appliedJson = jsonDocument(config);
  const [jsonDraft, setJsonDraft] = useState({
    source: config,
    text: appliedJson,
  });
  const [shell, setShell] = useState(config.windowsShell ?? "");
  // Applied updates must not briefly look like pending JSON and disable the
  // focused form input while the synchronization effect catches up.
  const json = jsonDraft.source === config ? jsonDraft.text : appliedJson;
  const pendingJson = json !== appliedJson;
  useEffect(
    () => setJsonDraft({ source: config, text: appliedJson }),
    [config, appliedJson],
  );
  useEffect(() => onPendingJson(pendingJson), [pendingJson, onPendingJson]);
  useEffect(() => setShell(config.windowsShell ?? ""), [config.windowsShell]);
  const font = (value: NonNullable<Configuration["font"]>) =>
    onChange({ ...config, font: { ...config.font, ...value } });
  const windowPreference = (value: NonNullable<Configuration["window"]>) =>
    onChange({ ...config, window: { ...config.window, ...value } });
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
      <p className="hint">
        Choose the system that will use these files before importing. Omitted
        settings keep OMXTerm defaults; opening a control does not add them to
        your JSON.
      </p>
      {pendingJson && (
        <p className="warning">
          Apply or discard Configuration JSON before editing the configuration
          controls.
        </p>
      )}
      <fieldset
        className="configuration-controls"
        aria-label="Configuration controls"
        disabled={pendingJson}
      >
        <details className="window-settings" open>
          <summary>Window & background</summary>
          <p className="hint">
            Preview + export. Title/tab visibility updates here immediately.
            Transparency and blur are CSS simulations over a fictional sky on
            every target, not a guarantee of native effects or fallbacks.
          </p>
          <NumberField
            label="Background transparency (0–1)"
            value={config.window?.transparency ?? 0}
            min={0}
            max={1}
            step="any"
            onChange={(transparency) => windowPreference({ transparency })}
            onError={onError}
          />
          <p className="hint">
            0 is opaque; 1 removes the background tint where supported. Text,
            cursor, selection and explicit terminal backgrounds do not fade.
          </p>
          <label className="check-field">
            <input
              type="checkbox"
              checked={config.window?.blur ?? false}
              onChange={(e) => windowPreference({ blur: e.target.checked })}
            />
            Request native blur
          </label>
          <p className="hint">
            Blur needs transparency above 0. Both settings apply on reload;
            visible results depend on the operating system.
            {platform === "darwin"
              ? " macOS prefers direct background blur, with HUD vibrancy as fallback."
              : platform === "win32"
                ? " Windows stays opaque without blur. Acrylic requires Windows 11 22H2 or later and may still fall back to an opaque theme."
                : " Linux blur is best effort on X11 with xprop and a supporting compositor. Native Wayland blur is not supported."}
          </p>
          <label className="check-field">
            <input
              type="checkbox"
              checked={config.window?.showTitleBar ?? true}
              onChange={(e) =>
                windowPreference({ showTitleBar: e.target.checked })
              }
            />
            Show title bar in new windows
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={config.window?.showTabBar ?? true}
              onChange={(e) =>
                windowPreference({ showTabBar: e.target.checked })
              }
            />
            Show tab bar in new windows
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              checked={config.window?.alwaysOnTop ?? false}
              onChange={(e) =>
                windowPreference({ alwaysOnTop: e.target.checked })
              }
            />
            New windows always on top
          </label>
          <p className="hint">
            Always-on-top is export-only. In OMXTerm, these three defaults
            affect new windows, not existing windows on reload. The tab bar also
            needs at least two tabs; Studio has three demo tabs. Use OMXTerm's
            menu or shortcuts to toggle an existing window.
          </p>
        </details>
        <KeybindEditor
          config={config}
          platform={platform}
          onChange={onChange}
          onPendingChange={onPendingShortcuts}
          onError={onError}
        />
        <div className="section-heading">
          <h2>Font & spacing</h2>
          <span>Preview + export</span>
        </div>
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
          read. Leave blank for OMXTerm's bundled FiraCode Nerd Font Mono.
          Availability and rendering can differ in OMXTerm.
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
          Leave blank for the application default. On Windows, use an absolute
          path to an existing file, with no arguments or variable expansion.
          Accepted but unused on macOS/Linux. Studio checks syntax only; OMXTerm
          checks the file on Windows.
        </p>
      </fieldset>
      <details className="json-editor">
        <summary>Configuration JSON & keybindings</summary>
        <p className="hint">
          Edit any supported v1 field. Apply validates the entire document for
          the target platform. Imported paths are never opened. Unapplied text
          stays in this tab only; apply it to include it in downloads and saved
          drafts.
        </p>
        {pendingShortcuts && (
          <p className="warning">
            Apply or discard shortcut edits before editing Configuration JSON.
          </p>
        )}
        <textarea
          aria-label="Configuration JSON"
          disabled={pendingShortcuts}
          spellCheck={false}
          value={json}
          onChange={(e) =>
            setJsonDraft({ source: config, text: e.target.value })
          }
          maxLength={262144}
        />
        <div className="json-actions">
          <button
            className="secondary-button"
            disabled={pendingShortcuts}
            onClick={() => onApplyJson(json)}
          >
            Apply JSON
          </button>
          <button
            className="secondary-button"
            disabled={!pendingJson}
            onClick={() => setJsonDraft({ source: config, text: appliedJson })}
          >
            Discard JSON edits
          </button>
        </div>
      </details>
      {warnings.length > 0 && <p className="hint">Applied shortcut warnings</p>}
      {warnings.map((warning) => (
        <p className="warning" key={warning}>
          {warning}
        </p>
      ))}
    </>
  );
}
