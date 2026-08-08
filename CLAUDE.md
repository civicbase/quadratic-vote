# CLAUDE.md

Read [`AGENTS.md`](AGENTS.md) before changing this project. It is the shared,
tool-neutral source of project guidance for both Claude and Codex.

Do not duplicate or reinterpret that guidance here. Keep this file as a routing
layer, and update `AGENTS.md` when the guidance itself changes.

## Automated React Doctor tasks

During the React Doctor GitHub Actions loop, read and follow the repository's `AGENTS.md` remediation section and `.github/react-doctor-loop/remediation-prompt.md`.

The single selected issue is stored at `.react-doctor-loop/selected.json`. Do not expand scope beyond that issue, and do not perform GitHub operations or commits. The workflow controller verifies and publishes the change.

This package is published to npm and released from conventional commit types, so preserving the public API matters more here than in an application.
