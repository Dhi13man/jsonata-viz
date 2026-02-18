# JSONata Viz

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Contributors](https://img.shields.io/github/contributors/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/graphs/contributors)
[![Forks](https://img.shields.io/github/forks/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/network/members)
[![Stars](https://img.shields.io/github/stars/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/Dhi13man/jsonata-viz)](https://github.com/Dhi13man/jsonata-viz/commits/main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

An end-to-end **JSONata visualizer** and **no-code editor** that lets you interactively build, modify, test, and validate JSONata expressions entirely in the browser. No server required.

## The Problem

[JSONata](https://jsonata.org/) is a powerful query and transformation language for JSON data, but as expressions grow in complexity, they become difficult to reason about, debug, and maintain. Teams working with large JSONata pipelines face:

- **Opaque expressions** - Nested JSONata is hard to read and understand at a glance.
- **No component isolation** - You can't test individual parts of a complex expression independently.
- **Regression risk** - Changes to one part of an expression can silently break others, with no way to validate correctness before deployment.
- **High barrier to entry** - Non-developers can't easily create or modify JSONata expressions without learning the syntax.

## What JSONata Viz Does

JSONata Viz solves all of this with a fully client-side, interactive tool:

- **Visual Expression Builder** - Drag-and-drop UI for composing JSONata expressions without writing syntax. Nodes represent operations, paths, and transformations.
- **Interactive Visualizer** - See the AST (Abstract Syntax Tree) of any JSONata expression rendered as a navigable, zoomable graph.
- **Component-Level Testing** - Select any sub-expression within a larger JSONata pipeline and test it in isolation with custom input data.
- **Regression Test Suites** - Define input/output test cases for your expressions. Run them on every edit to catch regressions before they ship.
- **Live Evaluation** - Paste JSON input data and see the transformation result in real-time as you build or edit expressions.
- **Import/Export** - Load existing JSONata expressions for visualization, or export built expressions as JSONata strings.
- **Fully Client-Side** - Zero backend. All processing happens in the browser. Your data never leaves your machine.

## Architecture

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

> Architecture is preliminary and will be refined during the planning phase.

## Getting Started

> Coming soon. The project is in the early bootstrapping phase.

## Roadmap

- [ ] JSONata expression parser and AST renderer
- [ ] Interactive graph visualization of expression trees
- [ ] Live evaluation with JSON input/output panels
- [ ] Drag-and-drop node-based expression builder
- [ ] Sub-expression isolation and testing
- [ ] Regression test suite management
- [ ] Import/export of expressions and test suites
- [ ] Shareable expression links (URL-encoded, no server)

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

If you find a bug or have a feature request, please [open an issue](https://github.com/Dhi13man/jsonata-viz/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Sponsor

If you find this project useful, consider supporting its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-dhi13man-orange?logo=buy-me-a-coffee)](https://www.buymeacoffee.com/dhi13man)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-Dhi13man-pink?logo=github-sponsors)](https://github.com/sponsors/Dhi13man)
