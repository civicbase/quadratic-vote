# Contributing to Quadratic-Vote

Thank you for your interest in contributing to Quadratic-Vote! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/quadratic-vote.git
   cd quadratic-vote
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development

### Running the Demo

```bash
npm run dev
```

This starts a development server with the demo app at `http://localhost:5173`

### Running Tests

```bash
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run coverage      # Generate coverage report
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## 📝 Code Standards

### TypeScript

- All code must be written in TypeScript
- Export all public types and interfaces
- Use proper type annotations (avoid `any` unless absolutely necessary)

### Component Guidelines

- Use functional components with hooks
- Memoize expensive computations with `useMemo`
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components focused and single-purpose

### Testing

- Write tests for new features
- Maintain minimum 80% code coverage
- Use React Testing Library best practices
- Test user interactions, not implementation details

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:

```
feat: add keyboard navigation support
fix: correct animation timing on scroll
docs: update API reference for Pool component
test: add tests for VoteAnimation component
```

## 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/civicbase/quadratic-vote/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/recordings if applicable
   - Your environment (OS, browser, React version)

## 💡 Suggesting Features

1. Check [Issues](https://github.com/civicbase/quadratic-vote/issues) for existing feature requests
2. Create a new issue with:
   - Clear use case and motivation
   - Proposed API (if applicable)
   - Alternative solutions considered
   - Examples of how it would be used

## 🔄 Pull Request Process

1. Update the README.md with details of changes (if applicable)
2. Update the CHANGELOG.md under `[Unreleased]`
3. Add/update tests for your changes
4. Ensure all tests pass and linting is clean
5. Update TypeScript types as needed
6. Make sure your code follows the existing style

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code coverage maintained (80%+)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Types exported (if adding new public APIs)
- [ ] Demo app works (`npm run dev`)

### Review Process

- PRs require at least one approval from a maintainer
- Address all review comments
- Keep PRs focused on a single feature/fix
- Squash commits before merging (if requested)

## 📦 Release Process

(For maintainers)

1. Update version in `package.json`
2. Update CHANGELOG.md (move Unreleased to version number)
3. Create a git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. Semantic Release will handle npm publishing

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Collaborate openly

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to open an issue or reach out to the maintainers!

Thank you for contributing! 🎉
