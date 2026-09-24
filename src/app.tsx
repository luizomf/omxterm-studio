import { useEffect, useRef, useState } from "react";
import {
  parseConfiguration,
  type Configuration,
  type Platform,
} from "./configuration";
import type { TerminalTheme } from "./contract/terminal-theme";
import {
  createBundle,
  download,
  jsonDocument,
  parseTheme,
  readDocumentFile,
} from "./documents";
import { decodeDraft, DRAFT_KEY, encodeDraft } from "./draft";
import {
  changeTheme,
  createHistory,
  redoTheme,
  undoTheme,
} from "./theme-history";
import { ThemeEditor } from "./theme-editor";
import { ConfigEditor } from "./config-editor";
import { Preview, type Scene } from "./preview";
import { Icon } from "./icons";
import { TabStrip } from "./tab-strip";
import original from "./presets/omtheme.json";
import darkice from "./presets/omtheme-darkice.json";

const presets = [original, darkice].map((preset) =>
  parseTheme(JSON.stringify(preset)),
);
function initialState() {
  const platform: Platform = navigator.platform.startsWith("Win")
    ? "win32"
    : navigator.platform.includes("Linux")
      ? "linux"
      : "darwin";
  const fallback = {
    theme: presets[1],
    config: { version: 1 } as Configuration,
    platform,
    remember: false,
    error: "",
  };
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved
      ? { ...decodeDraft(saved), remember: true, error: "" }
      : fallback;
  } catch {
    return {
      ...fallback,
      error:
        "The local draft could not be restored. Your saved data was not overwritten. You can still edit and download.",
    };
  }
}

