# Database contracts

Record reads use RLS and narrow scoped RPCs. Browser roles have no direct insert, update or delete grants. Private helpers implement transactions with verified membership checks, version checks and actor-bound receipts; exposed wrappers are invoker functions with an empty search path. Metadata creates only an unprivileged pending profile.

One identity may have multiple enrollments. Grades belong to the enrollment UUID. Student archive takes precedence for active views without rewriting enrollment archive flags. Every table has RLS, including private membership, assignment, audit and receipt tables. No password or password-bearing legacy login history is imported.

School years must be consecutive (2000–2199 start years); no restriction to the obsolete original selector. Subjects retain course/year/semester scope. Source catalog conflicts are excluded and documented separately.

The server calculation accepts only six numeric or null scores; browser results are never accepted. Equal-period averaging uses PostgreSQL numeric and half-up rounding directly from the raw mean. Decimal strings preserve display precision. See grade-policy.md for policy and thresholds.
