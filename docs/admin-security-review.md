# Admin dashboard and security review — 25 September 2026

## Admin interface

The student dashboard is unchanged. The admin learner directory retains its dark theme, with brighter text, blue accents, larger labels and touch targets. Small screens use learner cards; laptop tables prioritize names, courses, progress, status, and actions. Email and evidence remain available in the details panel. The mobile review panel fills the screen and keeps its close button accessible.

Browser checks used the existing sample-data preview, never live learner records. Checked search, empty results, course filters, review feedback, and a request for changes. Checked 320, 390, 768, 1024, and 1440 pixel widths without page-level horizontal overflow. The tested mobile directory/detail view had no text contrast failures below 4.5:1 across 91 rendered text elements (disabled controls excluded). This is a targeted check, not a complete accessibility certification.

## Security changes

- Limit authenticated platform JSON to 64 KiB while streaming, including requests without Content-Length. Invalid encoding, malformed JSON, and excessive nesting return a safe validation error.
- Add private/no-store cache policy to platform and file responses, including handled authorization errors.
- Reject malformed/non-ASCII private-download signatures with a controlled denial rather than a server error.
- Add browser headers to prevent framing, content-type sniffing, embedded objects, and unwanted base-URL changes. Reduce cross-origin referrer disclosure. These are baseline protections, not a full script-restricting CSP.
- Keep the drawer's keyboard focus loop on visible controls; hidden mobile resize controls no longer receive focus.

## Validation

- 45 backend tests passed, including token verification, server-controlled roles, disabled accounts, student record isolation, authorization, SQL parameterization, ownership, and private-file checks.
- Frontend state checks and PostgreSQL schema/integrity checks passed.
- JavaScript syntax/type check and production build passed.
- `npm audit --omit=dev`: no reported vulnerabilities.
- All 43 versions in the Python dependency lockfile checked against PyPI's version-specific vulnerability records: no reported vulnerabilities and no lookup errors. The reusable script is `scripts/audit-python-dependencies.py`; results are in `docs/python-dependency-audit.json`. This scan describes the lockfile, not packages independently installed in production.

## Scope and remaining operational checks

No production database, user permissions, or hosting settings were changed. Changes need a frontend and backend deployment to reach the live website. Production Clerk/Neon/Railway/Vercel configuration and live authenticated flows were not independently audited. Public analytics and verification endpoints have no application-level rate limiting in this repository; verify edge rate limits before treating the deployment as protected against automated abuse. Upload validation checks size and file signatures, not malware content.
