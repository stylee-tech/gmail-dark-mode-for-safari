# Repository Notes

- Edit extension source files in `extension/`.
- After changing extension assets, run `sh scripts/sync-extension-resources.sh`
  so `Safari Dark Mode/Safari Dark Mode Extension/Resources/` matches.
- Use `sh scripts/sync-extension-resources.sh --check` in reviews and before
  release to catch stale packaged resources.
- When adding a new top-level extension resource, update the Safari extension
  target resources in the Xcode project as well as running the sync script.
- Keep host permissions and native wrapper behavior aligned with
  `SECURITY.md`.
- Do not add dependencies, remote code, telemetry, or broad host permissions for
  this personal extension without documenting the reason.
