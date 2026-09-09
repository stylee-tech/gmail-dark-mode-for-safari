# Support website deployment

Canonical source: `site/` in
[stylee-tech/gmail-dark-mode-for-safari](https://github.com/stylee-tech/gmail-dark-mode-for-safari).
The repository is public at the owner's direction.

## Live Stylee URLs

- https://stylee-tech.github.io/gmail-dark-mode-for-safari/
- https://stylee-tech.github.io/gmail-dark-mode-for-safari/privacy.html

`.github/workflows/pages.yml` deploys only `site/` when its files change on main,
or through manual dispatch. Official actions are pinned to commit hashes.
Deployment uses GitHub's scoped Pages/OIDC permissions, with no stored deploy key.
Never upload the whole repository, build output, or `.git` as a site artifact.

## Compatibility URLs

Legacy URLs embedded in earlier app builds:

- https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/
- https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/privacy.html

The owner explicitly chose to leave the old repository PRIVATE and archived,
accepting that these URLs no longer work. Redirect files were prepared, but are
not deployed because private Pages hosting is unavailable. Do not restore public
visibility or hosting without a new instruction. Builds 19–21 retain these old
embedded URLs; a later binary is required to use the new native source links.

## Verification and application links

On 9 September 2026 the initial deployment succeeded, and both new HTML pages
and CSS matched `site/` byte-for-byte over HTTPS. App Store Connect's English
support and privacy URLs were updated to Stylee; build 21 was not withdrawn.
Native source now uses the new URLs. Existing binaries retain their old URLs
until the next app update; compatibility redirects handle them in the meantime.

For updates, verify both pages, CSS, relative navigation and contact links after
the workflow succeeds. Preserve compatibility URLs and deploy only static content.
