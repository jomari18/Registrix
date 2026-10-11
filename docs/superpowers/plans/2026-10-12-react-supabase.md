# Registrix React and Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Implement inline in this chat, then obtain one fresh final review.

**Goal:** Deliver a working Studio Campus student records application with approved staff access, class-scoped grading and automatic General Average computation.

**Architecture:** React views consume typed authenticated Supabase APIs. PostgreSQL enforces membership, teacher assignments, grade calculations and transactional mutation receipts. Client calculations provide immediate previews; saved results always come from the database. Isolated local database/browser fixtures support repeatable tests without production accounts or records.

**Tech Stack:** Node 24, React, TypeScript, Vite, React Router, Supabase JS, plain CSS/SVG, Vitest, PostgreSQL and Playwright CLI. Pin compatible versions and lockfile after verifying current releases.

**Spec:** `docs/superpowers/specs/2026-10-12-react-supabase-design.md` (approved by the user).

## Global Constraints

- Independent Registrix repository; preserve the supplied design packages and original ZIP. Do not touch parent portfolio staged changes or other apps' databases.
- Separate Supabase project; no legacy MDB import, original passwords, real student data, St. Clare artwork, service secrets or tokens in Git/builds/logs.
- Six periods: Monthly, First prelim, Second prelim, Midterm, Pre-final, Final. Equal-period mean, not a units-weighted GWA.
- Scores 0–100 inclusive, at most two decimals; empty is null. Partial grades have no final result. Display mean rounded half-up to two decimals; classify the raw mean rounded half-up to one decimal using the approved thresholds.
- Pending verified registration cannot access student data. Administrator manages access; registrar manages records; teacher grades assigned classes only. Membership is private database state.
- Stable UUID student/class/enrollment identity; archives instead of frontend hard deletes. Grade saves are version-checked and results independently calculated in SQL.
- Studio Campus palette, supplied assets/system fonts, desktop >1100px, tablet 761–1100px, mobile ≤760px, compact ≤420px. Controls ≥44px, mobile navigation ≥48px.
- Playwright CLI is required for browser verification. Mark synthetic fixtures separately from hosted/device evidence.
- No Android/iOS build, attendance, payments, official transcripts or publication in this implementation. Any later GitHub/Netlify deployment needs a user request.

## Review Focus

1. Decimal halfway means must classify identically in TypeScript and PostgreSQL; test 96.45/74.45, all thresholds and mixed six-score means in tasks 1/3.
2. One student in multiple subjects must retain independent grades and enrollment archive state; test duplicate names, two terms and two subjects in tasks 4/8/9.
3. Access revoked while a form is open must deny its next save and clear inaccessible data; test role changes and teacher assignment removal in tasks 4/6/9.
4. Network loss after a successful save must replay the immutable request without duplicating audit events or overwriting a newer draft; test receipts and UI recovery in tasks 4/7/9.
5. Long names/catalog descriptions, small screens and keyboard-only use must remain readable without page overflow or lost focus/drafts; test in tasks 7/8/9/11.

## File boundaries and shared contracts

- `src/domain/contracts.ts`: `Role = 'administrator'|'registrar'|'teacher'`, `AccessState`, UUID strings, six-field `GradeScores`, entity/version types, paginated query inputs and `ApiResult<T> = {ok:true,data:T}|{ok:false,code:string,message:string}`.
- `GradeScores`: `{monthly:number|null,firstPrelim:number|null,secondPrelim:number|null,midterm:number|null,preFinal:number|null,final:number|null}`.
- `GradeResult`: `{status:'incomplete'|'complete',generalAverage:string|null,classificationAverage:string|null,numericalEquivalent:string|null,remarks:'Passed'|'Failed'|null}`; decimal display fields are fixed-format strings.
- `src/domain/grades.ts`: `parseScore(text:string):ApiResult<number|null>` and `computeGrade(scores:GradeScores):ApiResult<GradeResult>`.
- `src/lib/client.ts`, `src/lib/api.ts`: configured Supabase client and `rpc<T>(name:string,request:unknown):Promise<ApiResult<T>>`; missing configuration produces an explicit setup state, never a fake logged-in session.
- `src/features/*/api.ts`: feature-specific typed query/mutation adapters; React pages do not assemble SQL-like filters or role logic.
- Mutations use `MutationRequest<T> = {actionId:string,expectedVersion:number|null,payload:T}`. Public RPCs accept `p_request jsonb`; responses use the same `ApiResult` envelope. Receipt lookup accepts only `actionId` and is bound to `auth.uid()`.
- SQL migration filenames must be created via `supabase migration new` at execution, not guessed in this plan. Private schema name: `registrix_private`.
- `tools/test-db.mjs`, `tools/browser-fixture-server.mjs`, `tools/browser-audit.mjs`: disposable PG on 55444, local fixtures on 55445 and CLI browser session `registrix-audit`. Vite runs on loopback port 5190. Fixture startup refuses any non-loopback database target.
- `public/assets/`: supplied original artwork and license; `docs/catalog-review.md`, `docs/grade-policy.md`, `AUDIT.md`: provenance and verification, not runtime configuration.

