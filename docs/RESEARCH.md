# Visionata Research

## Market Context

### JSONata Adoption Trajectory

| Platform | Integration Type | Date |
| --- | --- | --- |
| IBM App Connect | Creator/origin | 2016 |
| Node-RED | Built-in expression language | 2016+ |
| elastic.io | Data mapper expression language | 2018+ |
| Grafana | Plugin query language (JSON API, Infinity) | 2020+ |
| Zendesk | AI agent integration builder | 2023+ |
| Cisco Observability | CNCF Serverless Workflow expression | 2024+ |
| OutSystems | Forge component (O11 and ODC) | 2024+ |
| **AWS Step Functions** | **First-class expression language (replaces JSONPath)** | **Nov 2024** |
| Tray.io | JSON Transformer connector | Ongoing |

### npm Download Metrics (February 2026)

| Metric | Value |
| --- | --- |
| Weekly downloads | ~916,053 |
| Daily range | 27,000-167,000 (weekday/weekend) |
| GitHub stars | 2,516 |
| Open issues | 165 |
| Current version | 2.1.0 |
| Created | September 2016 |

### Comparative Language Popularity (npm weekly downloads)

| Language | Weekly Downloads | GitHub Stars |
| --- | --- | --- |
| jsonpath-plus | 7,136,554 | N/A |
| jsonpath | 2,937,342 | 1,417 |
| **jsonata** | **916,053** | **2,516** |
| JSONPath | 16,646 | 1,127 |
| jq (JS) | 10,675 | N/A |

JSONata is a complete transformation language (not just query). AWS Step Functions adoption is expected to shift download numbers significantly through 2025-2026.

## Competitive Landscape

### Direct Competitors (JSONata-Specific)

