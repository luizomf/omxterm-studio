# Desktop contract provenance

Compatibility baseline: [OMXTerm commit 9d7b01eff21ffb64cbd03ba2d426df8ef1618ce8](https://github.com/luizomf/omxterm/tree/9d7b01eff21ffb64cbd03ba2d426df8ef1618ce8), schema version 1, 0.17.1-dev.0 development baseline. Latest published release at inspection: v0.17.0.

## Source and license

OMXTerm is MIT licensed, copyright (c) 2026 Luiz Otávio Miranda. The same copyright and permission notice are retained in this repository's root `LICENSE`.

- `src/contract/terminal-keybinds.ts` is copied from desktop `src/shared/terminal-keybinds.ts`. Its action vocabulary contains **27** entries. The added `toggleTitleBar` defaults to `CommandOrControl+Shift+D` on macOS and `Control+Shift+D` on Linux/Windows; all other defaults and accelerator rules remain unchanged from the previous Studio baseline.
- `src/contract/terminal-theme.ts` is copied from desktop `src/shared/terminal-theme.ts`, with browser-independent named exports for the existing color/name validators.
- `src/configuration.ts` implements the supported structural rules from desktop `src/main/user-configuration.ts` and shared configuration types. It does not import privileged desktop modules or filesystem/path checks.
- `src/preview.css` follows desktop `src/renderer/terminal-window.css` for theme-derived tab/sidebar overlays against `#808090` in sRGB: tab idle/hover/active 10%/25%/40%; sidebar 15%; transparent search background; snippet hover 35.294118% over the sidebar (45% combined when opaque). Overlay alpha scales with remaining background tint. Secondary text uses 70% foreground; search border/focus uses 60%/70% foreground.
- `src/presets/omtheme.json` matches desktop `docs/omtheme.json` at [commit f2b6c7e745ebda401c6ae1e6fe1ad685f652c02a](https://github.com/luizomf/omxterm/commit/f2b6c7e745ebda401c6ae1e6fe1ad685f652c02a) and is the default for fresh visits. This palette synchronization is separate from the configuration-schema baseline above and never rewrites saved drafts or imports. `omtheme-darkice.json` is the author's original companion palette, included with permission for this pilot; its display name is distinct from `omtheme`.

These are bounded source copies, not a shared package or an assertion that desktop internals are a stable SDK. When upgrading compatibility, compare the upstream validators, defaults, accelerator rules, and chrome CSS; update regression tests and this baseline together. Do not silently accept new fields or infer support from the version number alone.

## Current configuration audit

Desktop `docs/spec.md` (Configuration and local state), `src/shared/user-configuration.ts`, and `src/main/user-configuration.ts` govern the field set and defaults. The current window object supports only `alwaysOnTop`, `showTitleBar`, `showTabBar`, `blur`, and `transparency`. The first four are booleans, defaulting respectively to false, true, true, and false; transparency is finite, 0–1 inclusive, default 0. No theme alpha, blur strength, material selector, or additional action is inferred.

[ADR 0027](https://github.com/luizomf/omxterm/blob/9d7b01eff21ffb64cbd03ba2d426df8ef1618ce8/docs/adr/0027-hide-window-chrome-without-replacing-sessions.md) governs independent new-window title/tab defaults. [ADR 0029](https://github.com/luizomf/omxterm/blob/9d7b01eff21ffb64cbd03ba2d426df8ef1618ce8/docs/adr/0029-compose-background-effects-with-explicit-cell-identity.md) governs background-only tint, explicit cell opacity, live reload and native fallbacks; [ADR 0030](https://github.com/luizomf/omxterm/blob/9d7b01eff21ffb64cbd03ba2d426df8ef1618ce8/docs/adr/0030-prefer-direct-macos-background-blur.md) supersedes only its macOS material choice with direct blur preferred and HUD fallback.

`windowsShell` remains non-empty and NUL-free on every platform. Its Windows absolute-path syntax matches `path.win32.isAbsolute`; only the desktop can inspect whether its final target is a regular file. The desktop does not check executability or add arguments. Other configuration fields, theme validation and opaque chrome mixing were compared with the baseline; no additional fields were found missing.

## Browser boundary

Studio validates schema, configured ranges, theme shape, and effective shortcut collisions for the selected target. It cannot check installed fonts, path existence, shell executability, Electron accelerator registration, or native operating-system behavior. The Windows shell field checks path syntax for Windows targets, not filesystem state.

Title/tab visibility follows applied configuration. Transparency and positive-transparency blur are illustrative CSS effects over a local fictional starfield, on every target; they do not certify or predict native effects or platform fallbacks. The background tint and chrome overlays fade without fading text, cursor, selection or explicit cell backgrounds. No whole-window opacity or foreground filter is used. Always-on-top remains export-only. Native effects can fall back to opaque: Windows without blur remains opaque, Acrylic requires Windows 11 22H2 or later, and Linux's best-effort X11 hint does not imply native Wayland support. Positive transparency is required for visible blur.

The DOM preview is intentionally not Restty: an installed CSS font family can be tried without obtaining its font bytes. Font metrics, ligatures, dim compositing, selection, and cell geometry can differ. Fictional demonstration content is not terminal output. The preview does not emulate a PTY, parse escape streams, or execute snippets.
