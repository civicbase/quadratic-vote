#!/usr/bin/env node
import { appendFileSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const readConfig = (configPath) => {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const allowedAgents = new Set(["codex", "claude", "cursor"]);
  const allowedPackageManagers = new Set(["auto", "npm", "pnpm", "yarn"]);

  if (!allowedAgents.has(config.agent)) {
    throw new Error('config.agent must be "codex", "claude", or "cursor"');
  }
  // Optional. Left unset, each provider picks its own default model, which keeps
  // stale model IDs out of a long-lived template. Only the Cursor step reads it.
  if (config.cursorModel !== undefined && (typeof config.cursorModel !== "string" || config.cursorModel.length === 0)) {
    throw new Error("config.cursorModel must be a non-empty string when present");
  }
  if (!allowedPackageManagers.has(config.packageManager)) {
    throw new Error('config.packageManager must be "auto", "npm", "pnpm", or "yarn"');
  }
  if (typeof config.nodeVersion !== "string" || config.nodeVersion.length === 0) {
    throw new Error("config.nodeVersion must be a non-empty string");
  }
  // Optional. Without it, and without a packageManager field in package.json,
  // Corepack installs the latest release, which may require a newer Node than
  // config.nodeVersion and fail inside the package manager itself.
  if (config.packageManagerVersion !== undefined && (typeof config.packageManagerVersion !== "string" || config.packageManagerVersion.length === 0)) {
    throw new Error("config.packageManagerVersion must be a non-empty string when present");
  }
  // Optional. Overrides the conventional-commit type on every remediation,
  // for repositories where a release is cut from commit types.
  if (config.commitType !== undefined && (typeof config.commitType !== "string" || !/^[a-z]+$/.test(config.commitType))) {
    throw new Error("config.commitType must be a lowercase word when present");
  }
  if (typeof config.reactDoctorVersion !== "string" || config.reactDoctorVersion.length === 0) {
    throw new Error("config.reactDoctorVersion must be a non-empty string");
  }
  if (typeof config.workingDirectory !== "string" || path.isAbsolute(config.workingDirectory)) {
    throw new Error("config.workingDirectory must be a repository-relative path");
  }
  const normalizedWorkingDirectory = path.posix.normalize(config.workingDirectory.replaceAll("\\", "/"));
  if (normalizedWorkingDirectory === ".." || normalizedWorkingDirectory.startsWith("../")) {
    throw new Error("config.workingDirectory must stay inside the repository");
  }
  // Optional, relative to workingDirectory. Lets a monorepo install and verify
  // from the workspace root while scanning only the React package, which
  // workingDirectory alone cannot express because it controls both.
  const rawScanDirectory = config.scanDirectory ?? ".";
  if (typeof rawScanDirectory !== "string" || path.isAbsolute(rawScanDirectory)) {
    throw new Error("config.scanDirectory must be a path relative to the working directory");
  }
  const normalizedScanDirectory = path.posix.normalize(rawScanDirectory.replaceAll("\\", "/"));
  if (normalizedScanDirectory === ".." || normalizedScanDirectory.startsWith("../")) {
    throw new Error("config.scanDirectory must stay inside the working directory");
  }
  if (!Array.isArray(config.verificationScripts) || config.verificationScripts.some((value) => typeof value !== "string" || value.length === 0)) {
    throw new Error("config.verificationScripts must be an array of package.json script names");
  }
  // Optional. Runs once after the agent edit and before verification, so a
  // formatter-only mismatch cannot discard an otherwise correct remediation.
  if (config.formatScript !== undefined && (typeof config.formatScript !== "string" || config.formatScript.length === 0)) {
    throw new Error("config.formatScript must be a non-empty string when present");
  }
  for (const key of ["maxChangedFiles", "maxChangedLines"]) {
    if (!Number.isInteger(config[key]) || config[key] < 1) {
      throw new Error(`config.${key} must be a positive integer`);
    }
  }
  if (!config.selection || !Array.isArray(config.selection.severities) || config.selection.severities.length === 0) {
    throw new Error("config.selection.severities must be a non-empty array");
  }
  if (config.selection.severities.some((severity) => !["error", "warning"].includes(severity))) {
    throw new Error('selection severities must be "error" or "warning"');
  }
  // Optional. Absent means the previous alphabetical category ordering.
  if (config.selection.categoryPriority !== undefined) {
    if (!Array.isArray(config.selection.categoryPriority) || config.selection.categoryPriority.some((value) => typeof value !== "string" || value.length === 0)) {
      throw new Error("config.selection.categoryPriority must be an array of non-empty category names");
    }
  }
  for (const key of ["includeCategories", "excludeCategories", "includeRules", "excludeRules"]) {
    if (!Array.isArray(config.selection[key]) || config.selection[key].some((value) => typeof value !== "string")) {
      throw new Error(`config.selection.${key} must be an array of strings`);
    }
  }

  return { ...config, workingDirectory: normalizedWorkingDirectory, scanDirectory: normalizedScanDirectory };
};

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const config = readConfig(process.argv[2]);
  const outputs = [
    `agent=${config.agent}`,
    `node_version=${config.nodeVersion}`,
    `working_directory=${config.workingDirectory}`,
    `scan_directory=${config.scanDirectory}`,
  ];
  // Always write to stdout, including under Actions. The shell scripts read
  // these values by piping this command, and a GITHUB_OUTPUT-only branch makes
  // them silently receive an empty string in CI while still passing locally.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${outputs.join("\n")}\n`);
  }
  console.log(outputs.join("\n"));
}
