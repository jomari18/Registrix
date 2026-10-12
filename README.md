# Registrix

[Live application](https://registrix.netlify.app/)

React + TypeScript + Supabase conversion of a recovered desktop student-record project, using the supplied Studio Campus design and original Registrix branding.

## Run locally

Use Node.js 24 or later. Run `npm ci`, copy `.env.example` to `.env.local`, and fill in the **dedicated Registrix** Supabase Project URL and publishable key. Run `npm run dev`, then open http://127.0.0.1:5190. Never put a service-role key, database password or SMTP credential in a frontend environment variable.

Database/auth setup: [docs/supabase-setup.md](docs/supabase-setup.md). Automatic calculation and thresholds: [docs/grade-policy.md](docs/grade-policy.md). Source catalog findings: [docs/catalog-review.md](docs/catalog-review.md).

## Workflows

- Email/password sign-in, registration, verification/resend, password recovery/reset and sign-out.
- Verified registrations stay pending until an administrator approves staff access.
- Administrators approve/reject/revoke accounts and assign teachers to classes. Registrars manage academic records. Teachers read and grade only assigned classes.
- One student identity may have multiple class enrollments. Each enrollment owns its six grading scores and server-calculated result.
- General Average computes automatically. Partial scores remain Incomplete; empty values stay null and zero remains valid. No unit weighting is inferred.
- Archive/restore preserves history. Stale edits are rejected, and unknown save outcomes recover an immutable, actor-bound action instead of creating duplicates.
- Responsive desktop/tablet/mobile web interface, original local artwork, accessible labels, dialogs and keyboard controls.

## Checks

`npm test`, `npm run typecheck`, `npm run build`, `npm run check:assets`, `npm run check:bundle`.

Database regressions use a disposable PostgreSQL 17+ cluster only on **127.0.0.1:55444**, database/user `registrix_test`. On this Windows workstation run `tools/start-test-db.ps1`, then `npm run test:db`. They refuse hosted targets and reset only the isolated synthetic database. The test suite creates mock Auth tables; it does not authenticate hosted users.

Install the Playwright CLI separately and set `PLAYWRIGHT_CLI` if needed. `npm run test:browser` starts its synthetic Auth adapter on 55445 and Vite audit preview on 5192, exercises real local SQL RPCs, checks CLI error markers, saves evidence to `outputs/audit`, and stops its own servers. Ports must be free. Your normal 5190 workspace stays configured for the dedicated hosted project.

## Build and hosting

`npm run build` creates `dist`. Netlify configuration includes SPA redirects and security headers; configure the two publishable environment values in your own deployment. Update Supabase Site URL/redirect allowlist for the final HTTPS domain. This conversion does not automatically publish, push or deploy Registrix.

Assets/license: [docs/asset-manifest.md](docs/asset-manifest.md). Verification and limitations: [AUDIT.md](AUDIT.md). No legacy MDB, real student records, old passwords, school artwork, SMTP settings or privileged credentials are delivered. Optional demo SQL is explicitly fictional and separate from normal setup. Registrix is an independent academic portfolio project, not an official institution system.
