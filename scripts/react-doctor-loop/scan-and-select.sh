#!/usr/bin/env bash
set -euo pipefail

config_path=$1
state_directory=$2
mkdir -p "$state_directory"
mkdir -p .git/info
if ! grep -qxF '/.react-doctor-loop/' .git/info/exclude 2>/dev/null; then
  echo '/.react-doctor-loop/' >> .git/info/exclude
fi

scripts/react-doctor-loop/run-react-doctor.sh "$config_path" "$state_directory/before.json"

set +e
node scripts/react-doctor-loop/select-diagnostic.mjs "$state_directory/before.json" "$config_path" "$state_directory/selected.json"
selector_status=$?
set -e

if [[ "$selector_status" -eq 3 ]]; then
  echo "found=false" >> "$GITHUB_OUTPUT"
  echo "No eligible React Doctor diagnostics remain."
  exit 0
fi
if [[ "$selector_status" -ne 0 ]]; then
  exit "$selector_status"
fi

echo "found=true" >> "$GITHUB_OUTPUT"
before_sha=$(shasum -a 256 "$state_directory/before.json" | awk '{print $1}')
selected_sha=$(shasum -a 256 "$state_directory/selected.json" | awk '{print $1}')
echo "before_sha=$before_sha" >> "$GITHUB_OUTPUT"
echo "selected_sha=$selected_sha" >> "$GITHUB_OUTPUT"
