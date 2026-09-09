# Support website ownership and deployment

The canonical source is `site/` in the private repository
[stylee-tech/gmail-dark-mode-for-safari](https://github.com/stylee-tech/gmail-dark-mode-for-safari).
The extension, native app, support page, and privacy policy are maintained together.
Do not edit a separate support-source repository.

## Current deployment

On 9 September 2026, all four files in the old support repository were verified
by Git blob hash to match `site/` exactly: `.nojekyll`, `index.html`, `privacy.html`,
and `style.css`. Thus consolidation requires no additional content import or
history merge. The local origin now points at the organization's renamed repo.

The public URLs embedded in existing builds remain:

- https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/
- https://pavel-suzdaltsev.github.io/gmail-dark-mode-support/privacy.html

The old repository is retained only as a hosting copy, not the canonical source.
Do not delete, privatize, or archive it until replacement hosting and compatibility
links are verified. Do not change native or App Store links to an unserved URL.

## Hosting blocker

GitHub's Pages creation API rejected this private organization repository with:
“Your current plan does not support GitHub Pages for this repository.”
The repository remains private as requested. Choose a plan supporting private
repository Pages, or another static host, before moving live hosting.
Until then, publish reviewed changes from `site/` to the existing hosting copy.
Only export those four static files, never the whole private repository or `.git`.

## Cutover checklist

1. Enable the selected host without changing source visibility.
2. Deploy only `site/`. No build process, credentials in site files, or runtime
   environment variables are needed.
3. Verify HTTPS, both pages, CSS, relative navigation and support email links.
4. Keep existing URLs working through equivalent content or explicit redirects
   with fallback links. Test them separately; repository redirects are insufficient.
5. Update native help/privacy URLs and App Store metadata only after verification;
   native links require a subsequent binary. Build 21 in review is unchanged.
6. Keep this document and README aligned with actual hosting ownership and URLs.
