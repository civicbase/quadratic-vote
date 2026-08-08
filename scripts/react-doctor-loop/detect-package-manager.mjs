#!/usr/bin/env node
import { existsSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const detectPackageManager = (configured, workingDirectory) => {
  if (configured !== "auto") return configured;
  const packageJsonPath = path.join(workingDirectory, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const declared = packageJson.packageManager?.split("@")[0];
  if (["npm", "pnpm", "yarn"].includes(declared)) return declared;
  if (existsSync(path.join(workingDirectory, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(workingDirectory, "yarn.lock"))) return "yarn";
  return "npm";
};

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  console.log(detectPackageManager(process.argv[2], process.argv[3]));
}
