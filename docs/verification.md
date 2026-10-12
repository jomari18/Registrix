# Verification

Unit tests cover decimal-safe grading, each classification boundary, invalid scores, source catalog extraction/conflicts, staff route policy, immutable mutation recovery and academic/identity validation.

PostgreSQL suites run the actual schema and transaction functions against synthetic Auth tables in a disposable loopback database. They cover verified/pending/anonymous/teacher/registrar scope, RLS, independent enrollments, archive precedence, malformed input, duplicate identities, server grading, version conflicts, actor-bound receipts, removed assignment recovery, final-administrator protection and concurrent write/replay winners.

Playwright CLI runs the real React pages against a synthetic Auth adapter that forwards RPC calls to those real SQL functions. Workflow suites cover registration/verification, approval gates, student/class/enrollment changes, immutable recovery after a committed save loses its response, stale queries, grade preview/persistence, administrator approval/assignment/revocation, invalid inputs, empty/error/offline states, keyboard dialogs and desktop/tablet/mobile layouts. These tests send no real emails and create no hosted users.

Screenshots are inspected visually as well as checked for overflow and broken assets. Exact final evidence and remaining live/device limitations are recorded in `../AUDIT.md`. Fixture success does not establish live SMTP delivery or physical Safari behavior.