## Task 1: Decimal-safe grading domain and testable application foundation

**Files:** create `package.json`, lockfile, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `.env.example`, `src/main.tsx`, `src/app/App.tsx`, `src/domain/contracts.ts`, `src/domain/grades.ts`, `tests/unit/grades.test.ts`.

**Interfaces:** produces the shared contracts and `parseScore`/`computeGrade` above. App startup is a configuration-aware shell, not prototype state.

- [ ] Check current compatible dependency versions, pin them and configure `dev`, `build`, `typecheck`, `test`, `test:db`, `test:browser`, `check:assets`, `check:bundle` scripts. Ignore environment files, original archives, local tools/data, preview screenshots and generated output; preserve them on disk.
- [ ] Write `grades.test.ts`: six scores 88,90,91,89,92,90 → 90.00/90.0/1.75/Passed; six 96.45 → 96.45/96.5/1.00; six 74.44 → Failed/5.00; six 74.45 → Passed/3.00. Null returns incomplete; six zeroes give 0.00/5.00; six hundreds give 100.00/1.00. Reject -0.01,100.01,NaN,Infinity,three decimals and nonnumeric text. `parseScore('')` is null and `parseScore('0')` is zero. Parameterize every threshold just below/at/above classification and mixed-score ties.
- [ ] Run `npm.cmd test -- tests/unit/grades.test.ts`; verify tests fail before implementation.
- [ ] Implement decimal-safe integer hundredths arithmetic; derive two- and one-decimal half-up rounding directly from the sum divided by six, without chaining rounded values. Descending thresholds implement the spec exactly.
- [ ] Run the unit file, `npm.cmd run typecheck`, and `npm.cmd run build`; record results and commit the foundation/domain files only.

## Task 2: Source catalog extraction and provenance

**Files:** create `tools/extract-catalog.mjs`, `data/catalog.json`, `tests/unit/catalog.test.ts`, `docs/catalog-review.md`; read original archive/source and `preview/source-catalog.js` without evaluating their scripts.

**Interfaces:** produces typed source entries `{code,description,units,course,yearLevel,semester}` plus an explicit conflict/missing mapping report consumed by database seed and class selectors.

- [ ] Test that course/year/semester selections contain known source BSCS examples, every offered subject resolves to code/description/units, units are valid numeric values and no original student/account data or school image is copied. Test duplicate code with conflicting description/units is reported rather than silently overwritten.
- [ ] Observe failing tests, then parse source text/JSON as data. Cross-check the prototype's reported 402 descriptions and 65 groups against the original C# mappings. Import unambiguous source entries; document any held-out/conflicting entries and their source locations.
- [ ] Run catalog tests and check catalog JSON contains no passwords/emails/real names. Commit catalog extraction/data/report; no MDB inspection/import.

## Task 3: Database foundation, role predicates and authoritative calculations

**Files:** create CLI-generated foundation migration, `tests/postgres/bootstrap.sql`, `tests/postgres/foundation.sql`, `tests/postgres/grades.sql`, `tools/test-db.mjs`, `docs/database-contracts.md`.

**Interfaces:** tables from the spec; private access predicates `current_role()`, `can_manage_records()`, `can_access_class(uuid)`. Public `get_my_access()` returns own approval/role/profile. Private `calculate_grade(jsonb)` returns the shared result fields.

