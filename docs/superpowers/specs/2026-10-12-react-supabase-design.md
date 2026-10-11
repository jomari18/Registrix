# Registrix React and Supabase conversion

## Purpose and agreed direction

Build the fifth portfolio project: an independent student records and grading web application named Registrix. Replace the recovered C# Windows Forms/Access implementation with React and Supabase. Match the supplied Studio Campus design, original Registrix artwork, and responsive layouts. The user requested automatic General Average computation and a bundled, continuous implementation workflow rather than repeated feature-by-feature questions.

This document makes proposed defaults explicit for review. It does not claim to reproduce an official school's grading policy. No St. Clare branding, real student records, legacy passwords, or Access database contents will be published.

## References and scope

- Original source: `D:/Downloads/StudentRecords-Recovery.zip`, inspected as source text; do not execute or import its MDB.
- Design: `Registrix-Studio-Campus-Design.zip`, extracted `preview/`, `designs/`, `docs/design-tokens.json`, `docs/source-map.md`.
- Assets: original distributable SVG logo, wordmark, illustration and icons, with supplied license. Native system fonts; no new font dependency required.
- Screens: login, registration, email verification/resend, password recovery/reset, dashboard, students, student details/add/edit/archive, classes and rosters, grading sheet and grade entry, staff account approval, help/about, logout and unsaved-change confirmations.
- No native Android/iOS app, student self-service portal, attendance, payment system, multi-school tenancy, official transcript export, or automatic publication in this conversion. Mobile web remains supported.

## Technology and isolation

React, TypeScript, Vite, React Router, Supabase JavaScript client, plain CSS tokens, Vitest and Playwright CLI. Pin compatible package versions and lockfile after checking current releases. Use Node 24. Prefer existing simple patterns and supplied assets over new dependencies.

Keep Registrix in its own repository inside the existing folder, preserving design packages and the original source archive. Never stage or reset the parent portfolio's existing changes. Use a separate Supabase project; do not reuse restaurant or MediSched tables, users or credentials. Local build and automated tests must not depend on real hosted accounts. Production credentials and service secrets stay out of Git and frontend builds.

## Access and authentication

- Supabase Auth owns passwords and email verification. Registration fields: full name, descriptive position, username, email, password and confirmation. Username is a profile identifier; sign-in uses email/password explicitly. No username-to-email public lookup endpoint.
- Newly registered verified accounts have pending access and see only their own profile/access state. Registration cannot grant a role.
- Administrator: approve/reject/revoke staff access and assign teacher/registrar roles; manages all records, classes, grades and assignments.
- Registrar: manages students, subject/class records, enrollments and grading; cannot grant administrator privileges or manage staff access.
- Teacher: reads assigned class rosters and enters grades only for assigned classes. Cannot edit student identity, archive students or manage staff accounts.
- Bootstrap the first administrator through reviewed manual SQL for an explicitly selected verified account. Membership is private database state, never writable profile/user metadata.
- Enforce scope on every database read/write, including detail URLs and mutation APIs. Revoked membership loses access on the next request and the UI refreshes its access state. Pending/inactive accounts cannot read dashboard statistics, catalog or student data.
- Auth pages support verification failures, expiry, resend cooldown, login errors and recovery. Recovery links use an exact allowed HTTPS callback; neither tokens nor passwords enter logs. Keep user-entered drafts during ordinary same-user token refresh; clear private state on sign-out/account change.

## Record model and behavior

Use stable UUID identities, not names or display student numbers, for updates.

- `profiles`: Auth ID, display name, unique username, descriptive position, timestamps. No password column.
- Private `staff_memberships`: Auth ID, approved role, active/rejected/pending state, approved-by and timestamps. Separate assignments connect active teachers to classes.
- `students`: unique student number, surname, first name, middle initial, gender, archive state, version and timestamps. Duplicate names are permitted; numbers are unique after trimming/case normalization.
- `subjects`: source-backed code, description, units, course/year/semester catalog selections and active state. Validate recovered mappings before importing; catalog contradictions must be listed rather than silently discarded.
- `classes`: subject, course, year level, section, semester, school year, active/archive state and version. Unique academic group across those fields. Year 1–4; sections A–J; first/second/summer terms; eight source courses retained. School years support later valid consecutive-year pairs beyond the legacy fixed list.
- `enrollments`: student and class IDs, unique pair, active/archive state and version. One student can enroll in multiple subjects/terms. Student details show their enrollments; the create workflow can add the initial class enrollment.
- `grades`: one row per enrollment, six nullable scores, server-calculated result, version and timestamps. An update affects exactly that enrollment, never every subject belonging to the student.
- Private audit events: actor, action, entity reference, timestamp and minimal change summary, without passwords or tokens. Approved administrators/registrars can see relevant activity; teachers only activity for their permitted classes.

Archive replaces irreversible deletion in normal UI. A student archive action clearly explains that related enrollments leave active lists and are retained for recovery/audit. Enrollment removal affects only that enrollment. Administrators/registrars can inspect archived records and restore them. Restrict class/catalog archival when it would invalidate active grading; preserve historical snapshots/references. No frontend hard-delete API.

Teacher-facing rosters expose only the needed student fields for assigned classes. Derived dashboard counts and completion metrics use permitted real records, not prototype numbers. Seed data is fictional and clearly labeled; do not import supplied MDB data. Help/About describe the actual implemented flows and independent portfolio purpose.

## Automatic General Average computation

Periods: Monthly, First prelim, Second prelim, Midterm, Pre-final, Final.

