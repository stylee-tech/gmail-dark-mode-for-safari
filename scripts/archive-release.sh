#!/bin/sh
# Set SDM_DEVELOPMENT_TEAM to the publisher team; keep account identifiers out of source.
set -eu
: "${SDM_DEVELOPMENT_TEAM:?Set SDM_DEVELOPMENT_TEAM to your Apple Developer team ID}"
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_dir"
sh scripts/sync-extension-resources.sh
node --test tests/*.test.cjs
xcodebuild -project 'Safari Dark Mode/Safari Dark Mode.xcodeproj' \
  -scheme 'Safari Dark Mode' -configuration Release \
  -destination 'generic/platform=macOS' -derivedDataPath build/ReleaseDerivedData \
  -archivePath build/GmailDarkMode-1.0.xcarchive \
  DEVELOPMENT_TEAM="$SDM_DEVELOPMENT_TEAM" -allowProvisioningUpdates archive
python3 - <<'PY'
import os, plistlib
from pathlib import Path
Path('build/ExportOptions.plist').write_bytes(plistlib.dumps({
    'method': 'app-store-connect', 'destination': 'export',
    'teamID': os.environ['SDM_DEVELOPMENT_TEAM'], 'signingStyle': 'automatic',
    'manageAppVersionAndBuildNumber': False
}))
PY
xcodebuild -exportArchive -archivePath build/GmailDarkMode-1.0.xcarchive \
  -exportOptionsPlist build/ExportOptions.plist -exportPath build/AppStore \
  -allowProvisioningUpdates
