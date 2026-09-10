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
embedded URLs; Build 22 uses the current native Stylee source links.

## Verification and application links

On 9 September 2026 the initial deployment succeeded, and both new HTML pages
and CSS matched `site/` byte-for-byte over HTTPS. App Store Connect's English
support and privacy URLs were updated to Stylee; Build 22 is the submitted
replacement binary.
Native source now uses the new URLs. Existing binaries retain their old URLs
until the next app update; those old links currently fail by the owner’s accepted
legacy-hosting decision. App Store metadata links already work.

For updates, verify both pages, CSS, relative navigation and contact links after
the workflow succeeds. Leave retired legacy hosting private unless instructed
otherwise, and deploy only static content.

The public source repository was replaced with a fresh repository containing only
sanitized history on 9 September 2026. Pages was re-enabled and deployed at the
same Stylee URL; links and deployment workflow did not change.

## App Store download placeholder

Both pages link to the `#download` section on `site/index.html`. Until the app is
publicly available, that section explicitly says coming soon and has a disabled
button with no destination. It does not link to TestFlight or a guessed store URL.

At release, verify the public App Store listing opens without authentication.
Replace the button marked `APP_STORE_DOWNLOAD` with an `<a class="download-button"
href="VERIFIED_APP_STORE_URL">Download on the Mac App Store</a>`. Remove the
coming-soon copy and change `download-status` to the minimum macOS/Safari
requirements. Keep the `download` section ID so navigation from both pages works.
Verify the link and mobile layout after the Pages deployment succeeds.
