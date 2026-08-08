#!/usr/bin/env bash
set -euo pipefail

config_path=$1
output_path=$2
working_directory=$(node scripts/react-doctor-loop/read-config.mjs "$config_path" | sed -n 's/^working_directory=//p')
scan_directory=$(node scripts/react-doctor-loop/read-config.mjs "$config_path" | sed -n 's/^scan_directory=//p')
react_doctor_version=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.reactDoctorVersion)' "$config_path")

mkdir -p "$(dirname "$output_path")"
(cd "$working_directory" && npx --yes "react-doctor@${react_doctor_version}" "$scan_directory" --json --json-compact --blocking none --no-telemetry) > "$output_path"
node scripts/react-doctor-loop/filter-ignored-diagnostics.mjs "$output_path" "$scan_directory"
