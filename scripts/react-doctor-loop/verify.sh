#!/usr/bin/env bash
set -euo pipefail

config_path=$1
state_directory=$2

node scripts/react-doctor-loop/run-verification.mjs "$config_path"
scripts/react-doctor-loop/run-react-doctor.sh "$config_path" "$state_directory/after.json"
node scripts/react-doctor-loop/compare-reports.mjs "$state_directory/before.json" "$state_directory/selected.json" "$state_directory/after.json"
