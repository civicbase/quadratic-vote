#!/usr/bin/env bash
set -euo pipefail

config_path=$1
prompt_path=$2

if [[ -z "${CURSOR_API_KEY:-}" ]]; then
  echo "CURSOR_API_KEY is not set. Add it as a repository or environment Actions secret." >&2
  exit 1
fi

if [[ ! -f "$prompt_path" ]]; then
  echo "Prompt file not found: $prompt_path" >&2
  exit 1
fi

model=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.cursorModel ?? "")' "$config_path")

# --print runs headlessly. --force allows the edits the remediation needs, and
# --trust skips the workspace approval prompt that has no operator in CI.
# The loop's real guardrails are downstream: a read-only GITHUB_TOKEN in this
# job, the diff scope check, re-verification, and a separate publishing job.
arguments=(--print --force --trust --output-format text)
if [[ -n "$model" ]]; then
  arguments+=(--model "$model")
fi

# The prompt is passed as a positional argument, never on stdin, so that the
# agent cannot consume unrelated piped input.
cursor-agent "${arguments[@]}" "$(cat "$prompt_path")"
