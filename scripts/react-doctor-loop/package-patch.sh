#!/usr/bin/env bash
set -euo pipefail

state_directory=$1
package_directory=$2
mkdir -p "$package_directory"

git add -A
git diff --cached --binary --full-index > "$package_directory/remediation.patch"
cp "$state_directory/selected.json" "$package_directory/selected.json"

if [[ ! -s "$package_directory/remediation.patch" ]]; then
  echo "Verified remediation patch is empty." >&2
  exit 1
fi
