# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Visionata** (repo: `jsonata-viz`) is a fully client-side JSONata visualizer and no-code editor. Users can build, modify, test, and validate JSONata expressions via drag-and-drop in the browser with zero backend.

The project is in planning phase — no application code exists yet. Tech stack is locked; implementation plan awaits approval.

## Naming Convention

- **Brand name**: Visionata - The JSONata Visualiser
- **Repo slug**: `jsonata-viz` (kept for SEO discoverability)
- Use "Visionata" in user-facing text, "jsonata-viz" only for repo URLs and package names.

## Tech Stack (Locked)

| Category | Choice |
|---|---|
| Framework | React 19 + Vite 6 (pure SPA, no SSR) |
| Node Graph | @xyflow/react 12.x (React Flow) |
| JSONata Engine | `jsonata` 2.1.x |
| State | Zustand 5 + zundo 2 + Immer 10 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Code Editor | CodeMirror 6 |
| Unit Testing | Vitest 4 |
| E2E Testing | Playwright |
| Deployment | Cloudflare Pages |

Bundle target: ~280-320 kB min+gz (~180 kB first visit with lazy loading).

## Documentation

| Document | Contents |
|---|---|
| `IMPLEMENTATION_PLAN.md` | Tech stack decisions, architecture, store design, AST API details, phased roadmap (Phase 0-4), risk register, success metrics |
| `docs/RESEARCH.md` | Competitive landscape, user personas, market sizing, gap analysis, distribution strategy |
| `docs/DESIGN_SYSTEM.md` | Design principles, layout architecture, visual language/tokens, interaction patterns, accessibility spec |

## Key Design Constraints

- **Fully client-side**: No backend, no server calls. All JSONata parsing and evaluation happens in the browser.
- **No-code first**: Primary interaction is drag-and-drop node composition, not text editing.
- **Component-level testability**: Users can isolate and test any sub-expression within a larger JSONata pipeline.
- **Regression test suites**: Built-in test case management with input/output assertions that run on every edit.

## Critical Engineering Notes

- **AST serializer must be built custom** — no official AST-to-expression tool exists in the `jsonata` package.
- Reference: `@stedi/prettier-plugin-jsonata` for AST traversal patterns.
- `expression.ast()` is not formally documented as public API — pin versions, snapshot test.
- React Flow uses Zustand internally — use Zustand for all application state.
- 4 stores: `useFlowStore` (+ zundo), `useEditorStore`, `useTestSuiteStore`, `useUIStore`.

## Branch Naming

- `fix/<description>` for bug fixes
- `feature/<description>` for new features
- `docs/<description>` for documentation changes

## Git Conventions

- Commit co-author line: `Co-Authored-By: Dhiman's Agentic Suite <dhiman.seal@hotmail.com>`
- PR footer: `Generated with [Dhiman's Agentic Suite](https://github.com/Dhi13man)`
- Commit messages should describe the "why", not the "what".
