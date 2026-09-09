# Safari Dark Mode — Agent Guide

## Project map and constraints

- Personal macOS Safari Web Extension for Gmail, Google Sheets, and
  Google Search. Do not expand this into a generic dark-mode engine.
- `extension/manifest.json` uses Manifest V3 (Safari 15.4+). Keep API permissions
  in `permissions`, URL access in `host_permissions`, and the toolbar UI in
  `action`. Development is currently exercised in Safari 27.
- `site-registry.js` owns product detection, appearance-mode normalization,
  helper-frame gating, and idempotent stylesheet maintenance.
- `preload.js` only establishes synchronous first-paint attributes. `content.js`
  is the sole owner of storage and system-appearance listeners. Do not introduce
  a second state controller or unconditional stylesheet reordering.
- Per-product modes are `system` (default), `dark`, and `off`. Only `system`
  follows macOS Dark Appearance; `dark` overrides it. Preserve old boolean
  preferences as `true` → `system` and `false` → `off`.
  Google account helpers inherit a known embedded parent; standalone account
  pages stay untouched. Keep Sheets grid layers transparent where Google expects
  them to be. A scoped canvas filter darkens the grid without changing document
  formatting; it does change displayed cell colors. Never paint opaque backgrounds
  over grid or canvas overlays. Style native scrollbars separately from the canvas.
- `gmail-messages.js` converts Gmail message foreground/background colors as a
  pair. Chrome rules must exclude `.a3s` and its descendants. Keep images intact,
  measure original colors before conversion, and disconnect the message observer
  during writes. Do not restore blanket white message bodies or blanket light text.
  Message color conversion adjusts CIE Lab lightness, preserves already-readable
  colors, and checks contrast against the converted background. See the Chromium
  reference in README.md; Safari cannot enable Chromium's rendering-engine flag.
- The macOS `ViewController.swift` uses native AppKit setup/status controls;
  it only opens Safari settings and reads extension enablement.
- `extension/popup/` owns toolbar controls and connection/save feedback.
  `tests/` contains dependency-free Node regression tests.

## Editing and validation

- Edit extension source files in `extension/`.
- After changing extension assets, run `sh scripts/sync-extension-resources.sh`
  so `Safari Dark Mode/Safari Dark Mode Extension/Resources/` matches.
- Use `sh scripts/sync-extension-resources.sh --check` in reviews and before
  release to catch stale packaged resources.
- Open `tests/gmail-rendering.html` through a local HTTP server for message
  rendering changes; all displayed checks must pass, followed by real Safari
  verification of a plain email and a styled HTML email.
- Run `node --test tests/*.test.cjs` for runtime changes and
  `git diff --check` for every change. Check changed JavaScript with `node --check`.
- For extension-only behavior changes, sync resources and verify the affected
  behavior in Safari. A packaged installation needs a rebuild to receive copied
  resources; a temporary extension needs Reload in Safari Settings. Rebuild the
  wrapper whenever requested or when native code, Xcode settings, resource
  membership, permissions, or a release/package gate changes.
  Use XcodeBuildMCP when available. First verify/set defaults for
  `Safari Dark Mode/Safari Dark Mode.xcodeproj`, scheme `Safari Dark Mode`,
  configuration `Debug`, platform `macOS`, and derived data path
  `build/DerivedData`; then run the MCP build action. If XcodeBuildMCP is not
  available or cannot run the macOS build, fall back to:
  `xcodebuild -project "Safari Dark Mode/Safari Dark Mode.xcodeproj" -scheme "Safari Dark Mode" -configuration Debug -derivedDataPath build/DerivedData build`.
- For a requested local install, run the app at
  `build/DerivedData/Build/Products/Debug/Safari Dark Mode.app`, then enable it in
  Safari Settings > Extensions and grant only the supported sites. An ad-hoc
  build needs Settings > Developer > Allow unsigned extensions. The user must
  complete any macOS authentication prompt. Verify the version, popup appearance choices,
  persistence after reload, and affected Google surfaces in the actual Safari
  app. Report authentication or permission blockers accurately.
  After repeated packaged rebuilds, Safari may retain stale extension contexts in
  existing Gmail tabs. If a styled page reports “Page not connected” in the popup,
  check the same URL in a fresh tab before changing the messaging code.
- Safari 27 can also load `extension/` through Settings > Developer > Add
  Temporary Extension. This expires after 24 hours or quitting Safari; use the
  packaged app when the user asks for a rebuilt installed extension.
- When adding a new top-level extension resource, update the Safari extension
  target resources in the Xcode project as well as running the sync script.
- Keep host permissions and native wrapper behavior aligned with
  `SECURITY.md`.
- Do not add dependencies, remote code, telemetry, or broad host permissions for
  this personal extension without documenting the reason.
- Commit completed changes directly to `main` in this repo, then push to
  `origin/main` right away. Do not create branches or pull requests unless
  explicitly requested.

Documentation-only edits require link/path review and `git diff --check`; they
do not require syncing unchanged resources, launching Safari, or building Xcode.
