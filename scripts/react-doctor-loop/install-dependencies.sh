#!/usr/bin/env bash
set -euo pipefail

config_path=$1
working_directory=$(node scripts/react-doctor-loop/read-config.mjs "$config_path" | sed -n 's/^working_directory=//p')
configured_manager=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.packageManager)' "$config_path")
package_manager=$(node scripts/react-doctor-loop/detect-package-manager.mjs "$configured_manager" "$working_directory")

case "$package_manager" in
  npm)
    (cd "$working_directory" && npm ci)
    ;;
  pnpm)
    (cd "$working_directory" && pnpm install --frozen-lockfile)
    ;;
  yarn)
    yarn_major=$(yarn --version | cut -d. -f1)
    if [[ "$yarn_major" -ge 2 ]]; then
      (cd "$working_directory" && yarn install --immutable)
    else
      (cd "$working_directory" && yarn install --frozen-lockfile)
    fi
    ;;
  *)
    echo "Unsupported package manager: $package_manager" >&2
    exit 1
    ;;
esac
