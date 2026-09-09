# Public-source readiness and Stylee migration

Audit date: 9 September 2026. Baseline: `b0dad3b` (build 21).
The repository remains private. This document is preparation, not authorization
to change visibility, rewrite history, transfer repositories, or release the app.

## Audit findings

- Reviewed current application, native targets, manifests, scripts, documentation,
  and tracked assets. No runtime telemetry, data uploads, or remote executable
  code was found. The only JavaScript fetch loads bundled CSS. The native handler
  is inert, and the app opens fixed help/privacy URLs and Safari Settings.
- Scanned all local reachable refs: 32 commits and 223 unique file objects at the
  baseline, including local checkpoint refs. The remote advertises one branch
  and no tags. No `.env`, signing key/profile, credential literal, authentication
  URL, or private mail/document content was found by the targeted history scan.
  A separate scan of 131 unreachable local blobs found no targeted credential
  patterns; those objects are not part of a normal branch push. High-entropy
  candidates were Xcode property names, not tokens.
  This is a bounded audit, not a guarantee that every possible secret format is
  recognized. Do not validate suspected credentials by using them.
- At the audit baseline, commit author/committer metadata contained a personal
  email address (corrected on main below). Making
  existing history public exposes it even after changing current files. This is
  personal information, not an authentication secret.
- All 13 distinct current PNG assets were visually reviewed: four sample-content
  listing screenshots and nine icon variants. No private content was observed.
  Historical image contents match the reviewed current assets. Icon-master
  metadata includes generation provenance; it is not a signing key.
- Production bundle identifiers contain the original publisher namespace. They
  are public application identifiers, not credentials, and must remain stable
  for App Store updates. Author credit is also not a secret.
- Local build archives, exported packages, signing output, and reports are
  ignored. Never publish the working directory wholesale. Publish reviewed Git
  content only. Ignore rules do not remove already-committed historical data.
- The audit did not inspect GitHub private messages, external CI logs, deleted
  remote objects, caches, or other repositories' full histories. A transfer of
  the support repository needs its own history check before proceeding.

## Changes prepared

Expanded ignore rules cover environment files, private keys/profiles, generated
packages, local tool configuration, logs, and test artifacts. Added contribution
instructions, private vulnerability reporting, and a dependency-free history
pattern scan in `scripts/audit-public-source.py`. Runtime rendering is unchanged.

## Publication decisions

1. Completed: the owner selected MIT with Copyright (c) 2026 Stylee, Inc.
   See [LICENSE](../LICENSE) and [asset scope](../ASSETS.md). This license choice
   does not change repository visibility.
2. The owner transferred the source to `stylee-tech/gmail-dark-mode-for-safari`
   and requested support source consolidation into that same private repository.
3. Historical email correction completed at the owner's request on 9 September
   2026: all 34 main-branch commits were rewritten to use `hello@trystylee.com`
   as author/committer email; names, timestamps, messages and file trees were
   preserved. Future commits in this checkout use the same email. The old
   history is retained only in ignored local backups and local recovery refs;
   never push those refs. Other clones must realign with the rewritten main.
   GitHub may retain old commit objects by SHA; rewriting the branch is not a
   guarantee of server-side erasure. Review that retention before publication.
4. Immediately before publication, rerun the audit on the exact publication
   candidate, inspect untracked files and assets, and check GitHub releases,
   Actions artifacts, issues, discussions, and repository settings for exposure.
   Publish only intended branches/tags; never `git push --mirror` from this clone,
   because it contains local tool checkpoint refs.

## Migration plan

### 1. Consolidation completed; hosting cutover pending

Canonical private repository:
`https://github.com/stylee-tech/gmail-dark-mode-for-safari`.
Both application and support/privacy source live here; website files are in `site/`.
All four files were compared by Git blob hash against the old support repository
and matched exactly. No old support history was imported.

GitHub rejected Pages enablement because the organization's current plan does not
support Pages for this private repository. Visibility was not changed. A future
Pages address would be `https://stylee-tech.github.io/gmail-dark-mode-for-safari/`,
with `privacy.html` underneath; these are not live or verified addresses.
See [support deployment](support-deployment.md) for the remaining hosting choice.

### 2. Preserve old links

Builds 19–21 embed the personal Pages URLs, and build 21 is waiting for review.
Keep the current personal support/privacy pages working. Do not assume GitHub
repository redirects also redirect Pages. Retain equivalent pages at the old
addresses or deploy explicit page-level redirects with a readable fallback link.
Keep these as long as distributed binaries can still reference them.

### 3. Switch consumers after verification

Update these files together, after the new endpoints are live:

- `Safari Dark Mode/Safari Dark Mode/ViewController.swift`: help/privacy URLs;
  requires a new signed build and version/build-number handling.
- `docs/store/metadata.json`: support and privacy URL fields.
- `README.md` and release documentation: support repository and site references.
- App Store Connect: version support URL and app-info privacy policy URL.

The in-review build cannot be edited in place. Coordinate the next binary with
App Review; do not withdraw or replace build 21 merely to prepare this migration.
The static policy already identifies Stylee, Inc. and GitHub Pages as host, so
moving GitHub ownership does not itself change app data collection behavior.

### 4. Validate and roll back safely

Run Node regressions, resource sync checks, the public-source audit, and the
native build when native URLs change. Verify help/privacy buttons in an installed
signed build. Check old and new URLs without credentials. Preserve the previous
site deployment and URL values until validation passes so rollback is just a
content/metadata update. Confirm organization admin access and Pages deployment
ownership, then update local remotes only after the destination exists.

## Known product limitations

The Google account menu, Gmail Trash notice banner, and advanced search/filter
panel still have reported white surfaces. Reload-flash prevention is unchanged.
This source/publication audit does not certify those rendering issues resolved.
Safari 26 and Intel compatibility are compiled targets, not runtime-tested claims.