- [ ] Start an isolated local PostgreSQL test database only. Bootstrap synthetic `auth.users`, `auth.uid()` and roles needed for tests; refuse to reset hosted databases.
- [ ] Write SQL regressions for null/zero, malformed fields/precision, the TypeScript boundary vector set, student number uniqueness with case/whitespace normalization, duplicate-name acceptance, unique enrollment pairs and consecutive school years.
- [ ] Run `npm.cmd run test:db -- foundation grades`; observe missing-schema/function failures.
- [ ] Create profiles, students, subjects, classes, enrollments and grades with required constraints/versions/indexes. Create private memberships, assignments, receipts and audit tables. Auth profile trigger only creates an unprivileged pending profile and validates public metadata. Enable RLS on every table and explicitly revoke defaults before granting narrow access.
- [ ] Implement SQL numeric calculation with the same half-up classification policy, server-computed results and no writable result columns for browser callers. Use private privileged helpers only where needed with a fixed empty search path and fully qualified objects.
- [ ] Verify all boundary vectors match the TypeScript results, pending/anon cannot query records, and no profile metadata creates staff privileges. Commit schema/tests/contracts.

## Task 4: Secure transactional record, grading and access APIs

**Files:** create CLI-generated API migration, `tests/postgres/records.sql`, `tests/postgres/access.sql`, `tests/postgres/mutations.sql`, `tests/postgres/concurrency.mjs`, `supabase/seed.sql`, `docs/admin-access.sql`.

**Interfaces:** read RPCs `get_dashboard`, `list_students`, `get_student`, `list_catalog`, `list_classes`, `get_class`, `get_grade_sheet`, `get_grade`, `list_staff`, `get_recent_activity`; mutation RPCs `save_student`, `set_student_archived`, `save_class`, `set_class_archived`, `save_enrollment`, `set_enrollment_archived`, `save_grades`, `review_staff_access`, `set_teacher_assignment`, `find_my_action`. All except `get_my_access()` accept `p_request jsonb` and return the shared envelope. List RPCs return `{items,total,page,pageSize}`, default20/max100, stable name/UUID sorting. Reads return scoped entities, never whole-table dumps.

- [ ] Write denied-access tests for anon, pending/rejected/revoked membership, forged metadata/role, unassigned teacher, another staff member's receipt and guessed detail UUIDs. Registrars cannot approve/promote staff. Teachers cannot create/archive students or classes.
- [ ] Write records tests for a student enrolled in two subjects/terms: grade update or enrollment archive affects only its UUID. Student archive removes its enrollments from active screens without destroying grade history; restore recovers prior enrollment archive distinctions. Deny class/subject archive with active enrollments. Grade preview values sent as client result fields are rejected.
- [ ] Write mutation tests: stale expectedVersion gives `VERSION_CONFLICT` without update/audit; identical actor/action replay returns original result; changed payload with the same actionId gives `ACTION_CONFLICT`; simultaneous saves allow only one winner. Every successful mutation writes one audit event in its transaction. Revocation/assignment removal denies the next write. Prevent self-demotion/revocation of the final active administrator.
- [ ] Observe failures; implement explicit role checks and version-checked writes behind private helpers. Lock affected rows in a stable order, secure receipt replay by actor and payload, and rollback audit/receipt with failed mutation.
- [ ] Add source catalog seed and a separate opt-in fictional demo seed. Manual first-admin grant uses a verified email placeholder guard; never runs as an app endpoint. Document archive precedence and recovery behavior.
- [ ] Run all database/concurrency regressions; commit API/security deliverable and seed documentation.

## Task 5: Studio Campus shell, assets and navigation

**Files:** create `src/styles/tokens.css`, `src/styles/app.css`, `src/app/AppShell.tsx`, `src/components/{Icon,Button,StatusNotice,ConfirmationDialog,PageHeader}.tsx`, `public/assets/`, `tools/check-assets.mjs`.

**Interfaces:** `AppShell` consumes an access/profile object and outlet; `ConfirmationDialog` accepts open/title/message/busy/onConfirm/onCancel. `Icon` resolves only known relative supplied SVG paths.

- [ ] Copy permitted supplied assets/license with clear filenames, matching the design tokens and native font stacks. Build desktop top navigation/mobile navigation, accessible statuses, labels, cards and action controls.
- [ ] Route boundaries: `/auth`, `/register`, `/verify`, `/forgot-password`, `/reset-password`, `/access`, `/`, `/students`, `/students/new`, `/students/:id`, `/students/:id/edit`, `/classes`, `/classes/new`, `/classes/:id`, `/grades`, `/grades/:enrollmentId`, `/accounts`, `/help`, `/about`.
- [ ] Remove prototype state picker/sample sessions/fake OTP code. Check reused assets and no missing relative files with `npm.cmd run check:assets`; run build. Commit UI shell/assets. Feature browser tasks verify interaction and focus, not unit tests duplicating styling.

## Task 6: Production auth and approval-aware route access

