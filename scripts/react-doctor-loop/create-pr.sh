#!/usr/bin/env bash
set -euo pipefail

config_path=$1
state_directory=$2
base_branch=$3
branch_name="react-doctor/remediation-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"

node scripts/react-doctor-loop/create-pr-body.mjs "$state_directory/selected.json" "$state_directory/pr-body.md"
# One conventional-commit subject shared by the commit and the pull request
# title, so a merge configured to take the PR title produces a clean history.
subject=$(node scripts/react-doctor-loop/format-commit-subject.mjs "$state_directory/selected.json" "$config_path")

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git switch -c "$branch_name"
git add -A
git commit -m "$subject"
git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
git push --set-upstream origin "$branch_name"

gh label create react-doctor-remediation --color D93F0B --description "Automated single-issue React Doctor remediation" --force

# The verified branch is already pushed by this point, so a failure here costs
# no agent work. The usual cause is a repository setting rather than anything in
# the diff, and the raw API error does not say so.
if ! gh pr create \
  --base "$base_branch" \
  --head "$branch_name" \
  --title "$subject" \
  --body-file "$state_directory/pr-body.md" \
  --label react-doctor-remediation \
  --draft; then
  cat >&2 <<EOF

Could not create the pull request.

If the error above mentions that GitHub Actions is not permitted to create or
approve pull requests, enable this and re-run the workflow:

  Settings -> Actions -> General -> Workflow permissions
    - Read and write permissions
    - Allow GitHub Actions to create and approve pull requests

No remediation work was lost. The verified branch is already pushed. Open the
pull request yourself with your own credentials, which this setting does not
restrict:

  gh pr create --draft --base ${base_branch} --head ${branch_name} --fill

Or from the browser:

  https://github.com/${GITHUB_REPOSITORY}/pull/new/${branch_name}

EOF
  exit 1
fi
