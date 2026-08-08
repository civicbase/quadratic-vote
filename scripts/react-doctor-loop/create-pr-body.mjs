#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const [selectedPath, outputPath] = process.argv.slice(2);
const diagnostic = JSON.parse(readFileSync(selectedPath, "utf8"));
const ruleName = `${diagnostic.plugin}/${diagnostic.rule}`;
const body = `## React Doctor remediation\n\nFixes exactly one selected diagnostic.\n\n| Field | Value |\n| --- | --- |\n| Rule | \`${ruleName}\` |\n| Severity | \`${diagnostic.severity}\` |\n| Category | \`${diagnostic.category}\` |\n| Location | \`${diagnostic.filePath}:${diagnostic.line}:${diagnostic.column}\` |\n\n### Diagnostic\n\n${diagnostic.message}\n\n### Controller checks\n\n- [x] Configured project verification passed\n- [x] Selected diagnostic fingerprint decreased\n- [x] No new React Doctor diagnostic fingerprint appeared\n- [x] Protected loop files were not changed\n- [x] Diff stayed within configured size limits\n\nThis PR is intentionally a draft and must be reviewed and merged by a human. Merging it starts the next loop iteration.\n`;
writeFileSync(outputPath, body);
