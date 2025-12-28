# Release Guide

This guide explains how the automated release process works for quadratic-vote.

## 📦 Overview

We use **semantic-release** to automate:

- Version bumping (based on commit messages)
- Changelog generation
- GitHub release creation
- npm package publishing
- Git tagging

## 🎯 Commit Message Convention

Semantic-release analyzes your commit messages to determine the version bump:

### Version Bumps

| Commit Type        | Version Bump              | Example                                                         |
| ------------------ | ------------------------- | --------------------------------------------------------------- |
| `feat:`            | **Minor** (1.3.3 → 1.4.0) | `feat: add keyboard navigation`                                 |
| `fix:`             | **Patch** (1.3.3 → 1.3.4) | `fix: correct animation timing`                                 |
| `BREAKING CHANGE:` | **Major** (1.3.3 → 2.0.0) | `feat!: redesign API` or commit with `BREAKING CHANGE:` in body |
| `docs:`            | No release                | `docs: update README`                                           |
| `chore:`           | No release                | `chore: update dependencies`                                    |
| `style:`           | No release                | `style: format code`                                            |
| `refactor:`        | No release                | `refactor: simplify logic`                                      |
| `test:`            | No release                | `test: add unit tests`                                          |

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**

```bash
# Patch release (1.3.3 → 1.3.4)
git commit -m "fix: prevent animation glitch during scroll"

# Minor release (1.3.3 → 1.4.0)
git commit -m "feat: add dark mode support for Diamond component"

# Major release (1.3.3 → 2.0.0)
git commit -m "feat!: redesign voting API

BREAKING CHANGE: The vote function now requires an object instead of individual parameters"

# No release
git commit -m "docs: improve API documentation"
git commit -m "chore: update eslint config"
```

## 🚀 Release Process

### Automatic Release (Recommended)

1. **Make your changes** and commit following convention:

   ```bash
   git add .
   git commit -m "feat: add new pool layout option"
   ```

2. **Push to main branch**:

   ```bash
   git push origin main
   ```

3. **GitHub Actions automatically**:

   - ✅ Runs tests
   - ✅ Runs linter
   - ✅ Builds package
   - ✅ Analyzes commits
   - ✅ Determines version bump
   - ✅ Updates CHANGELOG.md
   - ✅ Updates package.json version
   - ✅ Creates Git tag
   - ✅ Publishes to npm
   - ✅ Creates GitHub release
   - ✅ Commits changes back to repo

4. **Check results**:
   - GitHub Actions: `https://github.com/civicbase/quadratic-vote/actions`
   - npm: `https://www.npmjs.com/package/quadratic-vote`
   - GitHub Releases: `https://github.com/civicbase/quadratic-vote/releases`

### Manual Release (If needed)

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Run quality checks locally
npm run lint
npm run type-check
npm test -- --run
npm run build

