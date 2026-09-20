# Mac App Store release

Updated 10 September 2026. Submitted build: **1.0.0 (22)** — **WAITING_FOR_REVIEW**.

## Current remaining work

Source update, 11 September 2026 (not included in submitted Build 22): Sheets
matching now includes the exact `/spreadsheets` home URL, including query
parameters, as well as all existing document/account/published paths. Connection
failure copy recommends reload/retry before checking permissions. The reported
document connected in the installed Safari extension both before and after a
reload; its earlier failure was not reproduced. It was in System mode with light
device appearance. All 14 Node regressions and a Debug build pass. These source
changes require a new distributed build before installed users receive them.

Additional source update, 11 September 2026: Google Search's People also ask
uses recolored native separators without duplicate button borders, and expanded
answer emphasis uses a dark backing. People also search for has a readable
heading, dark cards, and contrasting search icons. Verified through a live CSS
preview in Safari 27: collapsed/expanded questions, related-link navigation, and
Off/System restoration, with screenshots and computed colors inspected. Packaged
resources are synchronized; this CSS update has not been installed as a new
binary or included in Build 22. Other Google markup variants remain unverified.

- Build 22 is WAITING_FOR_REVIEW with manual release after approval.
- Native source and submitted Build 22 use the Stylee support/privacy URLs.
- Build 22 includes the verified Google account switcher, Gmail Trash notice, and
  advanced-search fixes. Reload-flash behavior remains unchanged because no
  reliable prevention method was established.
- Safari 26, Intel hardware, and other Macs still lack runtime coverage.

Repository publication and Stylee Pages migration are complete. Public commit
emails use the support address; recovery repositories remain private and archived.

## Approved launch decisions

- Public name: **Gmail Dark Mode for Safari**.
- Publisher: **Stylee, Inc.**, using its existing developer membership.
- Price: **Free**. Separate app record and stable extension-project bundle IDs.
- Support: **hello@trystylee.com**.
- Three visible choices: On (Always dark), Off (Website default), and
  System (Follow device). Off does not force light appearance.
- The initial plan skipped TestFlight; the owner subsequently requested a
  TestFlight installation to verify the signed Settings button before submission.
  Keep **manual release after approval**; no automatic public release.

## Product QA and compatibility

The rendering fixes preceding 1.0 were verified in real Safari 27 on macOS 26.7:
Gmail listing/sidebar, plain and HTML messages, compose controls, search;
Sheets controls, filtered grid, selection and scrollbars; Google Search results
and suggestions. The Gmail fixture passed 31 browser assertions in Safari and
Chromium. Synthetic test drafts were removed. Images and image-backed email
sections retain their original appearance by explicit product decision.

The 1.0 release changes branding, native onboarding and packaging, without
changing the verified rendering engine. Twelve Node regressions pass, including
an App Store manifest-description length check. Packaged extension resources
match the source; native and extension versions match.

Minimum deployment settings are macOS 26 and Safari 26. The package includes
arm64 and x86_64 binaries. **Safari 26 and Intel hardware have not been runtime
tested.** Do not describe compiled compatibility as runtime verification.
Multi-Mac runtime coverage remains a follow-up check. An internal TestFlight
group was initially given build 19 for verifying the Apple-installed setup flow on this Mac.

## Signed package

Run `scripts/archive-release.sh` with `SDM_DEVELOPMENT_TEAM` in the environment.
It syncs resources, runs Node tests, archives Release and exports
`build/AppStore/Safari Dark Mode.pkg` using Xcode's existing automatic signing.
The script does not upload or submit. Build output and account details are ignored.

Both targets are sandboxed. Unused user-selected file access was removed.
The native wrapper adds enablement instructions, mode explanations and fixed
Help/Privacy links. Unsigned-extension advice appears only in Debug builds.
No native required-reason APIs or third-party SDKs are used. Non-exempt encryption
is declared false in the app Info.plist.

Build 18 passed local signing checks but Apple rejected its manifest description
(error 90849: maximum 112 characters). Build 19 shortens it and adds a regression
check. Apple processed build 19 as VALID / APP_STORE_ELIGIBLE, and it was initially attached
to version 1.0.0; build 22 is the current submitted binary. The exported package passed deep, strict signature verification;
its resources, versions and architectures were checked directly.

Historical build 19 package SHA-256: `744e5c3409edf6bd8add06cb6862871fd8a4c25904a4158e17eaff32a40592d3`.

## Listing and public pages

