# Repository Notes

- Edit extension source files in `extension/`.
- After changing extension assets, run `sh scripts/sync-extension-resources.sh`
  so `Safari Dark Mode/Safari Dark Mode Extension/Resources/` matches.
- Use `sh scripts/sync-extension-resources.sh --check` in reviews and before
  release to catch stale packaged resources.
- After code or resource changes, rebuild the macOS wrapper with XcodeBuildMCP
  when available. First verify/set defaults for
  `Safari Dark Mode/Safari Dark Mode.xcodeproj`, scheme `Safari Dark Mode`,
  configuration `Debug`, platform `macOS`, and derived data path
  `build/DerivedData`; then run the MCP build action. If XcodeBuildMCP is not
  available or cannot run the macOS build, fall back to:
  `xcodebuild -project "Safari Dark Mode/Safari Dark Mode.xcodeproj" -scheme "Safari Dark Mode" -configuration Debug -derivedDataPath build/DerivedData build`.
- When adding a new top-level extension resource, update the Safari extension
  target resources in the Xcode project as well as running the sync script.
- Keep host permissions and native wrapper behavior aligned with
  `SECURITY.md`.
- Do not add dependencies, remote code, telemetry, or broad host permissions for
  this personal extension without documenting the reason.
- Commit completed changes directly to `main` in this repo. Do not create
  branches or pull requests unless explicitly requested.
