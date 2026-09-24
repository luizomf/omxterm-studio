# OMXTerm Studio

## Product

A public, static, browser-only theme and configuration editor for OMXTerm. The theme is the primary workflow; configuration editing is equally available. The site is separate from the desktop application and the OMXTerm Web SSH broker.

## Preview

A large DOM/CSS simulation uses fictional text, fastfetch, htop, ANSI-styled tmux status/dividers, an OMXTerm tab strip, and a snippets sidebar. It does not run commands or use the Restty rendering engine. Normal, bold, dim, background colors, cursor, and selection samples are visible. Bold does not switch ANSI slots. Font rasterization, dim rendering, cell layout, and operating-system chrome can differ from the application.

Tab and sidebar colors follow the desktop's sRGB color-mixing rules against the fixed `#808090` chrome neutral. The preview supports tabs, sidebar, scene selection, and fullscreen independently of exported configuration. These are ephemeral preview controls, not unsupported configuration fields.

The non-modal editor floats on the left or right without resizing, dimming, or blurring the preview. It can be collapsed and reopened without losing edits. On narrow screens it remains usable as a bounded overlay; terminal scenes can be scrolled rather than shrinking text to illegibility. Editor controls have their own stable colors, independent of the theme under construction.

## Editing and documents

- Original `omtheme` and `omtheme-darkice` presets; no third-party theme catalog.
- All 21 theme colors, strict `#RRGGBB`, and a printable name of 1–64 Unicode code points.
- Configuration/theme schema version 1, targeting OMXTerm 0.14.1 development behavior. Supported optional configuration fields are preserved, including keybindings. Unknown fields are rejected, not silently removed.
- Configuration controls cover font family/size/line-height/ligatures, per-side padding, scrollback, close confirmation, logging, Option key behavior, always-on-top, Windows shell, keyboard shortcuts, and a JSON editor for the entire supported document.
- The collapsible shortcut editor covers all 26 supported actions with readable labels, filtering, editable accelerator text, inherited target-platform defaults, and existing overrides. It does not capture or execute keystrokes. Apply validates the entire staged map at once, permitting binding swaps; discard restores the applied map. Per-action restoration removes the override rather than exporting a default-filled map. Invalid accelerator syntax and collisions with effective bindings block application. PTY control-key interception warns and keeps a valid explicit override, matching the desktop policy.
- Target changes recompute shortcut defaults and collision checks without rewriting explicit overrides. Staged shortcuts survive section changes and unrelated appearance updates; imports or JSON application refresh the shortcut draft when the applied keybindings change. Pending shortcuts disable JSON editing/application until applied or discarded. Pending full-document JSON disables the other configuration controls until applied or discarded, except the target selector. These drafts cannot silently overwrite one another.
- Local font family names use CSS with monospace fallback. There is no font enumeration, file access, or upload. The site cannot certify that a font or path exists, a shell is executable, or a native shortcut works. Platform-specific shortcut collisions are checked against the selected export platform.
- Local JSON imports are bounded, decoded as strict UTF-8, and validated before replacing current state. Importing configuration never reads or fetches `theme.path`; the user imports the palette separately.
- Theme undo/redo and reference comparison are available. Preset changes and imports are deliberate editing actions, not destructive resets of the only copy.
- Switching editor sections preserves the selected color, incomplete theme text, and unapplied Configuration JSON/shortcut edits and their disclosure state. Inactive controls are hidden from keyboard and assistive navigation. Switching sections does not apply pending JSON, shortcuts, or invalid theme text.
- Unapplied JSON and shortcut edits are identified beside the export controls; downloads continue to use the last validated, applied configuration until explicit application succeeds. Invalid theme text blocks theme/pair downloads with a visible explanation, without blocking standalone configuration export.
- Download a theme JSON, the configuration JSON, or a paired ZIP. The paired ZIP explicitly uses `config.json` and `themes/theme.json`, replacing `theme.path` only in the exported copy; standalone configuration retains its selected path.
- No configuration data enters URLs, analytics, logs, or network requests. No imported content is executed. Draft persistence is opt-in and clearly labeled; unavailable/corrupt storage must not break editing. Only validated, applied documents are persisted. Unapplied JSON, shortcut edits, and invalid theme text remain in the current tab; a best-effort browser page-exit warning is requested for them even when persistence is enabled.

## Delivery

GitHub Pages serves built static files from a reviewed main branch. One documented check command runs formatting, lint, strict TypeScript, unit tests, and a production build. Browser tests verify core editing, import/export, overlay geometry, and responsive behavior. No application version bump, desktop artifact, or desktop-repository change is part of this workshop.
