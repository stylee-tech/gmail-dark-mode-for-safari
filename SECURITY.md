# Security

Safari Dark Mode is a personal Safari Web Extension. Keep the permission and
data surfaces narrow.

## Data handling

- The extension stores only per-product enablement flags in extension-local
  storage under `enabledBySite`.
- The extension does not collect browsing history, page content, account data,
  analytics, telemetry, or remote diagnostics.
- Do not write extension state into first-party page storage such as
  `localStorage`, `sessionStorage`, cookies, or IndexedDB.
- Runtime `data-sdm-*` attributes on the root element are intentionally
  DOM-visible because CSS uses them for product and enabled-state selectors. Keep
  those attributes limited to coarse product, host, renderer, and state values;
  do not place account identifiers, page content, URLs, or user data there.
- First-party product CSS preloads at `document_start` to avoid white first
  paints on enabled pages. Safari extension storage is async, so disabled
  first-party products may briefly prepaint dark before the stored setting turns
  the CSS off.

## Host permissions

The Manifest V3 `host_permissions` and content-script matches should stay
limited to the supported Google products. Safari may present host grants at
domain granularity; retain path-level content-script matching and runtime gating:

- `mail.google.com`
- `docs.google.com/spreadsheets`
- `google.com/search` and `www.google.com/search`
- Google helper/account hosts only for embedded account/app-picker flows

Standalone account pages may run the content scripts because Safari host access
is URL-based, but styling must remain gated unless the helper page has a known
supported embedded parent flow.

## Native surface

The native Safari extension handler is intentionally inert. Do not log, echo, or
process arbitrary `browser.runtime.sendNativeMessage` payloads unless a real
native messaging feature is designed and reviewed.

The containing Mac app uses native AppKit controls to display extension status
and open Safari settings. It does not load web content or accept JavaScript
messages.

## Release checks

Stylesheets are the only web-accessible resources, restricted to the existing
Google host allowlist. Keep `activeTab` and `storage` as the only API permissions.

Before shipping or sharing a build, run:

```sh
node --test tests/*.test.cjs
python3 -m json.tool extension/manifest.json >/dev/null
plutil -lint "Safari Dark Mode/Safari Dark Mode/Info.plist" \
  "Safari Dark Mode/Safari Dark Mode Extension/Info.plist"
sh scripts/sync-extension-resources.sh --check
xcodebuild -project "Safari Dark Mode/Safari Dark Mode.xcodeproj" \
  -scheme "Safari Dark Mode" -configuration Debug \
  -derivedDataPath build/DerivedData build
```