- [Support and setup](https://stylee-tech.github.io/gmail-dark-mode-for-safari/)
- [Privacy policy](https://stylee-tech.github.io/gmail-dark-mode-for-safari/privacy.html)
- [English metadata](store/metadata.json)
- [Sample screenshot fixture](store/preview.html)

Support/privacy source is consolidated in this public repository's `site/`
directory. The old personal support repository remains a hosting copy for existing
binaries; see [deployment status](support-deployment.md).
Both public URLs were verified to return HTTP 200.

Four 2560 × 1600 listing images show sample inbox/email content, a sample Sheets
canvas and the real popup UI with a test browser adapter. They use the extension's
CSS/renderer, are marked as samples, and contain no private mailbox content.
All four uploaded assets have completed processing with correct dimensions.

The extension supplies appearance controls only: it does not host messaging,
user-generated content, advertising or a web browser. The age declaration reflects
those features of the extension, rather than third-party content a user already
views in Safari. It distributes no third-party content. App Privacy must be
published as Data Not Collected, consistent with the code and public policy.

## Submission status

The separate macOS app record has been created. English metadata, category,
review contact/notes, screenshots and free pricing are configured. Build 22 is
attached. Release type is MANUAL. The owner configured all 175 countries/regions
and accepted the updated developer agreement. App Privacy was published as
Data Not Collected and verified in Safari. `asc validate` reports zero errors
and zero warnings.

Version 1.0.0 (19) was submitted on 9 September 2026 at 18:14 UTC, then withdrawn
at the owner's request for another improvement batch. Apple's API confirmed
**DEVELOPER_REJECTED** after cancellation; release type remains **MANUAL**.
The hold was lifted by the owner for build 22; the app is not publicly released.

The Google account switcher across Gmail, Sheets and Search, Gmail's Trash notice
banner, and Gmail's advanced search/filter panel are covered by the Build 22
fixtures and Safari verification. Leave reload-flash prevention unchanged unless
a reliable solution is established; the current implementation already requests
document-start injection.

Build 20 was uploaded to the existing internal TestFlight group and installed on
this Mac. Build 22 supersedes it for App Review after the rendering fixes. All
13 regression tests and archive/export passed.

The first build-20 status check failed because Xcode had registered the release
archive alongside the TestFlight app. Unregistering only the archive restored
the green “Extension enabled” state, verified by screenshot. The archive script
now unregisters its packaging copy after export to prevent this conflict.

Build 22 UI correction: the enabled-state button says “Go to Settings…”
and directs users to Websites → Gmail Dark Mode for Safari. The public
SafariServices handoff opens Extensions; it does not expose a website-access
pane selector. This copy correction is not in installed TestFlight build 20.

Before the TestFlight installation, Safari registered the old unsigned 0.2.15
extension while the companion ran from a signed archive. That mismatch was a
possible cause of the earlier Settings failure. Local/trash registrations were
removed narrowly without deleting their archived builds or receipts.

An Internal Testing group contains build 19 and the owner's tester account.
TestFlight build 19 was downloaded and opened from `/Applications/Safari Dark Mode.app`.
The installed copy has an Apple receipt and Safari recognizes the signed extension
as enabled. Clicking its Settings button opened Safari's Extensions pane with
Gmail Dark Mode for Safari 1.0.0 selected and enabled, confirmed by screenshot.
The accessibility tree continued reporting the underlying browser window; that
stale text alone must not be interpreted as a Settings-button failure.

The final CLI readiness check reported zero errors and zero warnings. Its
privacy-publication informational note was covered by the earlier Safari check.
The CLI submission wrapper initially failed its final item lookup; a subsequent
read confirmed the correct version was already attached, and submitting that
same submission succeeded without creating a duplicate.

After approval, release manually, check installation from the live App Store,
and tag the shipped commit. Google UI changes are the main maintenance risk;
repeat the three-site smoke test for every update and request sanitized examples
through support without adding page-content telemetry.

## Apple references

- [Safari extension distribution](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Age rating definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)
- [Mac screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)

## Build 22 resubmission

On 10 September 2026 at 00:18 UTC, Apple confirmed WAITING_FOR_REVIEW for
version 1.0.0, build 22. The owner explicitly authorized this resubmission.
The signed archive/export and all 13 regression tests passed; App Store
validation reported zero errors and zero warnings. Release remains MANUAL.
The previous Build 21 submission was cancelled so Build 22 could replace it.
