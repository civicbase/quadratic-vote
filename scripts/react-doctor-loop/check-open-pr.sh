#!/usr/bin/env bash
set -euo pipefail

open_count=$(gh api --paginate "repos/${GITHUB_REPOSITORY}/pulls?state=open&per_page=100" --jq '[.[] | select((.head.ref | startswith("react-doctor/remediation-")) or any(.labels[]?; .name == "react-doctor-remediation"))] | length' | awk '{total += $1} END {print total + 0}')

if [[ "$open_count" -gt 0 ]]; then
  echo "found=true" >> "$GITHUB_OUTPUT"
  echo "A React Doctor remediation pull request is already open; stopping this iteration."
else
  echo "found=false" >> "$GITHUB_OUTPUT"
fi
