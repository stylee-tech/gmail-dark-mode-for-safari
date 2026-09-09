# Contributing

This project targets Gmail, Google Sheets, and Google Search in Safari. Keep
changes scoped to those products; do not add broad host access, remote code,
telemetry, or dependencies without discussing the need first.

## Local development

Use Xcode with the macOS 26 SDK or later. Node.js is needed for the dependency-free
regression tests; Python 3 is used by packaging scripts. No `.env` file, API key,
Apple account, or production signing certificate is needed to edit the extension
and run its tests.

Edit `extension/`, then run:

```sh
node --test tests/*.test.cjs
sh scripts/sync-extension-resources.sh
sh scripts/sync-extension-resources.sh --check
git diff --check
```

For a local macOS build and launch, use `sh scripts/build-and-run.sh`.
See the README for Safari loading and website permission instructions. Use your
own signing setup if necessary; never commit signing identities or profiles.
The App Store release script requires the publisher's signing setup and is not
required for contributing.

Use sample content for fixtures. Never commit screenshots of real email,
spreadsheets, account menus, authentication pages, or App Store Connect details.
Test affected surfaces in real Safari and report the macOS/Safari versions and
what you actually checked. Passing Node tests alone is not visual verification.

## Reporting issues

Include steps to reproduce, the affected Google product, and your macOS/Safari
versions. Redact account names and private content from screenshots. Send security
reports privately to hello@trystylee.com; see SECURITY.md.

## Before publishing source

Run `python3 scripts/audit-public-source.py`. This checks reachable Git objects
as well as the current tracked files. It is a heuristic check, not proof that a
repository contains no sensitive information. Inspect images and author metadata
separately, and follow `docs/open-source-readiness.md` before changing visibility.
