#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Verification builds the project, so the second scan sees build output that the
// first one never did. Those look like newly introduced diagnostics and fail an
// otherwise valid remediation. Git already knows which paths are generated, so
// drop anything it ignores from both reports and the question disappears.
const [reportPath, scanDirectory = "."] = process.argv.slice(2);
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const diagnostics = report.diagnostics ?? [];

if (diagnostics.length === 0) {
  process.exit(0);
}

const toRepositoryPath = (diagnostic) => {
  const reported = diagnostic.normalizedFilePath ?? diagnostic.filePath ?? "";
  return scanDirectory === "." ? reported : path.posix.join(scanDirectory, reported);
};

const uniquePaths = [...new Set(diagnostics.map(toRepositoryPath).filter(Boolean))];

// check-ignore exits 1 when nothing matches, which is not an error here.
const result = spawnSync("git", ["check-ignore", "--stdin"], { input: `${uniquePaths.join("\n")}\n`, encoding: "utf8" });
if (result.status !== 0 && result.status !== 1) {
  throw new Error(`git check-ignore failed: ${result.stderr?.trim() ?? "unknown error"}`);
}

const ignored = new Set((result.stdout ?? "").split("\n").map((line) => line.trim()).filter(Boolean));
if (ignored.size === 0) {
  process.exit(0);
}

report.diagnostics = diagnostics.filter((diagnostic) => !ignored.has(toRepositoryPath(diagnostic)));
writeFileSync(reportPath, JSON.stringify(report));
console.log(`Dropped ${diagnostics.length - report.diagnostics.length} diagnostics on git-ignored paths.`);