# 3. Trigger release workflow manually
# Go to: https://github.com/civicbase/quadratic-vote/actions
# Select "Release" workflow
# Click "Run workflow"
```

## 🔧 Setup (First Time Only)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure npm Trusted Publishing (Recommended)

This repository is set up to publish to npm using **Trusted Publishing (OIDC)** from GitHub Actions.

**A. Configure npm:**

1. Go to the npm package settings for `quadratic-vote`
2. Find **Trusted publishing**
3. Add a **GitHub Actions** trusted publisher with:
   - Organization/user: `civicbase`
   - Repository: `quadratic-vote`
   - Workflow filename: `release.yml`
   - Environment name: *(leave blank unless you use GitHub Environments)*

**B. GitHub Actions permissions:**

The workflow must have `permissions: id-token: write` (already present in `.github/workflows/release.yml`).

### 3. Verify Configuration

Check these files exist:

- ✅ `.releaserc` - Semantic release config
- ✅ `.github/workflows/release.yml` - Release workflow
- ✅ `CHANGELOG.md` - Will be auto-updated

### 4. Test the Workflow

```bash
# Make a test commit
git commit --allow-empty -m "chore: test release workflow [skip ci]"
git push origin main
```

Note: `[skip ci]` prevents actual release, just tests the workflow setup.

## 📋 What Gets Released

The npm package includes only:

- `dist/` - Built package files
- `README.md` - Documentation
- `LICENSE` - MIT license
- `CHANGELOG.md` - Version history
- `package.json` - Package metadata

Excluded (via `.npmignore`):

- Source code (`src/`)
- Tests
- Demo app
- Configuration files
- Development dependencies

## 🔍 Monitoring Releases

### GitHub Actions Dashboard

```
https://github.com/civicbase/quadratic-vote/actions/workflows/release.yml
```

Check:

- ✅ Workflow status (success/failure)
- 📝 Logs for each step
- ⏱️ Execution time

### npm Package Page

```
https://www.npmjs.com/package/quadratic-vote
```

Check:

- 📦 Latest version published
- 📊 Download statistics
- 📄 Package contents

### GitHub Releases

```
https://github.com/civicbase/quadratic-vote/releases
```

Check:

- 🏷️ Release tags
- 📝 Auto-generated release notes
- 📎 Release assets

## 🐛 Troubleshooting

### Release Failed: "npm publish failed"

**Cause**: Invalid npm token or insufficient permissions

**Solution**:

1. Regenerate npm token: `npm token create --type=automation`
2. Update GitHub secret with new token
3. Ensure token has publish permissions

### Release Failed: "Tests failed"

**Cause**: Tests are failing

**Solution**:

1. Run tests locally: `npm test`
2. Fix failing tests
3. Commit and push fixes

### No Release Created

**Cause**: Commit messages don't trigger release

**Solution**:

- Use `feat:` or `fix:` prefix
- Check commit follows conventional format
- Remove `[skip ci]` from commit message

### Version Already Exists

**Cause**: Version already published to npm

**Solution**:

- Delete local tag: `git tag -d v1.3.4`
- Delete remote tag: `git push origin :refs/tags/v1.3.4`
- Delete from npm: `npm unpublish quadratic-vote@1.3.4`

### Multiple Releases in Same Push

**Cause**: Multiple commits with release types

**Solution**: This is normal! Semantic-release will:

1. Analyze all commits since last release
2. Determine highest version bump needed
3. Generate single release with all changes

## 📊 Release Checklist

Before pushing to main:

- [ ] Code follows style guide
- [ ] Tests pass locally (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Commit message follows convention
- [ ] Changes documented in code comments
- [ ] Breaking changes noted in commit body (if any)

After release:

- [ ] Verify new version on npm
- [ ] Check GitHub release notes
- [ ] Test package installation: `npm install quadratic-vote@latest`
- [ ] Update documentation if needed
- [ ] Announce release (Twitter, Discord, etc.)

## 🎯 Best Practices

### 1. Small, Focused Commits

```bash
# Good
git commit -m "feat: add dark mode to Pool component"
git commit -m "fix: correct animation timing on slow devices"

# Avoid
git commit -m "feat: add dark mode, fix bugs, update docs"
```

### 2. Descriptive Commit Messages

```bash
# Good
git commit -m "fix: prevent memory leak in VoteAnimation cleanup"

# Avoid
git commit -m "fix: bug"
```

### 3. Use Scopes for Clarity

```bash
git commit -m "feat(Diamond): add tooltip support"
git commit -m "fix(Pool): correct circle positioning"
git commit -m "docs(README): add TypeScript examples"
```

### 4. Document Breaking Changes

```bash
git commit -m "feat!: redesign vote API

BREAKING CHANGE: vote() now requires an object parameter instead of positional arguments.

Migration:
- Before: vote(questionId, 1)
- After: vote({ id: questionId, amount: 1 })"
```

## 🔐 Security

- ✅ Uses npm Trusted Publishing (OIDC) instead of long-lived npm tokens
- ✅ No npm token stored in GitHub Secrets
- ✅ Workflow runs in isolated environment
- ✅ Only main branch can trigger releases
- ✅ Two-factor authentication recommended for npm

## 📚 Resources

- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [npm Trusted Publishing Docs](https://docs.npmjs.com/trusted-publishing)

## 🆘 Support

Issues with releases?

1. Check [GitHub Actions logs](https://github.com/civicbase/quadratic-vote/actions)
2. Review [semantic-release troubleshooting](https://semantic-release.gitbook.io/semantic-release/support/troubleshooting)
3. Open an issue: [Create Issue](https://github.com/civicbase/quadratic-vote/issues/new/choose)
