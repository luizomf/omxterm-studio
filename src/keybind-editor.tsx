import { useEffect, useId, useState } from "react";
import {
  keybindWarnings,
  type Configuration,
  type Platform,
} from "./configuration";
import { Icon } from "./icons";
import {
  MAX_ACCELERATOR_LENGTH,
  terminalDefaultKeybinds,
  TERMINAL_ACTION_NAMES,
} from "./contract/terminal-keybinds";
import {
  applyKeybindSettings,
  KEYBIND_LABELS,
  keybindIssues,
  type KeybindOverrides,
} from "./keybind-settings";

export function KeybindEditor({
  config,
  platform,
  onChange,
  onPendingChange,
  onError,
}: {
  config: Configuration;
  platform: Platform;
  onChange: (config: Configuration) => void;
  onPendingChange: (pending: boolean) => void;
  onError: (message: string) => void;
}) {
  const id = useId();
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const actions = TERMINAL_ACTION_NAMES.filter(
    (action) =>
      KEYBIND_LABELS[action].toLowerCase().includes(query) ||
      action.toLowerCase().includes(query),
  );
  const source = JSON.stringify(config.keybinds ?? {});
  const [draft, setDraft] = useState<KeybindOverrides>({ ...config.keybinds });
  // Track binding values rather than config identity: a font adjustment must
  // not discard staged shortcuts. This source is already validated config.
  useEffect(() => setDraft(JSON.parse(source) as KeybindOverrides), [source]);
  const defaults = terminalDefaultKeybinds(platform);
  const issues = keybindIssues(draft, platform);
  const issueCount = Object.keys(issues).length;
  const changeCount = TERMINAL_ACTION_NAMES.filter(
    (action) => draft[action] !== config.keybinds?.[action],
  ).length;
  const warnings = changeCount
    ? keybindWarnings({ version: 1, keybinds: draft }, platform)
    : [];
  useEffect(
    () => onPendingChange(changeCount > 0),
    [changeCount, onPendingChange],
  );
  const apply = () => {
    try {
      onChange(applyKeybindSettings(config, draft, platform));
    } catch (cause) {
      onError(
        cause instanceof Error ? cause.message : "Invalid keyboard shortcuts.",
      );
    }
  };
  return (
    <details className="keybind-editor json-editor">
      <summary>Keyboard shortcuts</summary>
      <p className="hint">
        Type combinations such as Cmd+Shift+T or Ctrl+Alt+K. Use Plus for +.
        These settings control OMXTerm, not this website; no keys are recorded.
      </p>
      <label className="field">
        Filter shortcuts
        <input
          type="search"
          placeholder="Find an action…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="keybind-toolbar">
        <button
          className="secondary-button"
          disabled={!changeCount || issueCount > 0}
          onClick={apply}
        >
          Apply shortcuts
        </button>
        <button
          className="secondary-button"
          aria-label="Discard shortcut edits"
          disabled={!changeCount}
          onClick={() => setDraft({ ...config.keybinds })}
        >
          Discard edits
        </button>
        <p className="hint" aria-live="polite">
          {issueCount
            ? `${issueCount} shortcut fields need attention.`
            : changeCount
              ? `${changeCount} unapplied shortcut changes.`
              : "Platform defaults apply unless overridden."}
        </p>
      </div>
      {warnings.length > 0 && (
        <div aria-live="polite">
          <p className="hint">Pending shortcut warnings (still allowed)</p>
          {warnings.map((warning) => (
            <p className="warning" key={warning}>
              {warning}
            </p>
          ))}
        </div>
      )}
      <div className="keybind-rows">
        {!actions.length && <p className="hint">No matching shortcuts.</p>}
        {actions.map((action) => {
          const fieldId = `${id}-${action}`;
          return (
            <div className="keybind-row" key={action}>
              <label htmlFor={fieldId}>
                {KEYBIND_LABELS[action]}{" "}
                <span>
                  {draft[action] === undefined ? "Default" : "Custom"}
                </span>
              </label>
              <div className="keybind-input">
                <input
                  id={fieldId}
                  aria-label={`${KEYBIND_LABELS[action]} shortcut`}
                  aria-invalid={Boolean(issues[action])}
                  aria-describedby={
                    issues[action] ? `${fieldId}-error` : undefined
                  }
                  value={draft[action] ?? defaults[action]}
                  maxLength={MAX_ACCELERATOR_LENGTH}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft((current) => ({ ...current, [action]: value }));
                  }}
                />
                <button
                  className="icon-button"
                  aria-label={`Restore ${KEYBIND_LABELS[action]} default`}
                  title={`Restore default: ${defaults[action]}`}
                  disabled={draft[action] === undefined}
                  onClick={() =>
                    setDraft((current) => {
                      const next = { ...current };
                      delete next[action];
                      return next;
                    })
                  }
                >
                  <Icon name="undo" />
                </button>
              </div>
              {issues[action] && (
                <p className="field-error" id={`${fieldId}-error`}>
                  {issues[action]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
