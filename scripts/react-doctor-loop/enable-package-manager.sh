#!/usr/bin/env bash
set -euo pipefail

config_path=$1
working_directory=$(node scripts/react-doctor-loop/read-config.mjs "$config_path" | sed -n 's/^working_directory=//p')
configured_manager=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.packageManager)' "$config_path")
package_manager=$(node scripts/react-doctor-loop/detect-package-manager.mjs "$configured_manager" "$working_directory")
pinned_version=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.packageManagerVersion ?? "")' "$config_path")
working_directory=${working_directory:-.}
declared_in_package_json=$(node -e 'const c=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")); process.stdout.write(c.packageManager ?? "")' "$working_directory/package.json")

node_version=$(node scripts/react-doctor-loop/read-config.mjs "$config_path" | sed -n 's/^node_version=//p')

corepack enable

if [[ -n "$pinned_version" ]]; then
  echo "Activating ${package_manager}@${pinned_version} from config.packageManagerVersion."
  corepack prepare "${package_manager}@${pinned_version}" --activate
elif [[ -n "$declared_in_package_json" ]]; then
  echo "Using ${declared_in_package_json} declared by package.json."
else
  # Corepack resolves the latest release when nothing pins a version, and the
  # latest release of a package manager routinely requires a newer Node than
  # config.nodeVersion. That surfaces as an unrelated-looking crash inside the
  # package manager, so say plainly what to set before it happens.
  echo "::warning::No package manager version is pinned. Corepack will install the latest ${package_manager}, which may require a newer Node than the configured Node ${node_version}. Set \"packageManagerVersion\" in the loop configuration, or add a \"packageManager\" field to package.json."
fi

"$package_manager" --version
