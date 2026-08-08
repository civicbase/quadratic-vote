#!/usr/bin/env bash
set -euo pipefail

config_path=$1
working_directory=$(node scripts/react-doctor-loop/read-config.mjs "$config_path" | sed -n 's/^working_directory=//p')
working_directory=${working_directory:-.}
configured_manager=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.packageManager)' "$config_path")
package_manager=$(node scripts/react-doctor-loop/detect-package-manager.mjs "$configured_manager" "$working_directory")
install_strategy=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.installStrategy ?? "frozen")' "$config_path")

# A frozen install is the default because it is reproducible and refuses to
# quietly change dependencies. Some repositories carry a lockfile that a frozen
# install rejects on a different platform from the one that wrote it, and
# blocking every remediation on that is worse than tolerating it here.
if [[ "$install_strategy" == "resolve" ]]; then
  echo "Installing with a resolving strategy; the lockfile is restored afterwards so no dependency change can enter a remediation diff."
  lockfiles=(package-lock.json npm-shrinkwrap.json pnpm-lock.yaml yarn.lock)
  case "$package_manager" in
    npm) (cd "$working_directory" && npm install --no-audit --no-fund) ;;
    pnpm) (cd "$working_directory" && pnpm install --no-frozen-lockfile) ;;
    yarn) (cd "$working_directory" && yarn install) ;;
    *) echo "Unsupported package manager: $package_manager" >&2; exit 1 ;;
  esac
  for lockfile in "${lockfiles[@]}"; do
    path="$working_directory/$lockfile"
    if [[ -f "$path" ]] && ! git diff --quiet -- "$path"; then
      echo "Restoring $lockfile, which the install rewrote."
      git checkout -- "$path"
    fi
  done
  exit 0
fi

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
