# Mac App Store release plan

Status: proposed, 9 September 2026. Planning baseline: version 0.2.10,
commit c1870df. No App Store records, uploads, submissions, or account changes
are part of this planning pass.

## First-release scope

Ship a macOS Safari Web Extension for Gmail, Google Sheets, and Google Search.
Keep the three one-click choices: On (Always dark), Off (Website default), and
System (Follow device). Off must not be marketed as forced light mode.
Use the existing native Mac app as the installation/help interface.
Proposed release version: 1.0.0, after the gates below pass.

Publisher setup:

- Active Apple Developer Program membership confirmed by Pavel.
- Reuse the developer team configured in the sibling Stylee project:
  [Stylee Xcode project](../../stylee-core/mobile/Stylee.xcodeproj/project.pbxproj).
  Source inspection found one configured team and automatic signing. Keep the
  actual team/account identifiers out of this plan.
- [Stylee export options](../../stylee-core/mobile/StyleeAppStoreExportOptions.plist)
  use App Store Connect export, automatic signing, and managed build numbering;
  they omit an explicit team override. Adapt this workflow for macOS, rather than
  copying iOS provisioning profiles or Stylee-specific artifact policies.
- Refer to [Stylee mobile release guidance](../../stylee-core/mobile/README.md)
  for existing archive/preflight conventions. Reuse available account access when
  release execution begins; credentials and live account permissions have not
  been inspected in this planning pass.
- This extension remains a separate product with its own app record and bundle
  identifiers. Confirm the displayed seller when creating that record.

Decisions still needed:
- Free or paid upfront; exact price if paid.
- Public product name: working name is Safari Dark Mode. Confirm availability
  and branding before preparing final art; describe the supported sites clearly
  without implying affiliation with Apple or Google.
- Minimum supported macOS/Safari versions, based on versions we can test.
- Support contact, hosting for support/privacy pages, launch territories.

## 1. Finish and verify the product

- Verify the new popup in actual Safari: all three choices, saved state after
  reopening/reloading/restarting Safari, and live system appearance changes.
- Recheck Gmail sidebar labels, ordinary messages, styled HTML messages,
  low-contrast images/logos, reply controls, menus, and compose behavior.
- Recheck Sheets grid/text, colored cells, selection, frozen panes, scrolling,
  scrollbar corners, toolbar fields, tabs, and unused canvas. The final scrollbar
  change and popup still need live verification; local test/build success alone
  is not sign-off. Confirm that no document formatting is changed.
- Check Search results, menus, and interactions with Google's native dark theme.
- Test access denied/granted/revoked, fresh install, update, multiple tabs,
  supported helper frames, and unstyled standalone account pages.
- Test on the current public Safari release and the oldest version we advertise;
  development testing on Safari 27 alone is insufficient. Test supported Mac
  architectures before claiming support.
- Run Node regressions, Gmail rendering fixture checks, syntax checks, resource
  sync checks, and a Release archive validation.

Gate: no outstanding blank grids, unreadable labels/messages, broken controls,
or unverified known regressions. Document any intentional color changes.

## 2. Prepare the distributable Mac app

- Use the confirmed Stylee developer team; verify availability of both existing
  extension-project bundle identifiers before registering the app and extension.
- Configure App Store distribution signing for both targets. Current source has
  automatic signing but no development team; successful ad-hoc builds are not
  evidence of App Store signing readiness.
- Reconcile project-level macOS 26.5 and target-level macOS 11.0 settings with the
  chosen compatibility policy. The manifest currently advertises Safari 15.4+;
  that is a claim to validate, not proof of compatibility.
- Keep the sandbox enabled and review the archived entitlements and permissions.
- Remove development-only unsigned-extension advice from release onboarding.
  Add clear enablement steps, supported-site access guidance, Help, and Privacy.
- Review the existing app icon at store size; complete extension/toolbar icon
  variants as needed. Do not assume the current development assets are final.
- Set matching release versions for wrapper and extension, and an increasing
  build number. Archive with a currently accepted release Xcode/SDK, validate,
  then upload through Xcode Organizer/App Store Connect.

Gate: signed archive validates and installs without enabling unsigned extensions.

## 3. Prepare privacy and the product page

- Host a public privacy policy and support page; add accessible links in the app.
  SECURITY.md is useful source material, not a substitute for a user-facing policy.
- Audit the release binary before completing App Privacy. The current design
  appears compatible with “Data Not Collected”: preferences and rendering stay
  on-device. Explain that site access is used to restyle pages, not collect mail.
- Review privacy-manifest/required-reason API applicability for the final native
  code and any dependencies; do not add invented declarations.
- Reassess Google account-helper host access and remove any host that is not
  necessary for tested functionality.
- Prepare name, subtitle, description, keywords, category, support/privacy URLs,
  copyright, age rating, pricing/territories, and applicable export-compliance
  and trader-status answers.
- Capture 4–5 Mac screenshots using synthetic mail and spreadsheet content:
  Gmail, styled email, Sheets, Search, and the appearance selector/setup.
  Do not reuse personal mailbox screenshots or authentication messages.
  Suggested output: 2560 × 1600, opaque PNG, 16:10.
- State limits plainly: three supported products, Sheets displayed colors change,
  original website appearance is restored when Off, and no forced-light mode.

Gate: accurate listing, working public URLs, no personal information in assets.

## 4. Beta-test the signed build

- Create the macOS App Store Connect record after publisher/name decisions.
- Upload the signed build and distribute through TestFlight to a small group.
  External testing may require beta review.
- Supply enablement instructions and a short checklist covering the three sites,
  appearance modes, permissions, fresh install, and an update.
- Fix reproducible failures and rerun affected checks on the replacement build.

Gate: testers can install, enable, use, and update the extension independently.

## 5. Submit and release

- Prepare App Review notes describing the Mac wrapper, how to enable the
  extension, supported hosts, and steps to exercise all three appearance modes.
- Arrange reviewer access or a suitable reproducible demo for authenticated
  Gmail/Sheets flows; never put personal credentials in the repository.
- Complete remaining App Store Connect agreements and declarations. Paid
  distribution also needs the applicable commercial agreement and financial setup.
- Validate metadata/build selection, choose manual release, and submit the
  reviewed candidate when publication is authorized.
- Address review feedback, release the approved version, and verify installation
  from the live listing. Tag the exact shipped commit and preserve release notes.

Gate: App Review approval plus a deliberate public-release decision. Apple’s
review/enrollment timing is external; no fixed launch date is promised here.

## 6. Maintain after launch

Google UI changes are the main ongoing maintenance risk. Keep sanitized fixtures,
record Safari/macOS versions with bug reports, and repeat the three-site smoke
test for each update. Use a support channel without introducing page-content
telemetry. Keep future scope limited until this release is stable.

## Apple references checked for this plan

- [Safari extension distribution](https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension): signed containing app and extension, developer membership, archive/upload route.
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/): extension behavior and minimum necessary host access (§4.4), privacy policy (§5.1.1).
- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy): required privacy policy URL.
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/): definition of off-device data collection.
- [Mac screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/): accepted sizes and opaque image requirements.
- [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview): beta distribution and feedback.
- [Developer Program enrollment](https://developer.apple.com/help/account/membership/program-enrollment): membership requirements and annual fee (99 USD or local currency where available).
- [Creating a Safari web extension](https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension): icon assets for containing app and extension.

Recheck submission/toolchain requirements when preparing the release archive.
