# Security policy

## Architecture

Visionata processes all data locally in your browser. No user data is transmitted to any server. All JSONata parsing, evaluation, and visualization happens entirely client-side.

This architecture may simplify compliance with data residency requirements — consult your compliance team for specific guidance.

## Supported versions

Security fixes target the latest release of jsonata-viz. Older tags are not
routinely patched unless a fix is trivial to backport.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/Dhi13man/jsonata-viz/security/advisories/new)
when it is enabled. Otherwise email <furyx.ds@gmail.com>.

Do not disclose suspected vulnerabilities in public issues, discussions, or
pull requests.

Include the affected version or commit, impact, reproduction steps, and any
suggested mitigation. Remove credentials, tokens, account identifiers, and
personal data from the report.

You should receive an acknowledgement within 7 days. Confirmed critical and
high severity issues are prioritized for remediation within 30 days; lower
severity issues are scheduled according to risk.

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
