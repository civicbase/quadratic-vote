#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Dead-code findings are not defect fixes, so they get a truthful type. Every
// other React Doctor plugin reports a real problem in shipped behavior.
const TYPE_BY_PLUGIN = { deslop: "refactor" };

const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatCommitSubject = (diagnostic, config = {}) => {
  // A repository that releases from conventional commits may not want every
  // remediation to cut a version. Forcing a single type lets those projects
  // accumulate fixes and release deliberately.
  const type = config.commitType ?? TYPE_BY_PLUGIN[diagnostic.plugin] ?? "fix";
  // The plugin name is already implied by the loop, so the scope carries the
  // diagnostic category instead of repeating it.
  const scope = slugify(diagnostic.category) || slugify(diagnostic.plugin) || "react-doctor";
  const rule = slugify(diagnostic.rule) || "diagnostic";
  const file = path.posix.basename(String(diagnostic.filePath ?? "").replaceAll("\\", "/"));
  const location = file ? ` in ${file}` : "";
  return `${type}(${scope}): resolve ${rule}${location}`;
};

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const diagnostic = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const config = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : {};
  process.stdout.write(formatCommitSubject(diagnostic, config));
}
