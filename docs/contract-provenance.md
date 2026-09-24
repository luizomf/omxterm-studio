# Desktop contract provenance

Compatibility baseline: [OMXTerm commit 656cbadf15276dc24f8e8a81971d58d4f968df47](https://github.com/luizomf/omxterm/tree/656cbadf15276dc24f8e8a81971d58d4f968df47), schema version 1, 0.14.1 development behavior.

## Source and license

OMXTerm is MIT licensed, copyright (c) 2026 Luiz Otávio Miranda. The same copyright and permission notice are retained in this repository's root `LICENSE`.

- `src/contract/terminal-keybinds.ts` is copied from desktop `src/shared/terminal-keybinds.ts`.
- `src/contract/terminal-theme.ts` is copied from desktop `src/shared/terminal-theme.ts`, with browser-independent named exports for the existing color/name validators.
- `src/configuration.ts` implements the supported structural rules from desktop `src/main/user-configuration.ts` and shared configuration types. It does not import privileged desktop modules or filesystem/path checks.
- `src/preview.css` follows desktop `src/renderer/terminal-window.css` for theme-derived tab/sidebar mixing against `#808090` in sRGB: tab idle/hover/active 10%/25%/40%; sidebar/search background 15%; snippet hover 45%; secondary text 70%; search border/focus 60%/70% foreground.
- `src/presets/omtheme.json` comes from desktop `docs/omtheme.json`. `omtheme-darkice.json` is the author's original companion palette, included with permission for this pilot; its display name is distinct from `omtheme`.

These are bounded source copies, not a shared package or an assertion that desktop internals are a stable SDK. When upgrading compatibility, compare the upstream validators, defaults, accelerator rules, and chrome CSS; update regression tests and this baseline together. Do not silently accept new fields or infer support from the version number alone.

## Browser boundary

Studio validates schema, configured ranges, theme shape, and effective shortcut collisions for the selected target. It cannot check installed fonts, path existence, shell executability, Electron accelerator registration, or native operating-system behavior. The Windows shell field checks path syntax for Windows targets, not filesystem state.

The DOM preview is intentionally not Restty: an installed CSS font family can be tried without obtaining its font bytes. Font metrics, ligatures, dim compositing, selection, and cell geometry can differ. Fictional demonstration content is not terminal output. The preview does not emulate a PTY, parse escape streams, or execute snippets.
