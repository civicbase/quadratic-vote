# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Smooth credit circle animations using React Portal
- Credits now fly from pool to diamond when voting up
- Credits fly from diamond back to pool when voting down
- Animation system tracks scroll position in real-time
- Synchronized color transitions with flight animations
- New `VoteAnimation` component (internal, auto-managed by Provider)
- Export all TypeScript interfaces for better DX
- Comprehensive TypeScript type definitions

### Changed

- Updated all dependencies to latest versions
- Improved animation timing for smoother UX (150ms source clear, 650ms destination arrival)
- Enhanced README with complete API documentation
- Better color customization examples in documentation

### Fixed

- Animation circles now follow correct target positions during scroll
- Pool and Diamond circles update colors only after animation completes
- Removed conflicting max-vote animation that caused visual glitches

## [1.3.3] - Previous Release

### Features

- Basic quadratic voting implementation
- Pool and Diamond components
- Credit management
- Vote validation
- Reset functionality

[Unreleased]: https://github.com/civicbase/quadratic-vote/compare/v1.3.3...HEAD
[1.3.3]: https://github.com/civicbase/quadratic-vote/releases/tag/v1.3.3
