# Security Policy

## Architecture

Visionata processes all data locally in your browser. No user data is transmitted to any server. All JSONata parsing, evaluation, and visualization happens entirely client-side.

This architecture may simplify compliance with data residency requirements — consult your compliance team for specific guidance.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email: <security@visionata.dev> (or use GitHub's private vulnerability reporting)
3. Include a description of the vulnerability and steps to reproduce
4. We will acknowledge receipt within 48 hours
5. We will provide an initial assessment within 7 days

## Scope

Since Visionata is a fully client-side application, the primary attack vectors are:

- **XSS via shared URLs**: Expression or JSON data encoded in URLs could contain malicious content
- **JSONata evaluation DoS**: Crafted expressions could cause excessive computation
- **Dependency vulnerabilities**: Third-party npm packages

## Mitigations

- JSONata evaluation runs in a dedicated Web Worker with a 5-second timeout
- The `$eval` binding is disabled to prevent dynamic code execution from shared URLs
- Content Security Policy headers restrict script and resource loading
- All user content is rendered as text, never as HTML
