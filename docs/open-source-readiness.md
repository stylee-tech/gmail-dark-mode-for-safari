# Public-source readiness and Stylee migration

Audit date: 9 September 2026. Baseline: `b0dad3b` (build 21).
The repository was private at the audit baseline; the owner subsequently made
it public. This historical audit is not authorization
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

## Final verification after licensing and history rewrite

Checked remote main `de8026a` on 9 September 2026 using a fresh clone, separate
from local backups/recovery refs:

- 89 tracked files, 36 commits, 236 unique reachable file objects.
- Only `hello@trystylee.com` in reachable author/committer metadata.
- No targeted credential, private-key, authentication URL, machine-path, or known
  private-example markers found. Long token candidates were Xcode property names.
- All 12 Node tests, JavaScript syntax checks, plist validation, resource sync,
  and diff whitespace checks passed. Ignore probes covered environment files,
  keys, certificates, private backups, release reports, and packages.
- GitHub reports MIT, PRIVATE visibility, one branch, no tags, no issues,
  releases, Actions runs, or Actions artifacts. Previously reviewed image content
  has not changed since the asset audit.

**Historical finding, resolved by repository replacement below:** GitHub's
authenticated commit API returned a
pre-rewrite commit by its old SHA with the former personal email. This verifies
server retention; it does not establish whether unauthenticated access would be
possible after changing visibility. Do not assume the rewrite erased old objects.
If that address must not become public, keep this repository private and either
arrange confirmed server-side removal or publish the sanitized branch into a
fresh repository without the old server history. No remote objects or local
backups were deleted during this verification.

## Stylee Pages cutover

The owner made the repository public on 9 September 2026. Pages is now enabled
at https://stylee-tech.github.io/gmail-dark-mode-for-safari/ and deploys `site/`
through the repository workflow. The prior private-plan blocker is resolved.
See [current deployment](support-deployment.md); earlier sections describe the
historical preparation state, not current hosting.

## Clean repository replacement completed

On 9 September 2026, at the owner's request, a fresh repository received only the
sanitized main branch from a clean remote clone. Before publication, every
reachable commit and file was checked for the former personal email, with no
matches; all author/committer emails were `hello@trystylee.com`. No local backup,
recovery ref, tool checkpoint, old Actions history, or old Git object was imported.

The prior repository was made private, renamed to a recovery archive, and
archived. The replacement reclaimed the canonical public repository name and URL.
Application source, sanitized commit history, MIT license, and Pages URL are
preserved. Existing local clones can continue using the same main branch and
remote URL, but must never push old recovery refs or use `--mirror`.

Unauthenticated verification after cutover:

- Public pre-rewrite commit web URL returned HTTP 404.
- Public commit API reported that the old SHA does not exist (HTTP 422).
- Private archive API returned HTTP 404 without authentication.
- Public commit listing contained only `hello@trystylee.com`.
- Pages deployment succeeded on the fresh repository at the existing Stylee URL.

This removes access through the active public repository. It cannot retract
copies downloaded or cached by third parties while the original was public.
The local backup and private archive remain available for owner recovery only.
