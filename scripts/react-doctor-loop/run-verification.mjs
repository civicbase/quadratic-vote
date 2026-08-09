#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { readConfig } from "./read-config.mjs";
import { detectPackageManager } from "./detect-package-manager.mjs";

const config = readConfig(process.argv[2]);
const selectedPath = process.argv[3];

// A verification failure is reported by the underlying tool, which knows
// nothing about the loop. Without this, the log ends on a raw lint or test
// error with no indication of which diagnostic was being fixed, or that the
// same target will be chosen again on the next run.
const explainFailure = (scriptName) => {
  if (!selectedPath) return;
  let selected;
  try {
    selected = JSON.parse(readFileSync(selectedPath, "utf8"));
  } catch {
    return;
  }
  console.error(
    [
      "",
      `The "${scriptName}" script failed after the agent edited the repository.`,
      `The target was ${selected.plugin}/${selected.rule} at ${selected.repositoryPath ?? selected.filePath}.`,
      "",
      "Nothing is published and the repository is unchanged. Selection is",
      "deterministic, so the next run picks this same target: if it fails the",
      "same way again, fix it by hand or skip it with",
      "",
      `  "selection": { "excludeRules": ["${selected.rule}"] }`,
      "",
    ].join("\n"),
  );
};
const packageJsonPath = path.join(config.workingDirectory, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const packageManager = detectPackageManager(config.packageManager, config.workingDirectory);

const runScript = (scriptName) => {
  const command = packageManager === "npm" ? ["npm", ["run", scriptName]] : [packageManager, ["run", scriptName]];
  const result = spawnSync(command[0], command[1], { cwd: config.workingDirectory, stdio: "inherit" });
  return result.status === 0;
};

// Coding agents reliably produce correct code that does not match a project's
// formatter, which would fail a formatting check and discard an otherwise valid
// remediation. Normalizing first makes the check meaningful: it now only fails
// on something the formatter itself cannot fix.
if (config.formatScript) {
  if (!packageJson.scripts?.[config.formatScript]) {
    throw new Error(`Missing package.json script named in config.formatScript: ${config.formatScript}`);
  }
  console.log(`Normalizing formatting with: ${config.formatScript}`);
  if (!runScript(config.formatScript)) {
    throw new Error(`Formatting script failed: ${config.formatScript}`);
  }
}

for (const scriptName of config.verificationScripts) {
  if (!packageJson.scripts?.[scriptName]) {
    if (config.skipMissingVerificationScripts) {
      console.log(`Skipping missing package.json script: ${scriptName}`);
      continue;
    }
    throw new Error(`Missing required package.json script: ${scriptName}`);
  }
  console.log(`Running ${packageManager} script: ${scriptName}`);
  if (!runScript(scriptName)) {
    explainFailure(scriptName);
    throw new Error(`Verification script failed: ${scriptName}`);
  }
}
