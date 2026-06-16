# Safari Dark Mode

Personal Safari Web Extension that applies a focused dark theme to:

- Gmail (`https://mail.google.com/*`)
- Google Sheets (`https://docs.google.com/spreadsheets/*`)
- Google Search results (`https://www.google.com/search*`)

This is intentionally not a general-purpose dark-mode engine. It keeps the
permission surface small and only targets the Google products I use.
The extension also asks Safari for Google account/app-picker hosts so embedded
Gmail account switcher surfaces can be themed, but standalone account pages are
ignored by the product registry.

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

Edit files in `extension/`, then sync the Safari wrapper resources:

```sh
sh scripts/sync-extension-resources.sh
```

The Google Sheets grid is rendered mostly on canvas, so Sheets uses a
Nightshift-style page filter with small toolbar/menu overrides. Gmail and
Google Search stay on site-specific CSS because Gmail in particular is fragile
when broad styling is applied to dialogs and dynamic app surfaces.

## Reference-driven constraints

This project follows the lightweight Safari-extension pattern used by older
extensions like Nightshift: inject CSS as early as possible, keep the runtime
small, and make the toggle site-aware. It also avoids a full dynamic color
engine because Safari extension performance and platform quirks are more
noticeable during initial page load. For this personal extension, the strategy
is static site-specific CSS where practical, and a simple filter mode where the
app is canvas-heavy enough that selector styling is brittle.
