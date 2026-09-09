# Safari Dark Mode — Agent Guide

## Project map and constraints

- macOS Safari Web Extension for Gmail, Google Sheets, and
  Google Search. Do not expand this into a generic dark-mode engine.
- `extension/manifest.json` uses Manifest V3; release 1.0 requires macOS/Safari 26+. Keep API permissions
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
  over grid or canvas overlays. Style native scrollbars and `.grid-shim-*` fillers
  separately from the canvas. With WebKit scrollbar-part styling, keep standard
  `scrollbar-color` and `scrollbar-width` at `auto` so they do not suppress it.
- `gmail-messages.js` converts Gmail message foreground/background colors as a
  pair. Chrome rules must exclude `.a3s` and its descendants. Keep images intact,
  measure original colors before conversion, and disconnect the message observer
  during writes. Preserve image-backed sections with their original foregrounds
  and effective backing colors. Restore temporary inline-important overrides
  before measuring and when disabling; preserve newer sender edits. Do not restore
  blanket white message bodies or blanket light text.
  Message color conversion adjusts CIE Lab lightness, preserves already-readable
  colors, and checks contrast against the converted background. See the Chromium
  reference in README.md; Safari cannot enable Chromium's rendering-engine flag.
- The macOS `ViewController.swift` uses native AppKit setup/status controls;
  it only opens Safari settings and reads extension enablement.
- Gmail `.nU` elements wrap sidebar label text. Never include them in icon
  filters; style their text colors separately.
- Gmail expanded compose is a dialog containing `.M9`; exclude it from generic
  dialog rules. Its `.afx` recipient editor is a listbox, not an autocomplete
  popup. Preserve icon background images and native field geometry in both sizes.
- `extension/popup/` owns toolbar controls and connection/save feedback.
  Keep On (Always dark), Off (Website default), and System (Follow device)
  visible as one-click radio choices; Off does not force light appearance. Keep
  connection attempts bounded with a retry action, and retain keyboard focus
  after an asynchronous preference save.
  `tests/` contains dependency-free Node regression tests.

## Editing and validation

- Edit extension source files in `extension/`.
- After changing extension assets, run `sh scripts/sync-extension-resources.sh`
  so `Safari Dark Mode/Safari Dark Mode Extension/Resources/` matches.
- Use `sh scripts/sync-extension-resources.sh --check` in reviews and before
  release to catch stale packaged resources.
- Open `tests/gmail-rendering.html` through a local HTTP server for message
  rendering changes; all displayed checks must pass (reload from origin with Option-Command-R
  after fixture/source edits to avoid cached scripts), followed by real Safari
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
- For a rebuilt local install, use `sh scripts/build-and-run.sh`. It stops only
  the companion at the canonical build path, syncs resources, builds, and launches
  a fresh process. Replacing a running companion bundle can break Safari’s
  Settings handoff even when the extension remains enabled. It leaves Safari
  running and does not change extension enablement.
- For a requested local install, run the app at
  `build/DerivedData/Build/Products/Debug/Safari Dark Mode.app`, then enable it in
  Safari Settings > Extensions and grant only the supported sites. An ad-hoc
  build needs Settings > Developer > Allow unsigned extensions. The user must
  complete any macOS authentication prompt. Verify the version, popup appearance choices,
  persistence after reload, and affected Google surfaces in the actual Safari
  app. Report authentication or permission blockers accurately.
  After repeated packaged rebuilds, Safari may retain stale extension contexts in
  existing Gmail tabs. If a styled page reports “Page not connected” in the popup,
  check the same URL in a fresh tab before changing the messaging code. If Safari
  omits the extension after a rebuild and logs a signing-dictionary lookup failure,
  clean-rebuild and relaunch the local host app before touching browser state.
  Use a new build/version when verifying a revised packaged resource set; Safari
  can retain old resource contents for an already loaded extension version.
- Safari 27 can also load `extension/` through Settings > Developer > Add
  Temporary Extension. This expires after 24 hours or quitting Safari; use the
  packaged app when the user asks for a rebuilt installed extension.
- When adding a new top-level extension resource, update the Safari extension
  target resources in the Xcode project as well as running the sync script.
- Keep host permissions and native wrapper behavior aligned with
  `SECURITY.md`.
- Do not add dependencies, remote code, telemetry, or broad host permissions for
  this personal extension without documenting the reason.
- For the owner’s private maintenance workflow, commit completed changes directly to `main` in this repo, then push to
  `origin/main` right away. Do not create branches or pull requests unless
  explicitly requested.

Documentation-only edits require link/path review and `git diff --check`; they
do not require syncing unchanged resources, launching Safari, or building Xcode.

## App Store releases

- Public name: Gmail Dark Mode for Safari; publisher Stylee, Inc.; support
  hello@trystylee.com. Keep internal project and bundle identifiers stable.
- Use `scripts/archive-release.sh` with `SDM_DEVELOPMENT_TEAM` supplied in the
  environment. Never put team IDs, API credentials, or signing artifacts in docs.
- Keep App Store manifest descriptions at 112 characters or fewer. Match native
  and manifest marketing versions; increment native build numbers for uploads.
- `site/` is the canonical support/privacy source in this repository; `docs/store/` contains
  English metadata and sample-content listing images. Never publish private mail.
- First launch is free and uses MANUAL release after approval. The owner
  requested an internal TestFlight installation to verify the signed setup flow.
  Submission is distinct from public release.
- Record actual runtime coverage separately from compiled architecture/minimum
  version support. Safari 27 on macOS 26.7 is the verified release QA environment.

## Public-source preparation

Follow `docs/open-source-readiness.md` before publication or organization moves.
Never publish local tool refs with `git push --mirror`. Keep old support URLs
working for existing binaries until a verified migration is complete. Publication,
history replacement, repository transfer, and App Store release are separate actions.
External contributors should propose pull requests rather than push to the owner’s
main branch. Do not store machine-specific paths or credentials in this guide.

The canonical remote is `https://github.com/stylee-tech/gmail-dark-mode-for-safari.git`.
Keep it private. The old personal Pages repository is only a compatibility hosting
copy until a new host is verified; follow `docs/support-deployment.md`.
