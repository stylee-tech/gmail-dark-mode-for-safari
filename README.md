# Gmail Dark Mode for Safari

Safari Web Extension that applies a focused dark theme to:

- Gmail (`https://mail.google.com/*`)
- Google Sheets (`https://docs.google.com/spreadsheets/*`)
- Google Search results (`https://google.com/search*` and `https://www.google.com/search*`)

This is intentionally not a general-purpose dark-mode engine. It keeps the
permission surface small and only targets Gmail, Sheets, and Search.
The extension also asks Safari for Google account/app-picker hosts so embedded
Gmail account switcher surfaces can be themed. Content scripts may run on those
helper hosts, but styling is gated unless the helper page is part of a known
supported product flow.

## Build and install in Safari

The source extension lives in `extension/`. The existing Xcode project is the
maintained macOS wrapper; do not regenerate it for ordinary development.
Version 1.0 uses Manifest V3 and requires macOS 26 and Safari 26 or later.
Live rendering QA was performed on macOS 26.7 with Safari 27. Safari 26 and
Intel hardware have not been runtime-tested; the release contains both arm64
and x86_64 binaries.

```sh
sh scripts/sync-extension-resources.sh
xcodebuild -project "Safari Dark Mode/Safari Dark Mode.xcodeproj" \
  -scheme "Safari Dark Mode" -configuration Debug \
  -derivedDataPath build/DerivedData build
open "build/DerivedData/Build/Products/Debug/Safari Dark Mode.app"
```

Then enable **Gmail Dark Mode for Safari** in **Safari > Settings > Extensions** and
allow access to the supported Google sites. Reload existing Google tabs after
installing or updating. Check the current Safari profile if an enabled extension
does not appear in a window.

For a local ad-hoc build, enable **Settings > Advanced > Show features for web
developers**, then **Settings > Developer > Allow unsigned extensions**. macOS
may ask you to authenticate. Older Safari versions expose the unsigned-extension
option in the Develop menu. This is a development installation, not a signed
App Store release. Safari can reset unsigned-extension permission after quitting;
if the extension disappears, check that setting again.

### Quick iteration in Safari 27

**Settings > Developer > Add Temporary Extension…** can load the `extension/`
folder directly. Use **Reload** in Extensions settings after edits. Temporary
extensions expire after 24 hours or when Safari quits; use the rebuilt wrapper
for the regular local installation. Avoid enabling both copies simultaneously.

Apple documents the [installation and update workflow](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)
and [Safari manifest compatibility](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility).

## Development

Each supported product defaults to **System (Follow device)**, which follows
macOS appearance. The toolbar popup shows three one-click choices:
**On (Always dark)**, **Off (Website default)**, and **System (Follow device)**.
Off restores the website’s own appearance; it does not force a light theme.
Choices apply across that product’s tabs. Existing enabled preferences become
System; disabled preferences stay Off. The popup reports the selected mode and
active appearance, or explains when the page needs access or a reload.
Safari injects the main product CSS at `document_start` to reduce first-paint
white flashes on enabled pages. Because Safari extension storage is async, a
site disabled in the popup may briefly prepaint dark until the stored setting is
read.

Edit files in `extension/`, then sync the Safari wrapper resources:

```sh
sh scripts/sync-extension-resources.sh
```

Verify the packaged copy is current:

```sh
sh scripts/sync-extension-resources.sh --check
```

For a packaged installation, rebuild after syncing so Safari receives the new
assets. For a temporary installation, reload it in Safari Settings instead.

For message rendering changes, serve this repository locally and open
`tests/gmail-rendering.html`. Its checks cover ordinary text, HTML cards, buttons,
images, dynamic messages, disabling/re-enabling, and observer stability.

Run the dependency-free regression checks (Node 18+):

```sh
node --test tests/*.test.cjs
git diff --check
```

