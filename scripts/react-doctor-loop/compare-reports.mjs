#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const diagnosticFingerprint = (diagnostic) => JSON.stringify([
  diagnostic.normalizedFilePath ?? diagnostic.filePath,
  diagnostic.plugin,
  diagnostic.rule,
  diagnostic.severity,
  diagnostic.message,
]);

const countFingerprints = (diagnostics) => {
  const counts = new Map();
  for (const diagnostic of diagnostics) {
    const fingerprint = diagnosticFingerprint(diagnostic);
    counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1);
  }
  return counts;
};

export const compareReports = (beforeReport, selected, afterReport) => {
  if (afterReport.ok === false) {
    throw new Error(`React Doctor verification scan failed: ${afterReport.error?.message ?? "unknown error"}`);
  }
  if (afterReport.reactDetected === false) {
    throw new Error("React Doctor no longer detects a React or Preact runtime");
  }
  const beforeDiagnostics = beforeReport.diagnostics ?? [];
  const afterDiagnostics = afterReport.diagnostics ?? [];
  const beforeCounts = countFingerprints(beforeDiagnostics);
  const afterCounts = countFingerprints(afterDiagnostics);
  const selectedFingerprint = diagnosticFingerprint(selected);
  const selectedBeforeCount = beforeCounts.get(selectedFingerprint) ?? 0;
  const selectedAfterCount = afterCounts.get(selectedFingerprint) ?? 0;

  if (selectedBeforeCount < 1) {
    throw new Error("Selected diagnostic was not present in the original report");
  }
  if (selectedAfterCount >= selectedBeforeCount) {
    throw new Error("Selected diagnostic fingerprint was not removed");
  }

  const newFingerprints = [];
  for (const [fingerprint, count] of afterCounts) {
    if (count > (beforeCounts.get(fingerprint) ?? 0)) {
      newFingerprints.push(fingerprint);
    }
  }
  if (newFingerprints.length > 0) {
    // Selection is deterministic, so the same target is chosen on every run.
    // A diagnostic whose only reasonable fix introduces another diagnostic will
    // therefore fail identically forever, spending a provider call each time.
    // Naming the escape hatch here turns a wedged loop into a one-line decision.
    throw new Error(
      [
        "Remediation introduced new React Doctor diagnostic fingerprints:",
        ...newFingerprints,
        "",
        `The target was ${selected.plugin}/${selected.rule} at ${selected.filePath}.`,
        "",
        "If this run failed the same way as the previous one, the loop cannot make",
        "progress on that target unaided. Either fix it by hand, or skip it so the",
        "loop moves to the next diagnostic, by adding the rule to the configuration:",
        "",
        `  "selection": { "excludeRules": ["${selected.rule}"] }`,
      ].join("\n"),
    );
  }
};

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [beforePath, selectedPath, afterPath] = process.argv.slice(2);
  compareReports(
    JSON.parse(readFileSync(beforePath, "utf8")),
    JSON.parse(readFileSync(selectedPath, "utf8")),
    JSON.parse(readFileSync(afterPath, "utf8")),
  );
  console.log("Selected diagnostic removed and no new diagnostic fingerprints introduced.");
}
