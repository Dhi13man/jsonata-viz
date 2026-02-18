# Contributing to JSONata Viz

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/graphs/contributors)
[![Forks](https://img.shields.io/github/forks/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/network/members)
[![Stars](https://img.shields.io/github/stars/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/commits/main)

Thank you for your interest in contributing to JSONata Viz! Whether it's a bug fix, new feature, or documentation improvement, contributions are welcome.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- Familiarity with [JSONata](https://jsonata.org/) is helpful but not required

### Setup

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:

   ```bash
   git clone https://github.com/<your-username>/jsonata-viz.git
   cd jsonata-viz
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

## Project Structure

```
jsonata-viz/
├── src/
│   ├── core/            # JSONata parsing, AST manipulation, evaluation engine
│   ├── components/      # UI components (graph, editor panels, test runner)
│   ├── dnd/             # Drag-and-drop system for no-code expression building
│   ├── testing/         # Test case management, regression runner, assertions
│   └── utils/           # Shared utilities, type definitions
├── public/              # Static assets
└── tests/               # Unit and integration tests
```

> Structure is preliminary and may evolve as the project develops.

## How to Contribute

### Bug Fixes

1. Create a branch from `main` with the naming convention `fix/<description>`.
2. Write or update tests to cover the fix.
3. Ensure all existing tests pass: `npm test`.
4. Ensure code passes linting: `npm run lint`.
5. Commit your changes and open a pull request.

### New Features

1. Create a branch from `main` with the naming convention `feature/<description>`.
2. If the feature is non-trivial, consider opening an issue first to discuss the approach.
3. Write tests for the new functionality.
4. Update documentation if the feature affects user-facing behavior.
5. Commit your changes and open a pull request.

Areas where contributions are especially welcome:

- **Visualization** - Graph rendering, layout algorithms, zoom/pan interactions
- **Drag-and-Drop** - Node palette, wiring system, expression composition
- **JSONata Engine** - Parser integration, AST manipulation, evaluation
- **Testing Framework** - Test runner UI, assertion engine, regression detection
- **Accessibility** - Keyboard navigation, screen reader support, ARIA labels
- **Documentation** - Tutorials, examples, API reference

### Documentation

1. Create a branch with the naming convention `docs/<description>`.
2. Ensure any code examples are accurate and runnable.
3. Commit your changes and open a pull request.

## Code Style

- Run the formatter before committing: `npm run format`.
- Run the linter before committing: `npm run lint`.
- Write meaningful commit messages that describe the "why", not just the "what".
- Keep PRs focused - one feature or fix per PR.

## Reporting Issues

Please [open an issue](https://github.com/Dhi13man/jsonata-viz/issues) with:

- A clear description of the problem or feature request
- Steps to reproduce (for bugs)
- Expected vs actual behavior (for bugs)
- Browser and OS information (for bugs)
- Screenshots or screen recordings if applicable
