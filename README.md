# OMXTerm Studio

**Your terminal. Your colors.**

A static, browser-only theme and configuration workshop for [OMXTerm](https://github.com/luizomf/omxterm).

**[Open the pilot →](https://luizomf.github.io/omxterm-studio/)**

## The workshop

- Edit the 21 theme colors and name, starting with the original **OMTheme** or **Dark Ice** palette.
- See fictional terminal text, fastfetch, htop, tmux status, tabs, and snippets together. Preview controls can isolate a scene, show/hide chrome, or enter fullscreen.
- Move the neutral editor left/right, or collapse it without resizing or dimming the preview. Use arrow keys in tab strips and Escape to collapse the editor.
- Undo/redo theme edits, restore a selected color, or compare with a reference. Downloads always contain the edited theme, not the comparison reference.
- Edit configuration independently. Installed font names use CSS with monospace fallback; no font upload, enumeration, or permission prompt.
- Import local JSON and download either document or a coherent ZIP. Optionally remember the current draft on this device.

This is a **DOM/CSS appearance simulation**, not a live terminal or the Restty renderer. It never runs shell commands, and cannot certify native font rendering, executable paths, native shortcuts, or operating-system window behavior. Text layout and dim rendering are approximations. Preview tabs and sidebar colors follow OMXTerm's sRGB mixing rules.

## Import and export

Imports accept strict UTF-8 JSON up to **256 KiB**. Unknown fields and invalid values are rejected without replacing current work. Import a configuration and its palette separately: the site never opens or fetches `theme.path`.

Choose the target platform before importing platform-specific keybindings. All supported optional v1 configuration fields are preserved; use **Configuration JSON & keybindings** for the full document. JSON edits take effect only after **Apply JSON** validates them. Host-specific properties still need verification in OMXTerm.

The paired download contains:

```text
config.json
themes/theme.json
```

Only the configuration inside that ZIP receives `"theme": { "path": "./themes/theme.json" }`. Standalone configuration export preserves its existing path. Extract both files together, inspect them, and place them in OMXTerm's configuration directory as described in [the desktop configuration guide](https://github.com/luizomf/omxterm/blob/main/docs/configuration.md). Back up existing files first; Studio never installs or replaces them.

## Privacy

Editing, validation, ZIP creation, and opt-in draft storage happen in the browser. There are no accounts, analytics, third-party fonts, or application backend. Imported content is treated as data, never executed or uploaded. Paths do not become network requests.

GitHub Pages receives ordinary requests for the site's static assets. The repository link leaves the site. Opt-in drafts remain in this browser's local storage; uncheck **Remember this draft on this device** to remove the saved draft. Avoid saving sensitive configuration on shared devices.

## Development

Use Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Vite binds to `127.0.0.1`. Open the `/omxterm-studio/` path printed in the terminal.

```sh
npm run check       # formatting, lint, TypeScript, unit tests, production build
npm run format      # apply formatting
```

Browser tests use local Google Chrome by default. After building, start the preview server in a separate terminal:

```sh
npm run preview -- --port 4175 --strictPort
npm run test:e2e
```

Set `STUDIO_BASE_URL` to test a different deployment. CI installs Playwright Chromium and starts/stops its own loopback preview server. The workflow verifies pull requests and deploys checked `main` builds through GitHub Pages; enable Pages' **GitHub Actions** build source in repository settings.

## Contract and license

The pilot targets **OMXTerm configuration/theme schema v1**, inspected at desktop commit [`656cbad`](https://github.com/luizomf/omxterm/commit/656cbadf15276dc24f8e8a81971d58d4f968df47) (0.14.1 development behavior). See [the product contract](docs/spec.md) and [contract provenance](docs/contract-provenance.md) before changing validation or appearance rules.

MIT. Original palettes only; no redistributed third-party theme catalog.