`rawAverage = (monthly + firstPrelim + secondPrelim + midterm + preFinal + final) / 6`

- Each supplied score must be finite, from 0 through 100 inclusive, with at most two decimal places. Empty input is null, never zero. Explicit zero remains valid.
- Update the preview immediately after a valid edit. Partial grades may be saved as drafts, with an Incomplete status and no final average, numerical equivalent or Passed/Failed result.
- When all six scores exist, compute the raw equal-period mean using decimal-safe arithmetic. Display the General Average rounded half-up to two decimals.
- Proposed conversion rule: round the raw mean half-up to one decimal **only for classification**, then apply descending lower thresholds. This removes the legacy gaps and overlap without changing its six-period weighting.

| Classification average | Numerical equivalent | Remarks |
| --- | --- | --- |
| >=96.5 | 1.00 | Passed |
| >=93.5 | 1.25 | Passed |
| >=90.5 | 1.50 | Passed |
| >=87.5 | 1.75 | Passed |
| >=84.5 | 2.00 | Passed |
| >=81.5 | 2.25 | Passed |
| >=78.5 | 2.50 | Passed |
| >=75.5 | 2.75 | Passed |
| >=74.5 | 3.00 | Passed |
| <74.5 | 5.00 | Failed |

Examples: 88,90,91,89,92,90 -> 90.00, 1.75, Passed. Six scores of 96.45 -> 96.45 displayed, classification 96.5 -> 1.00. Six scores of 74.44 -> 74.44 displayed, classification 74.4 -> 5.00. Six scores of 74.45 -> 74.45 displayed, classification 74.5 -> 3.00.

Show concise calculation help explaining the mean and classification rounding. Use the label General Average; do not imply a units-weighted cross-subject GWA. Subject units remain visible academic metadata. Do not average numerical equivalents across subjects as a new feature.

Supabase independently validates all six values and computes saved results. Reject forged client result fields. Use transactional version-checked saves; two concurrent edits yield an explicit conflict rather than silent overwriting. UI and SQL tests must agree at every threshold, zero/100, partial entries, invalid precision and representative decimal gaps. Mutation results include authoritative saved grades and updated version.

## Database and mutation contracts

Tables have RLS and least-privilege grants. Keep privileged helpers in a non-exposed private schema; review every security-definer helper for caller identity, approved role and teacher assignment. Do not expose a general SQL or service-role endpoint. Standard customer/staff browser requests use only the publishable key and authenticated session.

Use typed results with stable codes for validation, denied access, not found, stale version and retryable service failure. Include explicit action IDs for important mutations and owner-bound receipts for safe replay after ambiguous responses. Do not automatically resubmit changed drafts after a timeout. Return a confirmed saved result, recover the same action, or retain its immutable request for a deliberate retry. Apply audit changes in the same transaction as the mutation.

Menus are database-backed; source catalog constants are import/reference data, not a competing authoritative store. Paginate searches and sort consistently. Index role/assignment and student/enrollment predicates. Avoid returning full private tables to populate one screen. Grade metrics distinguish complete, incomplete and archived enrollments.

## UI requirements

Match Studio Campus: canvas #F7F4EF, white surfaces, text #292334, violet #7043A0, borders #E1D9E5, supplied serif headings/system sans-serif body, rounded cards and restrained shadows. Preserve the supplied navigation, icons, spacing and comfortable controls.

Remove the prototype toolbar, fake OTP, sample session and simulation selectors from the production app. Replace mock names/counts with real data and useful empty states. Keep demo branding clear without leaving implementation warnings in every product screen. Permissions hide unavailable actions but database checks remain authoritative.

Responsive behavior: desktop above 1100px, tablet 761–1100px, mobile at most 760px, compact phones at most 420px. Grade tables keep identifiable row headers and horizontal scrolling on desktop/tablet; mobile offers readable period cards and the two-column entry form. Avoid whole-page horizontal overflow. Minimum controls 44px; mobile navigation targets 48px. Use labeled forms, keyboard focus, accessible error/status messages and focus-managed confirmations. Prompt for unsaved changes; do not silently discard a grade draft.

## Verification and delivery

1. Domain unit tests for every conversion boundary, decimal rounding, null versus zero, validation and class identity.
2. Disposable local PostgreSQL tests for RLS, pending/revoked access, role forgery, unassigned teacher denial, independent subject updates, transactional audit, stale version conflicts and identical action replay.
3. Browser fixtures for auth states, registration pending access, student CRUD/archive/restore, subject/class enrollment, immediate grade preview and persistence, staff approval views and unsaved-edit handling.
4. Playwright CLI desktop/tablet/mobile visual and interaction checks, including long names, empty data, keyboard forms and wide grade sheets. Clearly distinguish fixtures from hosted verification.
5. Build/typecheck, asset provenance check and source/bundle checks excluding secrets, school graphics, original MDB and real personal data.
6. README, schema/role/grade-policy documentation, setup SQL, original assets, source ZIP and production web build ZIP. Hosted setup requires a dedicated project; request its connection separately while continuing independent local work. Do not claim hosted auth works until verified. GitHub/Netlify publication waits for a later explicit deploy instruction.

Physical Safari/device behavior is separate from responsive browser testing. The existing design archive and legacy source remain preserved throughout.

## Review status

The user approved React/Supabase, Registrix branding, Studio Campus implementation direction, bundled workflow, and automatic General Average computation. Proposed architectural defaults above, particularly one-decimal classification rounding and role/approval rules, are now concrete for review. Implementation starts after review of this written spec and the subsequent bundled implementation plan.
