# Registrix implementation audit

Verified on 13 October 2026. This document distinguishes local automated evidence from hosted and physical-device checks.

## Automated evidence

- 45 unit tests passed: grading boundaries and precision, catalog extraction, validation, immutable mutation recovery, draft version provenance and auth lifecycle.
- Nine PostgreSQL suites passed against isolated PostgreSQL 18: access, foundation, grades, mutations, platform permissions, records, security, subjects and replay scope. Cross-language grading vectors and concurrent write/replay checks also passed.
- TypeScript, production build, 24 local artwork/license files and the deployable bundle scan passed. No service key, password, SMTP credential, legacy MDB or browser fixture is included in the build.
- All nine Playwright CLI suites passed: auth, records, mutation recovery, teacher restrictions, grading, administration, responsive layouts, resilience and final-review regressions. Tests use synthetic Auth and actual local SQL APIs, with no live email sends or hosted test records.
- Responsive assertions cover desktop, tablet, 390px and 360px screens, long names, broken assets, navigation, touch targets, dialogs, reduced motion and empty/error/offline states. Desktop and mobile screenshots were visually inspected. Evidence is delivered separately.

## Hosted checks

The dedicated Registrix database contains 398 confirmed catalog entries. All ten application tables have RLS. Catalog constraints, permission-aware receipt recovery and provider-function permission hardening were applied after the owner's initial setup. The hosted security advisor reports no issues.

The owner's supplied initial account was found confirmed, granted administrator membership using the guarded first-admin script, and verified with a boolean database query. No password or privileged frontend credential was requested. The owner's browser sign-in and actual SMTP resend/recovery remain owner-driven checks; synthetic test success does not prove their delivery.

## Differences from the design/source

Studio Campus typography, violet accents, ivory cards, original artwork and responsive navigation are retained. The overview uses a real-data summary and preparation checklist rather than the prototype's decorative grading queue. Actual class/student data, empty states, pending approvals and scope restrictions replace illustrated records. Production email authentication replaces simulated access. Archive/restore replaces permanent deletion. The six-score General Average, classification rounding and numerical equivalent are automatic and independently computed by the server.

The unsupported source scope `BSED END` is withheld instead of silently relabeled. Nine catalog findings require curriculum confirmation; see docs/catalog-review.md. No legacy database or real student data was imported. System fonts are used without redistributing font binaries.

## Remaining limits

Physical iOS/Safari, production HTTPS redirects, provider rate limits and final hosting have not been established by the local CLI audit. This work prepares hosting files but does not publish Registrix. One transaction lock deliberately serializes mutations; partitioning it is a future scale improvement. The grade policy reflects the approved recovered source, not an institutional certification.

The fresh reviewer found no Critical issues and four Important client issues. All four were reproduced and fixed in one pass, followed by the complete passing suite. Mixed-score cross-language vector expansion remains a deferred minor; the browser exercises a mixed six-score average, but the SQL comparison generator uses uniform-score boundary vectors. See docs/final-review.md and docs/implementation-decisions.md.
