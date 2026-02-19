# Visionata Implementation Plan

**Date**: 2026-02-18
**Status**: Awaiting approval (Pre-Implementation Decisions pending)
**Confidence**: 88%

Visionata will be the first comprehensive visual development environment for JSONata, combining an interactive AST visualizer with a no-code drag-and-drop builder and regression testing infrastructure. Research across five domains confirms a greenfield opportunity with zero direct competitors. This document is the single source of truth for technology decisions, architecture, and phased delivery.

For competitive landscape, user personas, and distribution strategy, see [docs/RESEARCH.md](docs/RESEARCH.md). For design specifications, visual language, and interaction patterns, see [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

---

## Pre-Implementation Decisions Required

These must be resolved before Phase 0a begins.

### 1. Licensing Strategy

**Conflict**: The original plan specified MIT for all phases through Phase 3. `docs/RESEARCH.md` specifies BSL for the drag-and-drop builder and Proprietary for test suite management.

| Option | Adoption | Revenue Protection | Community Trust |
|--------|----------|-------------------|-----------------|
| A: All MIT through Phase 3, commercial v2.0+ | Maximum | Low (fork risk) | High |
| B: MIT core, BSL for builder/tests | Moderate | Strong | Medium |
| C: MIT core, commercial from Phase 2 (announced upfront) | Good | Strong | High |

**Recommendation**: Option C. Ship Phase 0-1 visualizer as MIT. Announce commercial license for Phase 2+ premium features from day one in README. Never bait-and-switch.

**Action**: Write `LICENSE.md` and licensing section in README before first commit.

### 2. Staffing Model

| Team Size | Phase 0 | Phase 0.5 | Phase 1 | Total (0-4) |
|-----------|---------|-----------|---------|-------------|
| Solo (full-time) | 3 weeks | 1 week | 4 weeks | 30-36 weeks |
| Pair | 2 weeks | 1 week | 3 weeks | 20-24 weeks |
| Team of 3-4 | 1.5 weeks | 0.5 weeks | 2 weeks | 14-18 weeks |

All phase estimates below use the **solo developer** baseline.

---

## Technology Stack

### Decisions Table

| Category | Choice | Bundle (gz) | Why |
|---|---|---|---|
| Framework | React 19 + Vite 6 | ~45 kB | React Flow compatibility; no SSR needed; largest ecosystem |
| Node Graph | @xyflow/react 12.x | ~60 kB | 35K stars, 2.9M weekly DLs; nodes are React components |
| JSONata Engine | `jsonata` 2.1.x | ~75 kB | Only JS implementation; AST via `expression.ast()` |
| State Management | Zustand 5 + zundo 2 + Immer 10 | ~12 kB | React Flow uses Zustand internally; zundo adds undo/redo; Immer for nested updates |
| Styling | Tailwind CSS v4 + shadcn/ui | ~12 kB | Utility CSS + accessible Radix components; **requires Phase 0a spike** |
| Code Editor | CodeMirror 6 + @uiw/react-codemirror | ~55 kB | Lighter than Monaco (~500 kB); React wrapper included |
| Auto-Layout | @dagrejs/dagre | ~15 kB | Tree/DAG layout for AST; maintained fork of dagre |
| Resizable Panels | react-resizable-panels | ~3 kB | Keyboard-accessible panel system by bvaughn |
| Icons | lucide-react (tree-shaken) | ~3 kB | Design system specifies Lucide icons per category |
| Fonts | @fontsource/inter + @fontsource/jetbrains-mono | ~50 kB | Self-hosted; eliminates Google Fonts GDPR issue |
| URL Compression | lz-string | ~2 kB | URL-safe base64 compression for sharing |
| Unit Testing | Vitest 4 | 0 (dev) | Native Vite integration, 10-20x faster than Jest |
| E2E Testing | Playwright | 0 (dev) | Visual regression via `toHaveScreenshot()` |
| A11y Testing | @axe-core/playwright + jest-axe | 0 (dev) | Automated WCAG checks from Phase 0 |
| Deployment | Cloudflare Pages | 0 | Unlimited bandwidth, 300+ edge locations, native SPA routing |

**Total estimated bundle**: ~280-320 kB min+gz. Reducible to ~180 kB on first visit via lazy loading (CodeMirror + jsonata deferred until first interaction).

### JSONata AST API

The `jsonata` package exposes a structured AST through `expression.ast()`. This is the foundation of the entire project.

```javascript
const jsonata = require('jsonata');
const expression = jsonata('Account.Order.Product.Price');
const ast = expression.ast();
```

**ExprNode properties**:

| Property | Description |
|---|---|
| `type` | Node type identifier (see list below) |
| `value` | Literal value or operator symbol |
| `position` | Character position in source expression |
| `name` | Named field references |
| `lhs` / `rhs` | Left/right-hand side of binary expressions |
| `steps` | Path expression segments |
| `arguments` | Function call arguments |
| `procedure` | Lambda definition body |
| `expressions` | Block/array expression members |
| `stages` | Pipeline stages |

**Known AST node types**: `path`, `binary`, `unary`, `name`, `value`, `string`, `number`, `function`, `lambda`, `block`, `condition`, `transform`, `partial`, `parent`, `wildcard`, `descendant`, `variable`, `regex`, `operator`, `error`

**Key risk**: There is no official AST-to-expression serializer in the `jsonata` package. We must build a custom recursive serializer. Reference implementation: `@stedi/prettier-plugin-jsonata` (study its AST traversal patterns). This is the single hardest engineering task and starts in Phase 0 with comprehensive round-trip tests (parse -> serialize -> reparse -> compare ASTs).

**JSONata error objects** include structured fields for error mapping:

| Field | Description |
|---|---|
| `code` | Categorized error codes: S0xxx (syntax), D1xxx (data), T1xxx/T2xxx (type), U0xxx (user) |
| `position` | Character position where error occurred (some edge cases may omit this) |
| `token` | The problematic token |
| `message` | Human-readable description |

**Known limitation**: Some error types (e.g., "unexpected end of expression") may not return position information. The error-to-node mapping in Phase 1.8 must handle missing positions gracefully.

### AST Serializer Specification

The custom AST serializer is the single hardest engineering task. No official AST-to-expression tool exists.

**Approach**: Recursive descent serializer with precedence-aware parenthesization.

**Reference implementations**:

1. `@stedi/prettier-plugin-jsonata` — AST traversal patterns, formatting
2. `saasquatch/jsonata-ui-core` — Partial serializer (known gaps: lambdas, regex, partial application, conditionals without else)
3. `jsonata/src/parser.js` — Canonical precedence table (source of truth)

**Operator precedence** (verify against parser source in Phase 0b):

| Prec | Operators | Assoc |
|------|-----------|-------|
| 1 (lowest) | `:=` (bind) | Right |
| 2 | `?` `:` (ternary) | Right |
| 3 | `or` | Left |
| 4 | `and` | Left |
| 5 | `=` `!=` `<` `<=` `>` `>=` `in` | Left |
| 6 | `&` (concat) | Left |
| 7 | `+` `-` | Left |
| 8 | `*` `/` `%` | Left |
| 9 | `..` (range) | Left |
| 10 (highest) | Unary `-`, function call, path | N/A |

**Parenthesization rule**: Insert parens when a sub-expression's precedence is lower than its parent context. Conservative strategy (always parenthesize binary sub-expressions) is acceptable initially — ugly but correct. Optimize later.

**Round-trip test corpus**:

- 20+ hand-crafted patterns covering all 19+ node types and operator combinations
- JSONata's own test suite (~500 expressions) as automated round-trip corpus
- Equivalence = AST structural equality after stripping `position` fields

**Contingency**: Node types that fail serialization display a "text-only" fallback with the raw expression substring. This allows the tool to be useful even with incomplete serializer coverage.

### Runner-Up and Rejected Options

| Category | Runner-Up | Why Not | Rejected | Why Not |
|---|---|---|---|---|
| Node Graph | Rete.js (10.8K stars) | 100x smaller community (25K vs 2.9M weekly DLs); plugin system less intuitive than React components as nodes | Flume, Litegraph.js, Svelvet | Flume unmaintained since 2023; Litegraph archived, no TS, Canvas2D; Svelvet tiny community, Svelte lock-in |
| Framework | Svelte 5 | Immature node graph ecosystem (Svelvet 1.2K weekly DLs); risk of building critical infra on unproven libs | Vue 3, Solid.js | Vue editor ecosystem thinner; Solid has no mature node graph library |
| State Mgmt | Jotai | Atomic model unnatural for canvas state (single nodes/edges array); no mature undo/redo middleware | Redux Toolkit, Valtio | Redux 10x heavier, boilerplate overkill; Valtio proxy edge cases, no undo middleware |
| Styling | CSS Modules | Lacks Tailwind's velocity for complex UI; no pre-built accessible components | Vanilla Extract | Build complexity overkill; smaller community |
| Code Editor | Monaco | ~500 kB gz bundle; designed for VS Code, excessive for embedded use | -- | -- |
| Testing (E2E) | Cypress | Slower parallel execution; 100 GB bandwidth limit on paid Dashboard for CI | -- | -- |
| Deployment | Vercel | 100 GB/month bandwidth limit; serverless features irrelevant for static SPA | GitHub Pages, Netlify | GH Pages no native SPA routing; Netlify fewer free build minutes |

---

## Architecture

### Store Architecture

```
+-------------------------------------------------------+
|                   SyncCoordinator                      |
|   editOrigin: 'text' | 'graph' | null                 |
|   Prevents cyclic updates; enforces mutual exclusion   |
+-------------------------------------------------------+
|                                                        |
|   EditorStore ---> SyncCoordinator ---> FlowStore      |
|   (source of truth)       |            (derived)       |
|                           v                            |
|                       UIStore <---- TestStore           |
|                                                        |
+-------------------------------------------------------+
```

**Cycle prevention**: The original architecture contained an undeclared cycle: `EditorStore -> FlowStore -> UIStore -> EditorStore`. The SyncCoordinator breaks this cycle by tracking which side initiated each change and suppressing echo propagation.

**Mutual exclusion**: When `editOrigin === 'text'`, graph-derived updates to EditorStore are suppressed. When `editOrigin === 'graph'`, text-derived updates to FlowStore are suppressed. `editOrigin` resets to `null` after debounce settles (300ms inactivity).

**CodeMirror bridge**: CodeMirror 6 uses its own `EditorState`/`EditorView`, not Zustand. Bridge: CM `updateListener` -> SyncCoordinator (`editOrigin: 'text'`) -> EditorStore -> FlowStore. Reverse: FlowStore -> SyncCoordinator (guards against `editOrigin === 'text'`) -> EditorStore -> CM `dispatch`.

**Store responsibilities**:

| Store | Persisted To | What's Persisted | Undo | Version |
|---|---|---|---|---|
| `useFlowStore` | localStorage | Viewport, manual node positions only | Yes (zundo, 50-step, **session-only**) | `v: 1` |
| `useEditorStore` | localStorage | Expression text, input JSON only | No | `v: 1` |
| `useTestSuiteStore` | IndexedDB | Test cases, I/O pairs | No | `v: 1` |
| `useUIStore` | localStorage | Panel visibility, theme, layout | No | `v: 1` |

**Not persisted** (derived on load): AST, evaluation results, errors, React Flow nodes/edges, undo history. This reduces storage from ~5 MB to ~50-500 KB.

**State migration**: Every store includes a `version` field. Zustand `persist` middleware's `migrate` option handles schema changes. On deserialization failure -> default state + user notification. Unit test: serialize state, bump version, verify migration.

### Core Data Flow

```
Text Input ---> jsonata.parse() ---> AST ---> SyncCoordinator ---> Mapper ---> Canvas
                                                                                  |
                                                                           User clicks node
                                                                                  |
                                                                           Sub-expr extracted
                                                                                  |
                                                                           +------v------+
                                                                           |  EvalWorker  |
                                                                           | (Web Worker) |
                                                                           |  5s timeout  |
                                                                           +------+------+
                                                                                  |
                                                                     {result, error, timing}
                                                                                  |
                                                                     Node preview + Output panel
```

### Evaluation Architecture

JSONata evaluation runs in a **dedicated Web Worker** from Phase 0b.

**Worker interface**:

```typescript
// Main -> Worker
type EvalRequest = { id: string; expression: string; input: string; timeout?: number };
// Worker -> Main
type EvalResponse = { id: string; result?: unknown; error?: JsonataError; timing: number };
```

**Timeout**: Worker self-terminates after timeout (default 5s). Main thread detects death, respawns worker, shows "Expression timed out."

**Value preview strategy**: Evaluate root expression once. For node previews, extract sub-expressions and evaluate **lazily on selection/hover** with LRU cache (100 entries). Never evaluate all N nodes simultaneously.

**JSONata sandboxing**: Override `$eval` binding to prevent dynamic code execution from shared URLs. Override `registerFunction` in the Worker context.

### State Persistence Strategy

| Data | Storage | Persisted | Rationale |
|------|---------|-----------|-----------|
| Expression text | localStorage | Yes | User's work product |
| Input JSON | localStorage | Yes | User's test data |
| AST, eval results, errors | Memory | No | Derived from expression |
| Flow nodes/edges | Memory | No | Derived from AST |
| Viewport (zoom, pan) | localStorage | Yes | User preference (~100 B) |
| Manual node positions | localStorage | Yes | Only explicitly moved nodes |
| Undo history | Memory | No | Session-only; 50 snapshots too large to persist |
| UI preferences | localStorage | Yes | Theme, panels, layout (~500 B) |
| Test cases | IndexedDB | Yes (Phase 2+) | Async; no 5 MB limit |

**Quota handling**: `try/catch` on `localStorage.setItem`. On `QuotaExceededError` -> warning + "Export to file" fallback. Writes debounced to 2s max via `requestIdleCallback`.

### Error Boundary Strategy

| Boundary | Wraps | Fallback |
|----------|-------|----------|
| `<AppErrorBoundary>` | Entire app | "Something went wrong -- reload" with error report |
| `<CanvasErrorBoundary>` | React Flow | "Canvas error -- text editor still available" |
| `<NodeErrorBoundary>` | Each custom node | Red "Error" placeholder; other nodes unaffected |
| Evaluation errors | Worker message | Error displayed on relevant node + output panel |

### Security Architecture

**Self-hosted fonts**: `@fontsource/inter` and `@fontsource/jetbrains-mono`. Zero Google CDN requests. Makes the "no external network calls for user data" claim truthful.

**Security headers** (`public/_headers` for Cloudflare Pages):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**URL sharing**: Encode **expression only** by default. JSON input NOT included. Explicit "Include test data" toggle with warning. `lz-string` compression. Max 8 KB; fallback to file export.

**Regulatory language**: Do NOT claim HIPAA or SOC2 compliance. Use: *"Visionata processes all data locally in your browser. No user data is transmitted to any server. This architecture may simplify compliance with data residency requirements -- consult your compliance team for specific guidance."*

**Vulnerability disclosure**: `SECURITY.md` in repository from Phase 0a.

### Performance Strategy

| Node Count | Performance | Optimization Required |
|---|---|---|
| 1-100 | Smooth | None |
| 100-500 | Good | `React.memo` on custom nodes, `useCallback` for handlers |
| 500-1,000 | Acceptable | Hide off-screen nodes, simplify edges, throttle state updates |
| 1,000+ | Challenging | Collapse subtrees, virtual node groups, limit visible detail |

Key strategies:

- **Memoize all custom node components** with `React.memo` (single most impactful optimization)
- **Zustand selectors with `useShallow`** to prevent cascading re-renders
- **Web Worker evaluation** prevents main-thread blocking (see Evaluation Architecture)
- **Adaptive debounce**: `max(100ms, lastEvalDuration * 1.5)` replaces fixed 300ms
- **Wire animation budget**: Only animate edges visible in viewport. If frame time > 16ms, disable animations globally with "simplified rendering" indicator
- **Layout**: `@dagrejs/dagre` for Phase 0-2. Runs on: initial parse, "Auto Layout" button, node creation. NOT on every keystroke. Cache results; skip nodes with `userPositioned` flag
- **localStorage writes**: Debounced 2s max via `requestIdleCallback`
- **Lazy loading**: jsonata + CodeMirror loaded on first interaction for new visitors (~180 kB initial vs ~310 kB total)
- **Subtree collapsing** (Phase 2.11) for large expressions
- **Lazy detail rendering**: simplified labels when zoomed out, full detail when zoomed in

### Bundle Splitting Strategy

```
dist/
  index.html                     -- Shell (~1 kB)
  assets/
    vendor-react.[hash].js       -- React + ReactDOM (~45 kB gz)
    vendor-reactflow.[hash].js   -- React Flow + dagre (~75 kB gz)
    vendor-jsonata.[hash].js     -- JSONata (~75 kB gz) [lazy-loadable]
    vendor-codemirror.[hash].js  -- CodeMirror + wrapper (~55 kB gz) [lazy-loadable]
    app.[hash].js                -- Application code (~40-60 kB gz)
    app.[hash].css               -- Tailwind CSS (~12 kB gz)
    fonts/                       -- Inter + JetBrains Mono (~50 kB gz)
```

| Metric | Target | Notes |
|---|---|---|
| First visit transfer | < 200 kB | Lazy-load jsonata + CM |
| Return visit transfer | < 320 kB | All chunks prefetched |
| First Contentful Paint | < 1.5s | Cloudflare CDN edge |
| Time to Interactive | < 3.0s | After lazy chunk load |
| Lighthouse Performance | > 85 | Adjusted for 320 kB total |

### AST-to-Visual Mapping

**Colors, icons, and node type groupings are defined in `docs/DESIGN_SYSTEM.md`** (Section: Node Type Taxonomy). This plan does not maintain a separate color table — the Design System is the single source of truth for all visual specifications to prevent cross-document drift.

**Semantic grouping**: `$.orders.items.price` renders as a single compound node, not four. The mapper collapses `path` nodes with multiple `name` steps, with "expand to detail" option.

**Pending reconciliation**: AST type groupings for `variable`, `wildcard`, `block`, `partial` differ between documents. Phase 0b.1 (AST exploration) will verify against actual parser output and the Design System will be updated accordingly. Phantom types (`filter`, `sort`, `bind`) in the Design System must be verified or removed.

### Testing Pyramid

Three-layer pyramid:

- **Unit tests (Vitest)**: JSONata parsing, AST serialization round-trips, AST-to-ReactFlow mapping, store actions, utility functions. Pure function tests, no DOM rendering. Target: < 1s execution.
- **Integration tests (Vitest + React Testing Library)**: Custom node component rendering, store interactions, undo/redo state transitions, error state UI. Mock React Flow canvas (does not render in jsdom).
- **E2E tests (Playwright)**: Critical user journeys (10-15 scenarios). Visual regression via `toHaveScreenshot()` at 1920x1080 with 0.5% pixel threshold. Canvas interactions via `data-testid` attributes on nodes. CI runs on Linux only for consistent rendering.

Additional testing standards:

- **Accessibility**: `@axe-core/playwright` in every E2E test from Phase 0. `jest-axe` for component integration tests
- **Cross-browser**: Playwright on Chromium + Firefox + WebKit. Visual regression Chromium-only
- **Fonts**: Self-hosted via @fontsource eliminates rendering non-determinism
- **Canvas E2E**: Use `locator('[data-testid]')` for assertions; `page.evaluate()` for store-level operations; explicit waits for Dagre layout completion
- **Test data**: `tests/fixtures/` directory with standard JSON inputs, expression patterns per AST node type, and error cases
- **Visual regression**: Playwright `{ animations: 'disabled' }` during capture

---

## Validation Gates

| Gate | Proceed When | Fallback |
|------|-------------|----------|
| 0b -> 0.5 | AST serializer round-trips >= 90% of JSONata test suite | Text-to-graph only; no serializer in validation release |
| 0.5 -> 1 | >= 50 unique visitors with >= 2 min avg session | Pivot scope or target audience |
| 1 -> 2 | >= 200 MAU with >= 15% 7-day retention | Iterate Phase 1 UX before building builder |
| 2 -> 3 | >= 40% expressions created via builder (not text) | Improve builder UX; don't add more features |
| 3 -> 4 | >= 500 MAU, >= 100 test suites, user interviews confirm need | Deepen Phase 3 instead of expanding |

**Analytics**: Privacy-respecting tool (Plausible, Cloudflare Web Analytics, or Umami self-hosted) integrated in Phase 0.5. No personal data collection. Required for gate measurement.

---

## Feature Roadmap

### MoSCoW Summary

Feature scope defined in [docs/RESEARCH.md](docs/RESEARCH.md) Section: Value Proposition.

| Priority | Features | Phase |
|---|---|---|
| Must Have | AST visualization, live evaluation, sub-expression testing, text-to-graph sync, error mapping, sharing | 0-1 (MVP) |
| Should Have | Drag-and-drop builder, bidirectional sync, properties panel, test case management, templates | 2 (Builder) |
| Could Have | Regression suites, expression diff, profiling, complexity scoring, keyboard nav | 3 (Test Suite) |
| Won't Have (yet) | VS Code extension, embeddable widget, Node-RED import, FHIR autocomplete, CI/CD CLI | 4 (Platform) |

---

## Phased Implementation

### Phase 0a: Scaffolding (Week 1)

**Goal**: Project skeleton with all tooling verified and security baseline established.

| Step | Description | Validation |
|---|---|---|
| 0a.1 | Scaffold Vite + React 19 + TS + ESLint 9 flat config + Prettier | `npm run dev` starts; `npm run lint` passes |
| 0a.2 | Install @xyflow/react, Zustand, shadcn/ui | Basic canvas renders with background grid |
| 0a.3 | **Tailwind v4 + shadcn/ui spike** — validate compatibility | shadcn CLI generates working components; dark/light toggle works. If fails -> Tailwind v3 fallback |
| 0a.4 | Install `jsonata`, verify `expression.ast()` in browser | Unit test: parse expression, assert AST shape |
| 0a.5 | Vitest + Playwright + @axe-core/playwright + GitHub Actions CI | Unit tests + 1 smoke E2E + axe audit pass in CI |
| 0a.6 | @fontsource fonts, dark theme, base shadcn components (Button, Input, Dialog, Tabs) | Self-hosted fonts load; zero external requests verified |
| 0a.7 | Security: `_headers` file with CSP/HSTS, `SECURITY.md` | CSP verified in dev; no console violations |

### Phase 0b: Core Engine (Week 2-3)

**Goal**: Prove the hardest technical risks — AST round-trips and Worker evaluation.

| Step | Description | Validation |
|---|---|---|
| 0b.1 | **AST exploration script**: Parse 50+ expressions covering all language features; dump every node type, property, structure | TypeScript types generated for all AST shapes; phantom types (`filter`, `sort`, `bind`) verified or removed |
| 0b.2 | **AST serializer** with precedence-aware parenthesization (see Serializer Spec) | Round-trip >= 90% of JSONata's test suite (~500 expressions) |
| 0b.3 | AST-to-ReactFlow mapper (read-only) + @dagrejs/dagre layout | `Account.Order.Product.$sum(Price)` -> correct nodes, edges, layout |
| 0b.4 | Zustand stores + SyncCoordinator + state migration + persist middleware | Stores sync without cycles; migration works; quota handled gracefully |
| 0b.5 | Web Worker for evaluation + 5s timeout + $eval override | Eval in worker; timeout kills runaway expressions; UI stays responsive |
| 0b.6 | Three-column layout with react-resizable-panels | Panels resize/collapse via drag handles; keyboard accessible |

**Exit criteria**: Paste JSONata -> see React Flow graph -> serialize back -> evaluate in Worker with timeout. All round-trip tests pass. Zero external network requests.

### Phase 0.5: Validation Release (Week 4)

**Goal**: Ship minimum lovable product to validate market interest before committing to full scope.

| Step | Description | Validation |
|---|---|---|
| 0.5.1 | Connect mapper + canvas + simple textarea (CodeMirror deferred) | Paste expression -> see graph |
| 0.5.2 | Expression + input JSON -> Worker evaluation -> output | Type input, see output |
| 0.5.3 | URL sharing (expression-only, lz-string compressed) | Copy URL -> new tab -> same graph |
| 0.5.4 | "Client-side only" status bar indicator | Privacy badge always visible |
| 0.5.5 | Deploy to Cloudflare Pages | Live URL accessible |
| 0.5.6 | Analytics (Plausible or Cloudflare Web Analytics) | Visitors, sessions, duration measurable |
| 0.5.7 | Launch: HN, Node-RED forum, JSONata community, r/programming | Posts published |

**Exit criteria**: Live URL with analytics. **Gate**: >= 50 visitors with >= 2 min avg session to proceed.

### Phase 1: MVP — The Visualizer (Week 5-8)

**Goal**: The full "wow" release surpassing the JSONata Exerciser.

| Step | Description | Validation |
|---|---|---|
| 1.1 | Interactive colored node types (per Design System taxonomy) | Up to 100 nodes render correctly with Dagre auto-layout |
| 1.2 | JSON input editor (CodeMirror 6 via @uiw/react-codemirror) | Validates on input; parse errors inline |
| 1.3 | Live evaluation (adaptive debounce, Web Worker) | Input/expression changes update output in real-time |
| 1.4 | Sub-expression testing: click node -> isolated result | Click `$sum()` -> see value inline |
| 1.5 | JSONata syntax highlighting (CodeMirror StreamLanguage tokenizer) | Keywords and operators highlighted |
| 1.6 | Text-to-graph sync (one-direction: text edits update graph) | Edit text -> graph reflows within 500ms |
| 1.7 | Inline value previews (lazy on hover/select, LRU cache) | Hovered/selected nodes show result |
| 1.8 | Error mapping with error taxonomy (parse +/- position, eval +/- position, undefined result, cascading) | Red border + tooltip; graceful fallback for missing position |
| 1.9 | Animated data-flow wires (viewport-culled, auto-disable on jank) | Wires pulse; disabled outside viewport |
| 1.10 | Persistence (minimal state: expression + input + viewport + UI prefs) | Refresh -> fully restored |
| 1.11 | **First-run onboarding**: pre-loaded sample expression + 3-step guided tour | New visitors see walkthrough; dismissible |
| 1.12 | Canvas controls: pan, zoom, minimap, fit-to-view | Standard React Flow + keyboard shortcuts |
| 1.13 | Responsive: functional evaluator below 768px (text + output) | Mobile users can evaluate; "Open on desktop for visual editor" |
| 1.14 | React Error Boundaries (app, canvas, node) | One node crash doesn't break app |
| 1.15 | URL sharing with lz-string (expression-only default, opt-in input) | Share -> new tab -> same state; data warning on opt-in |

**Deferred to Phase 2**: PWA (service worker complexity premature before retention proven).

**Exit criteria**: Paste JSONata + JSON -> visualize -> click sub-expressions -> share via URL. **Gate**: >= 200 MAU, >= 15% 7-day retention.

### Phase 2: v1.0 — The Builder (Week 9-14)

**Goal**: Add the no-code drag-and-drop builder. This opens the non-developer market.

| Step | Description | Validation |
|---|---|---|
| 2.1 | Node palette sidebar with semantic categories (per Design System) | Searchable; drag-from-palette creates nodes |
| 2.2 | Drag-and-drop node placement on canvas | Ghost preview; snap to grid; scale-up animation |
| 2.3 | Wire connection with type hints and validation | Connect ports; incompatible shows warning |
| 2.4 | **Bidirectional sync** via SyncCoordinator (`editOrigin` flag) | Edit graph -> text updates. Edit text -> graph updates. No echo loops |
| 2.5 | Properties panel for node configuration | Click node -> configure params in right panel |
| 2.6 | Command palette (Cmd+K) | Search/insert nodes, switch layouts, run actions |
| 2.7 | Test case management (CRUD, persisted to IndexedDB) | Define input + expected output; pass/fail indicators |
| 2.8 | Auto-run tests on expression edit (debounced) | Edit -> tests re-run -> badge shows pass/fail count |
| 2.9 | File import/export (.jsonata + test suite JSON) | Round-trip preserves expression, tests, layout |
| 2.10 | Starter templates (10-15 common patterns) | Template picker on empty canvas |
| 2.11 | Collapse/expand subtrees | Collapse -> single summary node |
| 2.12 | Layout presets: Graph / Text / Split (Cmd+1/2/3 revised to avoid browser conflicts) | Three modes with smooth transitions |
| 2.13 | PWA manifest + service worker (vite-plugin-pwa) | Works offline after first load |
| 2.14 | Basic keyboard shortcuts for canvas navigation | Arrow-key node traversal, common shortcuts |

**Exit criteria**: Non-developer can build JSONata from scratch via drag-and-drop, test against sample data, export. **Gate**: >= 40% expressions via builder.

### Phase 3: v1.5 — The Test Suite (Week 15-20)

**Goal**: Add regression testing infrastructure. This is the retention and monetization driver.

| Step | Description | Validation |
|---|---|---|
| 3.1 | Regression test suites: batch run multiple test cases | Run all; see pass/fail dashboard with timing information |
| 3.2 | Test suite persistence (IndexedDB for large suites) | Suites survive browser close; handles 100+ test cases without performance degradation |
| 3.3 | Expression diff/comparison view | Side-by-side AST graph diff of two expressions with change highlighting |
| 3.4 | Execution time profiling per AST node | Heatmap overlay showing hot nodes colored by evaluation duration |
| 3.5 | Keyboard navigation: Tab between nodes, Enter to inspect | Full keyboard-only workflow possible; focus ring visible |
| 3.6 | Undo/redo history panel (chronological list with timestamps) | Visual history of all operations; click any entry to restore state |
| 3.7 | Expression complexity scoring | Badge showing weighted complexity metric based on AST depth and node count |
| 3.8 | Accessibility audit and WCAG AA compliance | Screen reader + keyboard-only testing passes; color contrast ratios verified |

**Exit criteria**: A team lead can define regression suites, run them on every edit, and catch regressions before deployment. **Gate**: >= 500 MAU, >= 100 test suites, user interviews confirm need.

### Phase 4: v2.0 — Platform (Week 21-28)

**Goal**: Extend beyond the web app into the developer ecosystem.

| Step | Description | Validation |
|---|---|---|
| 4.1 | VS Code extension (webview-based, reuses core React app) | Install from marketplace; opens .jsonata files in visual editor |
| 4.2 | Embeddable web component (`<visionata-editor>`) | Third-party sites can embed the editor with `<script>` tag + custom element |
| 4.3 | Import from Node-RED flow format | Paste Node-RED JSON; extract and visualize JSONata expressions from function nodes |
| 4.4 | FHIR resource schema autocomplete | Path completion for FHIR R4 resource types when JSON schema is loaded |
| 4.5 | CI/CD integration: CLI tool for running test suites | `npx visionata test suite.json` exits 0/1 in CI pipelines |
| 4.6 | Shareable test suite URLs (expression + tests encoded) | Share full test suite via URL or exportable link |

**Exit criteria**: Visionata is available in VS Code, embeddable in third-party apps, and runnable in CI pipelines.

**Revised total timeline**: 28 weeks (solo dev). With 25% buffer: **35 weeks**.

---

## Risk Register

### Technical Risks

| Risk | Prob | Impact | Mitigation | Contingency |
|---|---|---|---|---|
| AST serializer complexity | HIGH | HIGH | Formal precedence table; 2 reference impls; 500+ round-trip tests; dedicated 2-week Phase 0b | Text-only fallback for unsupported node types |
| Bidirectional sync jank | MEDIUM | HIGH | SyncCoordinator + editOrigin; Phase 1 is unidirectional; Phase 2 adds reverse | "Generate Text" button instead of live sync |
| React Flow perf at 500+ nodes | LOW | MEDIUM | Subtree collapse; memo; viewport-culled animations | Simplified labels-only rendering |
| JSONata AST API changes | LOW | HIGH | Pin version; 500+ snapshot tests; monitor releases | Fork jsonata; maintain patch |
| Tailwind v4 + shadcn/ui incompatibility | MEDIUM | LOW | Phase 0a spike validates | Fall back to Tailwind v3 |
| JSONata evaluation DoS (no timeout) | HIGH | MEDIUM | Web Worker + 5s timeout + $eval override | Main-thread fallback with UI freeze warning |
| localStorage quota exceeded | MEDIUM | LOW | Minimal persistence; derived state not stored; quota catch | Export-to-file fallback |

### Business & Organizational Risks

| Risk | Prob | Impact | Mitigation | Contingency |
|---|---|---|---|---|
| Solo developer burnout | HIGH | CRITICAL | Phase 0.5 validates early; validation gates prevent wasted effort | Reduce to Phase 0-1; seek co-maintainers |
| Zero revenue 7+ months | HIGH | HIGH | GitHub Sponsors from 0.5; early-access enterprise tier | Consulting/training bridge |
| Community adoption failure | MEDIUM | HIGH | Phase 0.5 validates before major investment | Pivot to embeddable library play |
| Fork risk (MIT core) | MEDIUM | MEDIUM | Community moat (templates, tests); brand; speed | Compete on quality |
| Competitor copies features | MEDIUM | MEDIUM | First-mover + deeper features + community | Differentiate on UX quality |

---

## Success Metrics

### Primary (User Outcomes)

| Metric | Phase 0.5 | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| 7-day retention | N/A | >= 15% | >= 25% | >= 35% |
| Median time-to-first-eval | <90s | <60s | <45s | <30s |
| Expressions evaluated/session | >= 1 | >= 3 | >= 5 | >= 5 |
| Task completion rate | N/A | >= 70% | >= 80% | >= 85% |

### Secondary (Growth)

| Metric | Phase 0.5 | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|---|
| MAU (base scenario) | 50-100 | 200-500 | 800-2,000 | 2,000-5,000 |
| GitHub Stars | 50-100 | 150-400 | 400-800 | 800-1,500 |
| Shared URLs clicked | N/A | 50/wk | 200/wk | 500/wk |
| Test Suites Created | N/A | N/A | 50-100 | 200-500 |

Scenarios (Phase 1 MAU): Conservative 100, Base 300, Optimistic 800.

---

## Open-Source Strategy

| Component | License | Phase |
|---|---|---|
| Core visualizer + evaluator | MIT | 0-1 |
| Drag-and-drop builder | MIT | 2 |
| Test suite engine | MIT | 3 |
| VS Code extension | MIT | 4 |
| Embeddable widget | MIT (core) / Commercial (premium features) | 4 |

Start fully MIT to maximize adoption. Introduce commercial layer only in v2.0+ for premium platform features (hosted test suite storage, team collaboration).

**Note**: Licensing decision (see Pre-Implementation Decisions) may modify this table. Document final choice in `LICENSE.md` and README before first commit.

---

## Financial Sustainability

| Period | Revenue Source | Estimated |
|---|---|---|
| Phase 0-0.5 | None | $0 |
| Phase 1 | GitHub Sponsors, Open Collective | $100-500/mo |
| Phase 2 | Early-access enterprise tier | $500-2,000/mo |
| Phase 3 | Premium test suite features | $2,000-5,000/mo |
| Phase 4 | Commercial licenses, VS Code marketplace | $5,000-15,000/mo |

**Action**: Set up GitHub Sponsors and Open Collective before Phase 0.5 launch.

---

## Confidence Assessment

```
Base:                                    0.50
Requirements addressed:                 +0.15
Edge cases identified:                  +0.10
Error handling planned:                 +0.10
Testing strategy defined:               +0.08
Integration points verified:            +0.05
Research incorporated:                  +0.05
Existing patterns followed:             +0.05
Security architecture added:            +0.05
Web Worker evaluation added:            +0.03
State migration strategy:               +0.02
Validation gates added:                 +0.02
AST serializer spec remaining gap:      -0.05
Cross-doc reconciliation pending:       -0.03
Team size decision pending:             -0.02
Licensing decision pending:             -0.02
----------------------------------------------
TOTAL:                                   0.88 -> 88%
```

**To reach 95%**: Resolve licensing, complete AST type reconciliation against parser source, validate Tailwind v4 spike, and build AST exploration script.

**GATE STATUS: CONDITIONALLY PASSED — Ready for implementation after Pre-Implementation Decisions are resolved.**

---

## Implementation Checklist

Pre-implementation verification:

- [ ] Licensing decision made and documented in LICENSE.md
- [ ] Team size confirmed and timeline adjusted
- [ ] `_headers` security file drafted
- [ ] `SECURITY.md` drafted
- [ ] @fontsource packages identified (Inter, JetBrains Mono)
- [ ] Tailwind v4 + shadcn/ui test project created (spike)
- [ ] Regulatory language reviewed by legal (or qualified advisor)
- [ ] Analytics tool selected (Plausible / Cloudflare / Umami)
- [ ] GitHub Sponsors / Open Collective account created
- [ ] Design System AST type groupings marked for Phase 0b verification

---

## Appendix: Cross-Document Reconciliation

| Item | Status | Action |
|------|--------|--------|
| Node color hex values | **Resolved** | Design System is authoritative; this plan removed its color table |
| "Monaco" -> "CodeMirror" in Design System | **Fixed** | Both references corrected |
| Error node type in Design System | **Fixed** | Added Error row (Red, #F85149, AlertTriangle) |
| Light mode overlay token | **Fixed** | Added `rgba(255,255,255,0.8)` |
| AST type groupings (variable, wildcard, block, partial) | **Pending** | Phase 0b.1 verifies against parser |
| Phantom AST types (filter, sort, bind) | **Pending** | Phase 0b.1 verifies or removes |
| Palette category count (6 vs 7 vs 8) | **Pending** | Settle after AST verification |
| Licensing (MIT vs BSL) | **Pending** | Pre-Implementation Decision #1 |
| Keyboard shortcut conflicts (Cmd+T/J/B) | **Noted** | Phase 2 revises shortcuts |

---

## Appendix: Review History

This plan was reviewed on 2026-02-18 by a 9-agent fleet:

| Agent | Confidence | Key Concern |
|-------|------------|-------------|
| UX Researcher | 72% | Missing onboarding, no user feedback loop |
| Product Designer | 72% | Cross-doc color conflicts, Monaco references |
| Architect Reviewer | 72% | Store cycle, no Worker, no error boundaries |
| Code Reviewer | 82% | Missing deps (dagre, resizable-panels), timeline aggressive |
| QA Engineer | 62% | 0.1% pixel threshold unrealistic, no test data strategy |
| Security Specialist | 35% | HIPAA/SOC2 claims, Google Fonts GDPR, no CSP |
| Performance Engineer | 68% | Bundle underestimated, no Worker, fixed debounce |
| Business Analyst | 52% | Vanity metrics, no revenue model, no staffing plan |
| Product Manager | 62% | No validation gates, no Phase 0.5, scope risk |

**Aggregate pre-review**: 64%. **Post-review**: 88%. 20 changes incorporated.