export function App() {
  const [initial] = useState(initialState);
  const [history, setHistory] = useState(() => createHistory(initial.theme));
  const theme = history.present;
  const [config, setConfig] = useState(initial.config);
  const [platform, setPlatform] = useState(initial.platform);
  const [reference, setReference] = useState(initial.theme);
  const [comparing, setComparing] = useState(false);
  const [open, setOpen] = useState(true);
  const [side, setSide] = useState<"left" | "right">("left");
  const [section, setSection] = useState<"theme" | "configuration">("theme");
  const [scene, setScene] = useState<Scene>("workspace");
  const [tabs, setTabs] = useState(true);
  const [snippets, setSnippets] = useState(false);
  const [remember, setRemember] = useState(initial.remember);
  const [themeValid, setThemeValid] = useState(true);
  const [pendingConfigJson, setPendingConfigJson] = useState(false);
  const [pendingShortcuts, setPendingShortcuts] = useState(false);
  const [message, setMessage] = useState(initial.error);
  const [error, setError] = useState(Boolean(initial.error));
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const importId = useRef(0);
  const reopen = useRef<HTMLButtonElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const themeFile = useRef<HTMLInputElement>(null);
  const configFile = useRef<HTMLInputElement>(null);
  const notice = (text: string, failed = false) => {
    setMessage(text);
    setError(failed);
  };
  const fail = (text: string) => notice(text, true);

  useEffect(() => {
    if (!remember) return;
    try {
      localStorage.setItem(DRAFT_KEY, encodeDraft({ theme, config, platform }));
    } catch {
      setRemember(false);
      setMessage(
        "This browser could not save the draft. Download your work before leaving.",
      );
      setError(true);
    }
  }, [theme, config, platform, remember]);

  useEffect(() => {
    if (
      themeValid &&
      !pendingConfigJson &&
      !pendingShortcuts &&
      (!dirty || remember)
    )
      return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, remember, pendingConfigJson, pendingShortcuts, themeValid]);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        setOpen(false);
        requestAnimationFrame(() => reopen.current?.focus());
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);

  const editTheme = (next: TerminalTheme) => {
    setHistory((value) => changeTheme(value, next));
    setComparing(false);
    setDirty(true);
  };
  const applyConfig = (text: string) => {
    try {
      setConfig(parseConfiguration(text, platform));
      setDirty(true);
      notice(
        "Configuration applied locally. Native fonts and paths still need validation in OMXTerm.",
      );
    } catch (cause) {
      fail(cause instanceof Error ? cause.message : "Invalid configuration.");
    }
  };
  const changePlatform = (next: Platform) => {
    try {
      parseConfiguration(jsonDocument(config), next);
      setPlatform(next);
      setDirty(true);
      notice(
        `Shortcut checks now target ${next === "darwin" ? "macOS" : next === "win32" ? "Windows" : "Linux"}.`,
      );
    } catch (cause) {
      fail(
        `Target not changed. ${cause instanceof Error ? cause.message : "Review your configuration."}`,
      );
    }
  };
  const importFile = async (
    file: File | undefined,
    kind: "theme" | "configuration",
  ) => {
    if (!file) return;
    const id = ++importId.current;
    setBusy(true);
    try {
      const text = await readDocumentFile(file);
      if (id !== importId.current) return;
      if (kind === "theme") {
        const imported = parseTheme(text);
        editTheme(imported);
        setReference(imported);
        notice(
          "Theme imported locally. Your previous palette is available with Undo.",
        );
      } else {
        setConfig(parseConfiguration(text, platform));
        setDirty(true);
        notice(
          "Configuration imported. theme.path was not opened: import the theme file separately.",
        );
      }
    } catch (cause) {
      if (id === importId.current)
        fail(
          `Import rejected; current work kept. ${cause instanceof Error ? cause.message : "Invalid file."}`,
        );
    } finally {
      if (id === importId.current) setBusy(false);
    }
  };
  const exportFile = (kind: "theme" | "configuration" | "bundle") => {
    try {
      if (kind === "bundle")
        download(
          "omxterm-config.zip",
          createBundle(config, theme, platform),
          "application/zip",
        );
      else if (kind === "theme")
        download(
          "theme.json",
          jsonDocument(parseTheme(jsonDocument(theme))),
          "application/json",
        );
      else
        download(
          "config.json",
          jsonDocument(parseConfiguration(jsonDocument(config), platform)),
          "application/json",
        );
      notice(
        kind === "bundle"
          ? "Download requested. Extract config.json and themes/theme.json together into your OMXTerm configuration folder."
          : `${kind === "theme" ? "theme.json" : "config.json"} download requested. Standalone exports do not rewrite theme.path.`,
      );
    } catch (cause) {
      fail(
        cause instanceof Error
          ? cause.message
          : "The download could not be prepared.",
      );
    }
  };
  const toggleDraft = (enabled: boolean) => {
    if (!enabled) {
      try {
        localStorage.removeItem(DRAFT_KEY);
        notice(
          "Saved draft removed from this browser. Current edits are still here.",
        );
      } catch {
        fail(
          "The browser could not remove the saved draft. Clear this site's storage in browser settings.",
        );
      }
    }
    setRemember(enabled);
  };

  return (
    <div className="studio">
      <header className="studio-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ❯_
          </span>
          <div>
            <h1>
              OMXTerm <span>Studio</span>
            </h1>
            <p>Your terminal. Your colors.</p>
          </div>
        </div>
        <div className="preview-toolbar" aria-label="Preview controls">
          <button aria-pressed={tabs} onClick={() => setTabs(!tabs)}>
            Tabs
          </button>
          <button
            aria-pressed={snippets}
            onClick={() => setSnippets(!snippets)}
          >
            Snippets
          </button>
          <button
            className="icon-button"
            aria-label="Toggle fullscreen"
            title="Fullscreen"
            onClick={async () => {
              try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else await document.documentElement.requestFullscreen();
              } catch {
                fail(
                  "Fullscreen is unavailable in this browser. You can still collapse the editor.",
                );
              }
            }}
          >
            <Icon name="expand" />
          </button>
          <a
            className="icon-button"
            href="https://github.com/luizomf/omxterm-studio"
            target="_blank"
            rel="noreferrer"
            aria-label="Source on GitHub"
            title="Source on GitHub"
          >
            <Icon name="external" />
          </a>
        </div>
      </header>
      <main className="studio-stage">
        <Preview
          theme={comparing ? reference : theme}
          config={config}
          scene={scene}
          onScene={setScene}
          tabs={tabs}
          snippets={snippets}
          comparing={comparing}
          onDemo={() =>
            notice("This is a simulated snippet. No command was run.")
          }
        />
      </main>
      <footer className="studio-footer">
        <span>
          <i /> Local-only editing <span className="footer-divider">/</span> DOM
          simulation, not a live terminal
        </span>
        <span className="footer-right">OMXTerm config v1</span>
      </footer>
      <button
        ref={reopen}
        className={`editor-launcher ${open ? "launcher-hidden" : ""}`}
        aria-expanded={open}
        aria-controls="editor-panel"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => panelHeading.current?.focus());
        }}
      >
        <Icon name="sliders" />
        Edit appearance
      </button>
      {comparing && (
        <button
          className="reference-banner"
          onClick={() => setComparing(false)}
        >
          Viewing reference · Return to edits
        </button>
      )}
      <aside
        id="editor-panel"
        className={`editor-panel panel-${side}`}
        hidden={!open}
        aria-label="Theme and configuration editor"
      >
        <div className="panel-header">
          <div>
            <span className="eyebrow">THE WORKSHOP</span>
            <h2 ref={panelHeading} tabIndex={-1}>
              Make it feel like you.
            </h2>
          </div>
          <div className="panel-actions">
            <button
              className="icon-button"
              aria-label={`Move editor ${side === "left" ? "right" : "left"}`}
              title="Move editor to the other side"
              onClick={() => setSide(side === "left" ? "right" : "left")}
            >
              <Icon name={side === "left" ? "right" : "left"} />
            </button>
            <button
              className="icon-button"
              aria-label="Collapse editor"
              title="Collapse · Esc"
              onClick={() => {
                setOpen(false);
                requestAnimationFrame(() => reopen.current?.focus());
              }}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <TabStrip
          className="editor-sections"
          label="Editor section"
          choices={[
            { value: "theme", label: "Theme" },
            { value: "configuration", label: "Configuration" },
          ]}
          value={section}
          onChange={setSection}
        />
        <div className="editor-scroll">
          <div hidden={section !== "theme"}>
            <div className="history-toolbar">
              <button
                disabled={!history.past.length}
                title="Undo theme edit"
                aria-label="Undo theme edit"
                onClick={() => {
                  setHistory(undoTheme);
                  setComparing(false);
                }}
              >
                <Icon name="undo" />
              </button>
              <button
                disabled={!history.future.length}
                title="Redo theme edit"
                aria-label="Redo theme edit"
                onClick={() => {
                  setHistory(redoTheme);
                  setComparing(false);
                }}
              >
                <Icon name="redo" />
              </button>
              <button
                className="compare-button"
                aria-pressed={comparing}
                onClick={() => setComparing(!comparing)}
              >
                <Icon name="compare" />
                {comparing ? "Viewing reference" : "Compare"}
              </button>
              <button
                className="reference-save"
                title="Use the edited theme as your comparison reference"
                onClick={() => {
                  setReference(theme);
                  setComparing(false);
                  notice("Comparison reference updated.");
                }}
              >
                Set reference
              </button>
            </div>
            <ThemeEditor
              theme={theme}
              presets={presets}
              reference={reference}
              onChange={editTheme}
              onPreset={(preset) => {
                editTheme(preset);
                setReference(preset);
              }}
              onValidity={setThemeValid}
            />
          </div>
          <div hidden={section !== "configuration"}>
            <ConfigEditor
              config={config}
              platform={platform}
              onChange={(next) => applyConfig(jsonDocument(next))}
              onPlatform={changePlatform}
              onApplyJson={applyConfig}
              onPendingJson={setPendingConfigJson}
              onPendingShortcuts={setPendingShortcuts}
              pendingShortcuts={pendingShortcuts}
              onError={fail}
            />
          </div>
          <section className="file-section">
            <div className="section-heading">
              <h2>Bring your own</h2>
              <span>JSON · stays local</span>
            </div>
            <div className="file-buttons">
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => themeFile.current?.click()}
              >
                <Icon name="upload" />
                Import theme
              </button>
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => configFile.current?.click()}
              >
                <Icon name="upload" />
                Import config
              </button>
            </div>
            <input
              ref={themeFile}
              type="file"
              accept=".json,application/json"
              aria-label="Import theme JSON"
              hidden
              onChange={(e) => {
                void importFile(e.target.files?.[0], "theme");
                e.target.value = "";
              }}
            />
            <input
              ref={configFile}
              type="file"
              accept=".json,application/json"
              aria-label="Import configuration JSON"
              hidden
              onChange={(e) => {
                void importFile(e.target.files?.[0], "configuration");
                e.target.value = "";
              }}
            />
            <label className="check-field remember-field">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => toggleDraft(e.target.checked)}
              />
              Remember this draft on this device
            </label>
            <p className="hint">
              Opt-in browser storage only. Otherwise, edits last for this visit.
              No uploads, accounts, or analytics.
            </p>
          </section>
          <details className="about-preview">
            <summary>About this preview</summary>
            <p>
              This preview simulates the terminal with DOM/CSS, not Restty.
              Fonts, dim text, cell spacing, ligatures, and native chrome may
              differ in OMXTerm. Tabs and snippets use its theme color-mixing
              rules.
            </p>
            <p>
              Preview toggles are not configuration settings. Snippets and
              terminal content are fictional and never execute. Only the two
              original OMXTerm palettes are included.
            </p>
            <p>
              Configuration schema v1, targeting OMXTerm 0.14.1 development
              behavior. Always keep a backup before applying files in the
              application.
            </p>
          </details>
        </div>
        <div className="panel-export">
          <div aria-live="polite">
            {!themeValid && (
              <p className="export-warning">
                Complete the invalid name or hex value in Theme before exporting
                a theme or pair.
              </p>
            )}
            {pendingShortcuts && (
              <p className="export-warning">
                Unapplied shortcut edits. Downloads use the last applied
                configuration.
              </p>
            )}
            {pendingConfigJson && (
              <p className="export-warning">
                Unapplied configuration JSON. Downloads use the last applied
                configuration.
              </p>
            )}
          </div>
          <button
            className="primary-button"
            disabled={!themeValid || busy}
            onClick={() => exportFile("bundle")}
          >
            <Icon name="download" />
            Download edited pair<span>.zip</span>
          </button>
          <div className="export-links">
            <button
              disabled={!themeValid || busy}
              onClick={() => exportFile("theme")}
            >
              Theme JSON
            </button>
            <span>·</span>
            <button disabled={busy} onClick={() => exportFile("configuration")}>
              Config JSON
            </button>
          </div>
          <p>
            ZIP pairs config.json with themes/theme.json.
            <br />
            Only the ZIP's config gets that theme path.
          </p>
        </div>
      </aside>
      {message && (
        <div
          className={`notice ${error ? "notice-error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </div>
  );
}
