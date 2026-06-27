#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/extension"
TARGET_DIR="$ROOT_DIR/Safari Dark Mode/Safari Dark Mode Extension/Resources"
PROJECT_FILE="$ROOT_DIR/Safari Dark Mode/Safari Dark Mode.xcodeproj/project.pbxproj"

check_project_resources() {
  missing=0

  for path in "$SOURCE_DIR"/*; do
    name="$(basename "$path")"

    if ! grep -F "/* $name */" "$PROJECT_FILE" >/dev/null; then
      echo "Missing Xcode project resource reference for extension/$name" >&2
      missing=1
    fi
  done

  return "$missing"
}

if [ "${1:-}" = "--check" ]; then
  diff -qr "$SOURCE_DIR" "$TARGET_DIR"
  check_project_resources
  exit
fi

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$SOURCE_DIR/." "$TARGET_DIR/"
