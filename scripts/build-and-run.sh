#!/bin/sh
# Keep the running companion's code and signature aligned with the rebuilt app.
set -eu
repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
app_path="$repo_dir/build/DerivedData/Build/Products/Debug/Safari Dark Mode.app"
processes=$(/bin/ps -axo pid=,command=)
while read -r process_id executable; do
  if [ "$executable" = "$app_path/Contents/MacOS/Safari Dark Mode" ]; then
    kill -TERM "$process_id"
  fi
done <<EOF_PROCESSES
$processes
EOF_PROCESSES

cd "$repo_dir"
sh scripts/sync-extension-resources.sh
xcodebuild -project 'Safari Dark Mode/Safari Dark Mode.xcodeproj' \
  -scheme 'Safari Dark Mode' -configuration Debug \
  -derivedDataPath build/DerivedData build
/usr/bin/open -n "$app_path"