Verify the popup on a supported page: switch off/on, reopen the popup, and reload
the page. Confirm that preferences persist and that switching system appearance
does not re-enable a disabled product. Check Gmail, Search, and Sheets chrome;
standalone Google account pages must remain untouched. The popup times out after
four seconds if Safari does not respond and offers Retry connection instead of
staying stuck. Keyboard focus remains on the appearance choice after saving.

When adding a new top-level file or directory under `extension/`, also add it to
the Safari extension target resources in Xcode. The sync script copies files, but
the Xcode project controls what is packaged into the `.appex`.

Sheets keeps its grid’s native layers intact and applies a scoped canvas filter
for dark cells. Displayed fill/text colors change, but document formatting does
not. Native scrollbars are styled separately. Never paint opaque backgrounds over
grid layers.
Gmail message bodies are dark too. A Gmail-only renderer converts text and
background colors together, preserves images and already-dark surfaces, and
rechecks newly opened messages. Image-backed sections retain their original text
and backing colors, including transparent images. Inline `!important` styles are
converted as a pair and restored when Off, without discarding newer sender edits.
Its color conversion takes inspiration from [Chromium Auto Dark Mode's
lightness-based color filter](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/platform/graphics/dark_mode_color_filter.cc):
adjust perceptual lightness independently of chroma, distinguish backgrounds from
foregrounds, and preserve readable colors and images. This is a Gmail-specific
DOM implementation, not Chromium's paint-time engine or image classifier.
Gmail and Google Search stay on site-specific CSS because Gmail in particular is fragile
when broad styling is applied to dialogs and dynamic app surfaces.

## Security and privacy

- Extension preferences are stored only in extension-local storage.
- The extension does not store state in Google page storage and does not collect
  analytics, browsing history, page content, or account data.
- Root `data-sdm-*` attributes are used only as coarse CSS state for the active
  product, host, renderer, enabled state, and preload phase.
- CSS files are exposed as web-accessible resources so Safari can load them from
  content scripts; keep that list limited to the styles the registry uses.
- The native Safari extension handler is intentionally inert and should stay
  that way unless a reviewed native messaging feature is added.

See `SECURITY.md` for release checks and permission rules.

## Reference-driven constraints

This project follows the lightweight Safari-extension pattern used by older
extensions like Nightshift: inject CSS as early as possible, keep the runtime
small, and make the appearance setting site-aware. It also avoids a full dynamic color
engine because Safari extension performance and platform quirks are more
noticeable during initial page load. For this extension, the strategy
is static site-specific CSS with narrow fallback rules for canvas-heavy surfaces.

### Reliable local rebuilds

Run `sh scripts/build-and-run.sh` when updating the installed development build.
It closes only this project's running companion, syncs and builds the extension,
and launches the new app. Keeping the old companion running while replacing its
bundle can make its **Open Safari Extension Settings** button fail. The script
does not quit Safari or toggle the extension.

For `tests/gmail-rendering.html`, use Safari's Reload Page From Origin
(Option-Command-R) after editing the fixture or renderer to avoid testing a cached
script revision.


## App Store release

Version 1.0.0 (21), free from Stylee, Inc., was resubmitted on 9 September 2026
and is waiting for App Review. Release remains manual after approval.
The enabled-state companion button says “Go to Settings…” and opens Extensions.
TestFlight build 20 remains installed on this Mac.
See [release status and checklist](docs/app-store-release-plan.md).

- [Help and support](https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/)
- [Privacy policy](https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/privacy.html)
- Support: hello@trystylee.com

Set `SDM_DEVELOPMENT_TEAM` in your shell to the configured publisher team, then run
`sh scripts/archive-release.sh`. This runs regressions, syncs resources, archives
both architectures, and exports an App Store package to `build/AppStore/`.
Signing remains automatic; account identifiers and signing artifacts stay out of
source control. This script does not upload or release the app.

The public support site lives in a separate repository,
[pavel-suzdaltsev/gmail-dark-mode-support](https://github.com/pavel-suzdaltsev/gmail-dark-mode-support).
Only the contents of `site/` are published there; extension source stays private.
