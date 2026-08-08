#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { readConfig } from "./read-config.mjs";
import { detectPackageManager } from "./detect-package-manager.mjs";

const config = readConfig(process.argv[2]);
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
    throw new Error(`Verification script failed: ${scriptName}`);
  }
}
