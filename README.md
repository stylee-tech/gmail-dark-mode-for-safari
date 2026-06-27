# Safari Dark Mode

Personal Safari Web Extension that applies a focused dark theme to:

- Gmail (`https://mail.google.com/*`)
- Google Sheets (`https://docs.google.com/spreadsheets/*`)
- Google Search results (`https://google.com/search*` and `https://www.google.com/search*`)

This is intentionally not a general-purpose dark-mode engine. It keeps the
permission surface small and only targets the Google products I use.
The extension also asks Safari for Google account/app-picker hosts so embedded
Gmail account switcher surfaces can be themed. Content scripts may run on those
helper hosts, but styling is gated unless the helper page is part of a known
supported product flow.

## Build the Safari wrapper

The source extension lives in `extension/`.

To generate a local macOS Safari extension app:

```sh
xcrun safari-web-extension-converter extension \
  --project-location . \
  --app-name "Safari Dark Mode" \
  --bundle-identifier "dev.pavelsuzdaltsev.safaridarkmode" \
  --macos-only \
  --copy-resources \
  --no-open \
  --no-prompt
```

Then open `Safari Dark Mode/Safari Dark Mode.xcodeproj`, build and run the app,
and enable the extension in Safari:

1. Safari -> Settings -> Extensions
2. Enable "Safari Dark Mode"
3. Grant access for Gmail, Google Sheets, Google Search, and the Google account
   helper domains Safari prompts for

For personal local use, enable Safari's Develop menu and choose
`Develop -> Allow Unsigned Extensions` if Safari does not show the debug build.

## Development

The extension defaults to dark mode on supported sites. Use the toolbar
popup to disable it per site.
Preload waits for extension-local settings before applying dark styles, so a
site disabled in the popup should not flash dark during the next page load.

Edit files in `extension/`, then sync the Safari wrapper resources:

```sh
sh scripts/sync-extension-resources.sh
```

Verify the packaged copy is current:

```sh
sh scripts/sync-extension-resources.sh --check
```

When adding a new top-level file or directory under `extension/`, also add it to
the Safari extension target resources in Xcode. The sync script copies files, but
the Xcode project controls what is packaged into the `.appex`.

The Google Sheets grid is rendered mostly on canvas, so Sheets keeps its chrome
site-specific and uses targeted grid/canvas fallbacks for the work area. Gmail
and Google Search stay on site-specific CSS because Gmail in particular is
fragile when broad styling is applied to dialogs and dynamic app surfaces.

## Security and privacy

- Extension preferences are stored only in extension-local storage.
- The extension does not store state in Google page storage and does not collect
  analytics, browsing history, page content, or account data.
- Root `data-sdm-*` attributes are used only as coarse CSS state for the active
  product, host, renderer, and enabled state.
- CSS files are exposed as web-accessible resources so Safari can load them from
  content scripts; keep that list limited to the styles the registry uses.
- The native Safari extension handler is intentionally inert and should stay
  that way unless a reviewed native messaging feature is added.

See `SECURITY.md` for release checks and permission rules.

## Reference-driven constraints

This project follows the lightweight Safari-extension pattern used by older
extensions like Nightshift: inject CSS as early as possible, keep the runtime
small, and make the toggle site-aware. It also avoids a full dynamic color
engine because Safari extension performance and platform quirks are more
noticeable during initial page load. For this personal extension, the strategy
is static site-specific CSS with narrow fallback rules for canvas-heavy surfaces.
