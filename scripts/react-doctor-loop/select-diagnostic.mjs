#!/usr/bin/env node
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig } from "./read-config.mjs";

const compareText = (left, right) => String(left ?? "").localeCompare(String(right ?? ""));

export const selectDiagnostic = (report, config) => {
  if (report.ok === false) {
    throw new Error(`React Doctor scan failed: ${report.error?.message ?? "unknown error"}`);
  }
  if (report.reactDetected === false) {
    throw new Error("React Doctor did not detect a React or Preact runtime in the configured working directory");
  }
  if (!Array.isArray(report.diagnostics)) {
    throw new Error("React Doctor report does not contain a diagnostics array");
  }

  const policy = config.selection;
  const severityRank = new Map(policy.severities.map((severity, index) => [severity, index]));
  // Categories otherwise sort alphabetically, which is arbitrary and puts
  // Security behind Maintainability. Listed categories come first in the order
  // given; anything unlisted keeps its alphabetical position after them, so a
  // category introduced by a later React Doctor release is deprioritized rather
  // than silently skipped.
  const categoryPriority = policy.categoryPriority ?? [];
  const categoryRank = new Map(categoryPriority.map((category, index) => [category, index]));
  const rankOfCategory = (category) => categoryRank.get(category) ?? categoryPriority.length;
  const includeCategories = new Set(policy.includeCategories);
  const excludeCategories = new Set(policy.excludeCategories);
  const includeRules = new Set(policy.includeRules);
  const excludeRules = new Set(policy.excludeRules);

  const eligible = report.diagnostics.filter((diagnostic) => {
    if (!severityRank.has(diagnostic.severity)) return false;
    if (includeCategories.size > 0 && !includeCategories.has(diagnostic.category)) return false;
    if (excludeCategories.has(diagnostic.category)) return false;
    if (includeRules.size > 0 && !includeRules.has(diagnostic.rule)) return false;
    if (excludeRules.has(diagnostic.rule)) return false;
    return true;
  });

  eligible.sort((left, right) =>
    (severityRank.get(left.severity) - severityRank.get(right.severity)) ||
    (rankOfCategory(left.category) - rankOfCategory(right.category)) ||
    compareText(left.category, right.category) ||
    compareText(left.rule, right.rule) ||
    compareText(left.normalizedFilePath ?? left.filePath, right.normalizedFilePath ?? right.filePath) ||
    ((left.line ?? 0) - (right.line ?? 0)) ||
    ((left.column ?? 0) - (right.column ?? 0)) ||
    compareText(left.id, right.id)
  );

  const selected = eligible[0];
  if (!selected) return null;

  // React Doctor reports paths relative to the directory it scanned. The agent
  // and every controller script run from the repository root, so a scoped
  // monorepo scan would otherwise hand the agent a path that does not resolve.
  const scanRoot = config.scanDirectory ?? ".";
  const reportedPath = selected.normalizedFilePath ?? selected.filePath;
  const repositoryPath = scanRoot === "." ? reportedPath : path.posix.join(scanRoot, reportedPath);

  return { ...selected, repositoryPath };
};

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [reportPath, configPath, selectedPath] = process.argv.slice(2);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  const config = readConfig(configPath);
  const selected = selectDiagnostic(report, config);
  mkdirSync(path.dirname(selectedPath), { recursive: true });
  if (selected) {
    writeFileSync(selectedPath, `${JSON.stringify(selected, null, 2)}\n`);
    console.log(`Selected ${selected.severity} ${selected.plugin}/${selected.rule} at ${selected.repositoryPath}:${selected.line}:${selected.column}`);
  }
  process.exitCode = selected ? 0 : 3;
}
