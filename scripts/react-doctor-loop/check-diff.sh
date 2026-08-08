#!/usr/bin/env bash
set -euo pipefail

config_path=$1
max_files=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(c.maxChangedFiles))' "$config_path")
max_lines=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(String(c.maxChangedLines))' "$config_path")

actual_before_sha=$(shasum -a 256 .react-doctor-loop/before.json | awk '{print $1}')
actual_selected_sha=$(shasum -a 256 .react-doctor-loop/selected.json | awk '{print $1}')
if [[ "$actual_before_sha" != "$EXPECTED_BEFORE_SHA" || "$actual_selected_sha" != "$EXPECTED_SELECTED_SHA" ]]; then
  echo "Agent changed protected React Doctor controller state." >&2
  exit 1
fi

if git diff --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "The agent made no changes." >&2
  exit 1
fi

changed_paths=$(git status --short | sed 's/^...//')
while IFS= read -r changed_path; do
  [[ -z "$changed_path" ]] && continue
  case "$changed_path" in
    .github/workflows/*|.github/react-doctor-loop/*|scripts/react-doctor-loop/*|AGENTS.md|CLAUDE.md)
      echo "Agent changed protected control file: $changed_path" >&2
      exit 1
      ;;
  esac
done <<< "$changed_paths"

changed_file_count=$(git status --short | wc -l | tr -d ' ')
if [[ "$changed_file_count" -gt "$max_files" ]]; then
  echo "Diff changes $changed_file_count files; limit is $max_files." >&2
  exit 1
fi

changed_line_count=$({ git diff --numstat; git ls-files --others --exclude-standard -z | xargs -0 -r wc -l | awk 'END {print $1 + 0}'; } | awk '{added += $1; removed += $2} END {print added + removed + 0}')
if [[ "$changed_line_count" -gt "$max_lines" ]]; then
  echo "Diff changes $changed_line_count lines; limit is $max_lines." >&2
  exit 1
fi

echo "Diff is within scope: $changed_file_count files and $changed_line_count changed lines."
