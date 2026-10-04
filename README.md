# OMXTerm Studio

**Your terminal. Your colors.**

A static, browser-only theme and configuration workshop for [OMXTerm](https://github.com/luizomf/omxterm).

**[Open the workshop →](https://luizomf.github.io/omxterm-studio/)**

## The workshop

- Edit the 21 theme colors and name. New visits start with the current desktop **OMTheme**; **Dark Ice** remains an alternative. Saved drafts and imported palettes are never replaced by a preset update.
- See a fictional diff, all 16 ANSI slots (plain, bold, dim, and backgrounds), fastfetch, htop, tmux status, tabs, and snippets together. Preview controls can isolate a scene, show/hide chrome, or enter fullscreen.
- The terminal fills the workspace, with a viewport-wide indigo/purple/rose CSS sky and one compact control row. No branding header, footer, or success toasts cover the terminal. Errors stay inside the editor; explanations live under **About this preview** and the setup guide.
- Move the neutral editor left/right, or collapse it without resizing or dimming the preview. Its colors stay independent of dark or light terminal themes. Use arrow keys in tab strips and Escape to collapse the editor.
- Undo/redo theme edits, restore a selected color, or compare with a reference. Downloads always contain the edited theme, not the comparison reference.
- Edit configuration independently, including title/tab visibility, background transparency and native blur requests. Title/tab visibility updates the preview; transparency and blur are simulated over a lightweight CSS starfield with optional comet motion.
- Try installed font names with CSS monospace fallback; no font upload, enumeration, or permission prompt.
- Import local JSON and download either document or a coherent ZIP. Optionally remember the current draft on this device.

This is a **DOM/CSS appearance simulation**, not a live terminal or the Restty renderer. It never runs shell commands, and cannot certify native font rendering, executable paths, native shortcuts, or operating-system window behavior. Text layout and dim rendering are approximations. Preview tabs and sidebar colors follow OMXTerm's sRGB mixing rules.

## Keyboard shortcuts

Open **Configuration → Keyboard shortcuts** to edit all 27 supported OMXTerm actions, including **Toggle title bar**. Filter by action name, type a combination, and use **Apply shortcuts** to validate and apply the complete set. You can swap two bindings before applying, rather than getting stuck at an intermediate conflict. **Discard edits** returns to the applied configuration.

Defaults follow the selected macOS/Linux/Windows target. Linux and Windows keep the desktop's shifted terminal defaults. `CmdOrCtrl` / `CommandOrControl` resolves to Command on macOS and Control elsewhere; aliases, inherited bindings, and conflicts are checked for that target. Use `Plus` for the `+` key, and at least one non-Shift modifier. Explicit overrides are not rewritten when switching targets. The restore button beside an action removes its override on application; merely viewing defaults does not copy the entire map into JSON.

Invalid syntax and duplicate combinations block application. Shell-control-key interception (for example, `Ctrl+C` taking SIGINT away from the terminal) warns without rejecting a deliberate override. The site neither records nor executes shortcuts: enter them as text so browser-reserved keys do not interrupt editing. Native availability must still be checked in OMXTerm.

Shortcut edits survive section switches and appearance adjustments. Configuration imports or JSON application refresh the shortcut draft when the applied keybindings change. To prevent conflicting drafts, apply or discard shortcut edits before editing the full JSON document. Conversely, pending JSON locks the other configuration controls until **Apply JSON** or **Discard JSON edits**; the target-platform selector remains available.

## Window settings

Open **Configuration → Window & background**. `showTitleBar` and `showTabBar` default to `true`; `alwaysOnTop` and `blur` to `false`; `transparency` to `0`. Transparency accepts any finite fraction from 0 through 1, without clamping. Blur only has a visible effect with positive transparency. Theme colors stay `#RRGGBB`.

Title/tab visibility updates the preview immediately. Transparency and blur use a **CSS simulation** over a fictional starfield on every target, not a prediction of native effects or platform fallbacks. Only the background tint fades; text, cursor, selection and explicit terminal backgrounds stay opaque. The **Pause sky animation** control pauses the decorative comets; reduced-motion preferences disable their animation. The sky and motion preference are preview-only and never exported or persisted. Always-on-top remains export-only. In OMXTerm, transparency reduces the background tint, not text, cursor, selection, images, or explicit terminal cell backgrounds. macOS prefers direct blur with HUD fallback; Linux blur is best effort on X11 with `xprop` and a supporting compositor, not native Wayland. Windows stays opaque without blur; Acrylic needs Windows 11 22H2 or later and may still fall back to opaque. No operating system guarantees visible blur.

Background effects apply live on valid configuration reload. Title/tab visibility and always-on-top initialize new windows; reload does not change existing windows' choices. An enabled tab bar also needs at least two tabs. The **Tabs** toolbar button can temporarily hide Studio's demo tabs without changing the exported `showTabBar` setting. When `showTabBar` is false, that button is disabled; re-enable the configuration setting to preview tabs. Workspace column controls stay outside the simulated window so hiding chrome never hides them.

## Import and export

Imports accept strict UTF-8 JSON up to **256 KiB**. Unknown fields and invalid values are rejected without replacing current work. Import a configuration and its palette separately: the site never opens or fetches `theme.path`.

Choose the target platform before importing platform-specific keybindings. All supported optional v1 configuration fields are preserved; use **Configuration JSON & keybindings** for the full document, including `theme.path`. On Windows, `windowsShell` must be an absolute Windows path to an existing regular file; Studio only checks its syntax, and OMXTerm checks the file. It accepts no arguments or variable expansion and has no effect on macOS/Linux. JSON edits take effect only after **Apply JSON** validates them. Host-specific properties still need verification in OMXTerm.

Switching between Theme and Configuration keeps your selected color, incomplete theme text, and unapplied JSON or shortcut edits in place. The export controls identify pending changes: downloads still use the last applied configuration. Invalid theme text blocks theme/pair downloads, but configuration can still be downloaded independently.

**Remember this draft** saves only validated, applied documents, not unfinished text. The browser is asked to warn before leaving with unapplied JSON, shortcut edits, or invalid theme input, even with draft storage enabled. That warning is best-effort, not a backup: apply and download your work before leaving.

The paired download contains:

```text
config.json
themes/theme.json
```

Only the configuration inside that ZIP receives `"theme": { "path": "./themes/theme.json" }`. Standalone configuration export preserves its existing path. Extract both files together, inspect them, and place them in OMXTerm's configuration directory as described in [the desktop configuration guide](https://github.com/luizomf/omxterm/blob/main/docs/configuration.md). Back up existing files first; Studio never installs or replaces them. If you already use OMXTerm, **import your existing config before editing** so the pair retains its preferences. The in-app **Use these files in OMXTerm** guide covers the folder, export choices, and reload step.

Choose **View → Reload User Configuration** in OMXTerm after copying the files. Font family and line height apply to new tabs; existing tabs need a restart. Window-default and live-effect behavior is described above.

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

The workshop targets **OMXTerm configuration/theme schema v1**, inspected at desktop commit [`9d7b01e`](https://github.com/luizomf/omxterm/commit/9d7b01eff21ffb64cbd03ba2d426df8ef1618ce8) (0.17.1-dev.0 baseline; latest published release v0.17.0). The OMTheme palette is separately synchronized with desktop commit [`f2b6c7e`](https://github.com/luizomf/omxterm/commit/f2b6c7e745ebda401c6ae1e6fe1ad685f652c02a). See [the product contract](docs/spec.md) and [contract provenance](docs/contract-provenance.md) before changing validation or appearance rules.

MIT. Original palettes only; no redistributed third-party theme catalog.