**Files:** create `src/lib/{config,client,api}.ts`, `src/features/auth/{AuthProvider,AuthPage,RegisterPage,VerifyPage,RecoveryPage,ResetPage,AccessPage}.tsx`, `tests/unit/auth-lifecycle.test.ts`, `tests/browser/auth-audit.js`.

**Interfaces:** `useAuth()` exposes `{user,profile,access,loading,error,refreshAccess,signOut}`; feature forms use Supabase Auth methods and `get_my_access()`. Username remains a profile field, not login lookup. Environment accepts only the dedicated URL/publishable key.

- [ ] Test same-user token refresh preserves drafts; sign-out/account swap clears private state. Test pending/rejected/revoked states cannot mount record screens and no unverified account reaches workspace data.
- [ ] Observe failures, then implement signup, OTP verification/resend, email/password sign-in, reset link/recovery and pending-access screen. Validate field lengths/username format/confirmation; map user-safe errors. Use provider policy for real OTP length/expiry rather than hardcoded demo codes.
- [ ] Run fixture-backed auth audit through Playwright CLI: invalid login/code, resend cooldown, verification-to-pending, approved access, recovery form and logout confirmation. Do not create hosted users or send test emails implicitly.
- [ ] Run unit/type/build checks and commit auth/access deliverable.

## Task 7: Shared query and reliable mutation handling

**Files:** create `src/hooks/{useQuery,useMutation,useUnsavedChanges}.ts`, `src/domain/mutations.ts`, `tests/unit/mutations.test.ts`, `tools/browser-fixture-server.mjs`, `tests/browser/mutation-audit.js`.

**Interfaces:** `useMutation<T,R>` submits `MutationRequest<T>` and exposes pending/unknown/error/saved/retry/recover state. Unknown submissions keep the immutable request/nonce until resolved. `useUnsavedChanges(dirty)` blocks internal navigation and warns on browser unload. `useQuery<T>` drops stale responses after key/access changes.

- [ ] Test successful known results unlock editing, stale validation/version conflict retains draft with actionable feedback, ambiguous response retains the original actionId/payload, changed retry is impossible and cross-account state is discarded.
- [ ] Observe failures; implement receipt lookup/same-request retry. Persist only unresolved action reference and necessary draft in tab-scoped storage, bound to owner; clear after resolution/logout. Do not store credentials or perform offline writes.
- [ ] Fixture audit: delay a search and change filters, lose response after committed save, refresh/recover, navigate with unsaved edits, cancel confirmation and keyboard focus restoration. Retain user-visible input during same-user session refresh.
- [ ] Run unit and CLI mutation checks; commit shared reliability contracts.

## Task 8: Students, catalog, classes and enrollment workflows

**Files:** create `src/features/students/{api,StudentList,StudentDetail,StudentForm}.ts(x)`, `src/features/classes/{api,ClassList,ClassDetail,ClassForm,EnrollmentForm}.ts(x)`, `src/domain/validation.ts`, `tests/unit/validation.test.ts`, `tests/browser/records-audit.js`.

**Interfaces:** adapters consume task4 RPCs; stable IDs/versions travel with every selected entity. Student input contains identity fields; enrollment/class input contains all original academic/subject fields without duplicating identity storage.

- [ ] Test future consecutive school years, normalized duplicate numbers, optional middle initial, long Unicode names, invalid sections/year/units and preserved selection after catalog refresh.
- [ ] Observe failures; implement paginated search/filter lists, scoped detail URLs and add/edit/archive/restore confirmations. Forms explicitly show course, year, section, semester, school year, subject code/description/units. Select catalog options from database; manage class subject/group details without invalidating existing enrollment history.
- [ ] Implement enrollment add/archive/restore and teacher assignment controls for permitted administrators/registrars, with account access restrictions from the spec.
- [ ] CLI records audit: two students with the same name but distinct numbers, one student in two subjects, save/reload/edit, enrollment-only removal, student archive/restore, stale save conflict, and teacher read-only identity controls. At390px verify long names/subject text don't overflow the page.
- [ ] Run validation/database/browser checks and commit records/classes deliverable.

## Task 9: Automatic grade entry and class sheets

**Files:** create `src/features/grades/{api,GradeSheet,GradeEntry,GradeResultSummary}.ts(x)`, `tests/browser/grading-audit.js`, `docs/grade-policy.md`.

**Interfaces:** GradeEntry consumes `get_grade` (scores/version/student/class), parses input via task1 and submits only six scores to `save_grades`. GradeSheet uses six academic filters and `get_grade_sheet`; saved result uses returned authoritative decimal strings/version.