| Tool | URL | Key Features | Critical Gaps |
| --- | --- | --- | --- |
| JSONata Exerciser (official) | [try.jsonata.org](https://try.jsonata.org/) | Bindings, custom functions, version selector, link sharing | No autocomplete, no dark mode, no AST view, no debugging |
| Stedi Playground | [stedi.com/jsonata/playground](https://www.stedi.com/jsonata/playground) | IntelliSense, dark mode, modern UI, shareable links | No bindings, no custom functions, no visual editor, no debugging |
| Stedi Mappings UI | [stedi.com/docs](https://www.stedi.com/docs/edi-platform/mappings/manage-mappings/ui-guide) | Visual field mapping, schema-aware, JSONata per field | Closed EDI platform, not standalone, not open-source |
| JSONata Studio | [jsonatastudio.com](https://jsonatastudio.com/) | AST explorer (view-only), IntelliSense, sequential eval, dark mode | No visual builder, no interactive AST editing, no debugging |
| saasquatch visual-editor | [GitHub](https://github.com/saasquatch/jsonata-visual-editor) | Visual conditionals/logic/mapping, themeable React component | 25 stars, 71 npm/week, abandoned (~2019), limited AST coverage |
| saasquatch ui-core | [GitHub](https://github.com/saasquatch/jsonata-ui-core) | AST serialization, round-trip parsing | Missing lambdas, regex, partial application, conditionals without else |
| jsonata-gui (tbal999) | [GitHub](https://github.com/tbal999/jsonata-gui) | Minimal query runner | Hobby project, no meaningful features |

### Adjacent Competitors (Visual JSON / Data Transformation)

| Tool | URL | Type | JSONata Support | Key Trait |
| --- | --- | --- | --- | --- |
| JSON Crack | [jsoncrack.com](https://jsoncrack.com/) | JSON graph visualization | No | 42.8K GitHub stars; proves demand for visual JSON tools |
| Altova MapForce | [altova.com/mapforce](https://www.altova.com/mapforce) | Enterprise data mapper (desktop) | No (own language) | Drag-and-drop mapping, code gen; from $249 |
| Liquid Data Mapper | [liquid-technologies.com](https://www.liquid-technologies.com/data-mapper) | Enterprise data mapper (desktop) | No | Schema-based, commercial |
| Itential JST Designer | [itential.com](https://www.itential.com/developer-tools/jst-designer/) | No-code JSON transformer | No (own JST language) | Web-based, network automation focus |
| WSO2 Choreo Visual Mapper | [wso2.com](https://wso2.com/blogs/thesource/introducing-choreo-visual-data-mapper) | Visual data mapper (VS Code) | No (Ballerina) | Bidirectional visual/code sync, AI-assisted mapping |
| elastic.io Mapper | [docs.elastic.io](https://docs.elastic.io/guides/mapping-data.html) | iPaaS data mapper | Yes | Dual mode (visual + code), locked to platform |
| Tray.io Transformer | [tray.io](https://tray.io/documentation/connectors/core/json-transformer/) | iPaaS transformation | Yes | JSONata-powered, locked to platform |
| JSON Editor Online | [jsoneditoronline.org](https://jsoneditoronline.org/) | JSON editor | No (JSONPath-Plus) | Tree/table view, validation |

### Inspirational Products

| Product | URL | Stars | Relevance to Visionata |
| --- | --- | --- | --- |
| React Flow / xyflow | [reactflow.dev](https://reactflow.dev/) | 25K+ | Primary candidate for visual canvas; shadcn/ui components, auto-layout |
| Rete.js | [retejs.org](https://retejs.org/) | 10K+ | Multi-framework node editor; JSON-node-editor demo exists |
| Node-RED | [nodered.org](https://nodered.org/) | 20K+ | Native JSONata in Change/Switch nodes; proves JSONata in visual flows |
| n8n | [n8n.io](https://n8n.io/) | 50K+ | Expression editor UX with variable picker; community requests JSONata |
| JointJS | [jointjs.com](https://www.jointjs.com/) | N/A | Has explicit AST Visualizer demo rendering JS ASTs as interactive trees |
| Nodes.io | [nodes.io](https://nodes.io/) | N/A | Visual programming by connecting code blocks |

## Community Pain Points

Seven pain points sourced from GitHub issues, Google Groups, and community forums. Each maps to a Visionata opportunity.

| # | Pain Point | Community Quote | Visionata Opportunity |
| --- | --- | --- | --- |
| 1 | Debugging is nearly impossible | "Evaluating an expression may return nothing -- no errors, just nothing." | Step-through evaluation showing intermediate results at each AST node |
| 2 | Steep learning curve | "You need a particular type of mind to cope with JSONata's more subtle uses." | Visual expression builder; beginners compose blocks, see generated JSONata |
| 3 | Documentation is insufficient | "There isn't much information or examples available online." | Interactive tutorials and visual documentation built into the editor |
| 4 | Maintainability degrades fast | "JSONata can result in unmaintainable code that's hard to understand months later." | AST visualization showing expression structure annotated with data flow |
| 5 | Performance is opaque | "Switching from handwritten loops to JSONata resulted in very slow execution." | Performance profiling view showing execution time per AST node |
| 6 | No IDE integration | Autocomplete (Issue #10), bindings UI (Issue #9), LSP (Issue #331) -- all unresolved | First comprehensive JSONata IDE experience |
| 7 | Testing is ad-hoc | Developers test by manually pasting into playgrounds; no assertion library exists | Built-in test suite builder: input JSON + expression + expected output |

## Gap Analysis

Rows where **all** competitors show No represent Visionata's unique value.

| Capability | Exerciser | Stedi Playground | JSONata Studio | saasquatch | JSON Crack | MapForce | elastic.io |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Modern UI | No | Yes | Yes | Partial | Yes | Partial | Yes |
| IntelliSense | No | Yes | Yes | No | N/A | N/A | No |
| AST Visualization | No | No | View-only | No | No | No | No |
| **Interactive AST Editing** | **No** | **No** | **No** | **No** | **No** | **No** | **No** |
| **Step-Through Debugging** | **No** | **No** | **No** | **No** | **No** | **No** | **No** |
| **Bidirectional Visual/Code Sync** | **No** | **No** | **No** | **No** | **No** | **No** | **No** |
| **Test Suite Builder** | **No** | **No** | **No** | **No** | **No** | **No** | **No** |
| **Performance Profiling** | **No** | **No** | **No** | **No** | **No** | **No** | **No** |
| **Expression Templates** | **No** | **No** | **No** | **No** | **No** | **No** | **No** |
| Drag-and-Drop Building | No | No | No | Partial | No | Yes (own lang) | No |
| Real-time Preview | Yes | Yes | Yes | No | N/A | Yes | Yes |
| Bindings Support | Yes | No | No | No | N/A | N/A | Yes |
| Embeddable Component | No | No | No | Yes | Yes | No | No |
| Schema-Aware | No | No | No | No | N/A | Yes | Partial |
| Collaborative Editing | No | No | No | No | No | No | No |

## User Personas

| Persona | Role | Skill Level | Primary Pain | Visionata Value | Willingness to Pay |
| --- | --- | --- | --- | --- | --- |
| Alex (Integration Engineer) | Senior Integration / Platform Engineer | High (writes JSONata daily) | 50+ line expressions become unreadable; no sub-expression testing; onboarding takes days | Professional IDE: structural navigation, independent component testing, regression suites | $15-30/mo individual, $50-100/seat/mo enterprise |
| Priya (Citizen Integrator) | Business Analyst / Operations Manager | Low-to-medium (understands JSON, cannot write JSONata) | Complete dependency on developers; days-long iteration cycles; fear of breaking things | Drag-and-drop builder for simple-to-moderate transformations without writing code | $10-20/mo |
| Marcus (Healthcare Data Architect) | Health IT Architect / FHIR Specialist | Medium-high (deep FHIR domain, moderate JSONata) | FHIR resources nested 10+ levels; HIPAA prohibits pasting data into hosted tools; mapping errors risk patient safety | Client-side-only architecture (data never leaves browser); visual debugging for deeply nested FHIR transforms | $50-100/mo individual, $200-500/seat/mo enterprise |
| Jordan (Platform Team Lead) | Engineering Manager | High (strategic, less hands-on) | No visibility into expression complexity; production incidents from untested changes; JSONata expertise is niche and hard to staff | Governance and quality layer: complexity scoring, regression testing, visual onboarding for new hires | $100-300/mo team license |

## Market Sizing

| Tier | Value | Rationale |
| --- | --- | --- |
| TAM | ~$2.5B | Lightweight JSON data transformation tooling market |
| SAM | ~$120M | Organizations actively using JSONata in production (Node-RED 1M+ installs, AWS Step Functions millions of users, Zendesk 100K+ customers, Grafana 20M+ users) |
| SOM | ~$3-8M ARR by Year 3 | Open-core model targeting integration engineers and platform teams; premium tiers for enterprise/healthcare |

### High-Intensity Verticals

| Industry | Use Case | JSONata Intensity |
| --- | --- | --- |
| Healthcare (HL7 FHIR) | FHIR resource mapping | Very High |
| Supply Chain / EDI | B2B document transformation (via Stedi) | Very High |
| E-commerce | Order/product data transformation | High |
| Fintech | Payment message mapping (ISO 20022) | High |
| IoT / Manufacturing | Sensor data normalization (via Node-RED) | High |

## Value Proposition

### Pains (what is broken today)

- No structural visibility -- expressions are flat text with no navigable hierarchy
- No component-level testing -- cannot test a sub-expression in isolation
- No regression testing -- expression changes break downstream consumers silently
- Syntax barrier for non-developers -- complete dependency on engineers for any transformation logic
- Data privacy concerns -- hosted tools violate HIPAA/SOC2 requirements for sensitive data
- Debugging is archaeological -- binary search by commenting out sub-expressions
- Knowledge silos -- JSONata expertise concentrated in 1-2 team members; onboarding takes days

### Gains (what Visionata enables)

- Structural clarity -- navigable AST graph reveals expression architecture at a glance
- Surgical debugging -- click any node, see its input and output in real time
- Confidence through testing -- regression suites run before deployment
- Democratized authoring -- drag-and-drop builder lets non-developers create transformations
- Zero-trust data handling -- fully client-side architecture; data never leaves the browser
- Living documentation -- the visual graph IS the documentation
- Team scalability -- visual onboarding reduces ramp-up from days to hours

## Competitive Moat

1. **AST-native visualization is hard to replicate casually.** Requires deep understanding of JSONata's parser internals and custom traversal/serialization beyond what jsonata-ui-core provides.
2. **Component-level testing is a novel concept for JSONata.** No existing tool offers sub-expression isolation testing or regression suites. This becomes the retention and monetization driver.
3. **Client-side-only architecture is a regulatory moat.** Healthcare (HIPAA), finance (SOC2), and government buyers cannot use hosted tools for sensitive data. Visionata's browser-only design eliminates this objection.
4. **Community-driven template library creates network effects.** User-contributed expression templates for common patterns (FHIR mapping, AWS Step Functions, Node-RED) compound the product's value over time.
5. **Embeddable widget creates platform lock-in.** Once Node-RED, Grafana, or iPaaS platforms embed Visionata, switching costs become structural.
6. **First-mover advantage in a greenfield niche.** Zero production-quality visual JSONata editors exist. The closest attempt (saasquatch) has 25 stars and is abandoned.

## Distribution Strategy

### Form Factor Sequence

1. **Standalone web app** -- MVP launch vehicle; fastest time-to-market
2. **VS Code extension** -- captures developer workflow; reuses core engine
3. **Embeddable web component** -- B2B play; platforms embed Visionata into their UIs

### Open-Source Strategy (Open-Core Model)

| Component | License |
| --- | --- |
| JSONata AST parser/visualizer | MIT |
| Live evaluation engine | MIT |
| Drag-and-drop builder | Source-available (BSL) |
| Test suite management | Proprietary (free tier) |
| Embeddable widget SDK | Commercial |

### Discovery Channels

| Tier | Channel | Action |
| --- | --- | --- |
| Tier 1 (highest leverage) | JSONata GitHub repo, Node-RED forums, AWS Step Functions docs/blogs | Open-source core gets referenced; answer questions with Visionata links |
| Tier 1 | npm ecosystem | Publish AST utilities as standalone MIT packages; funnel to full product |
| Tier 2 | Dev community (Reddit r/node, Hacker News, Dev.to) | Launch posts, demo videos, comparison articles |
| Tier 2 | Conference talks (NodeConf, AWS re:Invent, KubeCon) | Live demos of visual debugging |
| Tier 3 | SEO content | "JSONata tutorial", "JSONata debugger", "JSONata visual editor" keyword pages |
| Tier 3 | Platform partnerships | Embed in Node-RED, Grafana, Prismatic; co-marketing |

## Sources

### JSONata Core and Ecosystem

- [JSONata GitHub](https://github.com/jsonata-js/jsonata)
- [JSONata npm](https://www.npmjs.com/package/jsonata)
- [JSONata npm trends](https://npmtrends.com/jsonata)
- [JSONata Documentation](https://docs.jsonata.org/)
- [Language Server Issue #331](https://github.com/jsonata-js/jsonata/issues/331)
- [Stedi Prettier Plugin](https://github.com/Stedi/prettier-plugin-jsonata)
- [jsonata-code-completion (Monaco)](https://github.com/Allam76/jsonata-code-completion)

### JSONata-Specific Tools

- [JSONata Exerciser](https://try.jsonata.org/) | [GitHub](https://github.com/jsonata-js/jsonata-exerciser)
- [Stedi JSONata Playground](https://www.stedi.com/jsonata/playground)
- [Stedi Mappings UI](https://www.stedi.com/docs/edi-platform/mappings/manage-mappings/ui-guide)
- [JSONata Studio](https://jsonatastudio.com/) | [AST Explorer](https://jsonatastudio.com/ast-explorer)
- [saasquatch/jsonata-visual-editor](https://github.com/saasquatch/jsonata-visual-editor)
- [saasquatch/jsonata-ui-core](https://github.com/saasquatch/jsonata-ui-core)

### Platform Adopters

- [AWS Step Functions JSONata](https://aws.amazon.com/blogs/compute/simplifying-developer-experience-with-variables-and-jsonata-in-aws-step-functions/)
- [Node-RED JSONata](https://stevesnoderedguide.com/node-red-and-jsonata-for-beginners)
- [Zendesk JSONata for AI Agents](https://support.zendesk.com/hc/en-us/articles/8357756877466-Using-JSONata-with-advanced-AI-agents)
- [Grafana JSON Datasource JSONata](https://grafana.com/docs/plugins/marcusolsson-json-datasource/latest/jsonata/)
- [elastic.io JSONata Mapper](https://docs.elastic.io/guides/mapping-data.html)
- [Tray.io JSON Transformer](https://tray.io/documentation/connectors/core/json-transformer/)
- [Prismatic JSONata Component](https://prismatic.io/docs/components/jsonata/)
- [Cisco Observability Platform](https://developer.cisco.com/docs/cisco-observability-platform/platform-functions/)
- [OutSystems JSONata](https://www.outsystems.com/forge/component-overview/18601/jsonata-odc)

### Adjacent and Inspirational Tools

- [JSON Crack](https://jsoncrack.com/) | [GitHub](https://github.com/AykutSarac/jsoncrack.com)
- [Altova MapForce](https://www.altova.com/mapforce)
- [WSO2 Visual Data Mapper](https://wso2.com/blogs/thesource/introducing-choreo-visual-data-mapper)
- [Itential JST Designer](https://www.itential.com/developer-tools/jst-designer/)
- [React Flow / xyflow](https://reactflow.dev/) | [GitHub](https://github.com/xyflow/xyflow)
- [Rete.js](https://retejs.org/) | [GitHub](https://github.com/retejs/rete)
- [Node-RED](https://nodered.org/)
- [n8n](https://n8n.io/)
- [JointJS AST Visualizer](https://www.jointjs.com/demos/abstract-syntax-tree)

### Comparisons and Analysis

- [JQ vs. JSONata Compared](https://dashjoin.medium.com/jq-vs-jsonata-language-and-tooling-compared-5f0f7acc778e)
- [JSONata, JSONPath, JMESPath Compared](https://medium.com/@khileshsahu2007/jsonata-jsonpath-and-jmespath-exploring-capabilities-and-limitations-bf491348022d)
- [npm Trends: JSONata vs alternatives](https://npmtrends.com/JSONPath-vs-jq-vs-jsonata-vs-jsonpath-vs-jsonpath-plus)
- [The JSONata Performance Dilemma (NearForm)](https://nearform.com/insights/the-jsonata-performance-dilemma/)

### Testing

- [Unit Testing JSONata with Jest (Blues)](https://dev.blues.io/blog/testing-jsonata-notehub-jest-javascript/)
- [Unit Testing JSONata in AWS Step Functions (Cevo)](https://cevo.com.au/post/unit-testing-jsonata-in-aws-step-functions/)
- [Step Functions JSONata (SSENSE)](https://medium.com/ssense-tech/step-functions-in-2025-simplify-your-development-with-jsonata-1590b6c439d3)