- [ ] CLI failing audit first: enter88/90/91/89/92/90 and expect immediate90.00/1.75/Passed; save, reload and expect identical persisted values. Empty one field → Incomplete/no result, save draft/reload preserves null; explicit0 remains0. Six96.45 →1.00; six74.45 →3.00. Reject100.01 and third decimal.
- [ ] Implement desktop sticky student-column sheet, filters, status/result cards and mobile two-column entry form. Show the equal-period formula and classification rounding help. Maintain edit drafts on token refresh and version conflicts.
- [ ] Verify teacher assignment removal denies an already-open form save, independent enrollment grades remain untouched, saved response loss recovers the same action, and keyboard navigation/unsaved-edit confirmation works.
- [ ] Run unit/SQL/CLI grading tests, including cross-language vectors, and commit automatic grading deliverable.

## Task 10: Real dashboard, staff approval, help and activity

**Files:** create `src/features/dashboard/{api,DashboardPage}.ts(x)`, `src/features/accounts/{api,AccountsPage}.ts(x)`, `src/features/help/{HelpPage,AboutPage}.tsx`, `tests/browser/admin-audit.js`.

**Interfaces:** consumes `get_dashboard`, `get_recent_activity`, `list_staff`, `review_staff_access` and teacher-assignment API. Dashboard metrics respect active enrollment/accessible class scope. Staff access page is administrator-only.

- [ ] CLI failing audit: verified pending account appears for admin, approve teacher without permitting self-promotion, assign class and observe scoped teacher workspace, revoke and verify denial. Registrar cannot open approval page; final-admin removal shows safe error.
- [ ] Implement pending/rejected/active staff views, role/access confirmations and database-backed student/class/completion/activity dashboard. No prototype totals or fake recent names in production.
- [ ] Help/About explain actual flows, archive recovery, six-period calculation and independent portfolio branding. Do not reproduce password-bearing login history.
- [ ] Run admin and dashboard fixture checks; commit final functional screens.

## Task 11: Full Playwright CLI audit, fresh review and delivery

**Files:** create `tools/browser-audit.mjs`, `tests/browser/{responsive-audit,resilience-audit}.js`, `tools/check-bundle.mjs`, `README.md`, `AUDIT.md`, `docs/{supabase-setup,verification,asset-manifest}.md`, `netlify.toml`; generate ignored `outputs/` ZIPs/setup SQL/screenshots.

**Interfaces:** `npm.cmd run test:browser` orchestrates CLI session `registrix-audit`, fails on CLI error markers even if process exits0, and captures screenshots/evidence. Config allows loopback preview and future SPA hosting; no deployment action.

- [ ] Run complete unit, PostgreSQL security/concurrency, TypeScript/build and asset/bundle checks. Bundle scan rejects service credentials, legacy MDB/PII, test fixtures, placeholder admin grants and privileged keys in deployable files. Resolve failures before release claims.
- [ ] Run all browser audits at1440×900,1024×768,390×844 and360×800. Cover all main pages, pending access, auth, student/class/enrollment/archive, grade save/reload, admin actions, failed/slow requests, empty lists, long names, keyboard dialogs, reduced motion and offline feedback. Visually inspect screenshots, not only DOM assertions.
- [ ] Obtain one fresh whole-branch review focused on correctness, privacy, role access, grading equivalence and design fidelity. Fix findings with targeted regressions; avoid repeating completed review cycles without changed risk.
- [ ] Prepare source and web ZIPs containing original assets/license and instructions, excluding design archives/screenshots/local tools/secrets/MDB. Provide screenshots separately. Combine migrations/catalog seed into new-empty-project setup SQL and an optional explicitly fictional seed file; include guarded first-admin SQL separately.
- [ ] If the owner supplies a dedicated hosted project, apply/setup only as authorized and verify public configuration plus owner-driven auth/access flows. Otherwise preserve deployable source/setup instructions and clearly report that hosted verification remains pending. Do not claim fixture checks establish live authentication.
- [ ] Document differences from prototype: production email sign-in, approved roles, archive instead of permanent delete, automatic rounded conversion, real data/empty states, removed simulation toolbar. Report actual checks and physical-device limitations. Commit final source/docs; no public push/deploy yet.

## Plan review and execution status

Spec approved; plan written and self-reviewed against all spec sections. The tasks share one grading/access/record contract and are intended to be executed inline, with a single fresh final review. Implementation awaits the user's review of this concrete plan. During execution, continue all independent local work while dedicated Supabase setup information is pending.
