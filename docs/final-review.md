# Fresh whole-branch review

A separate fresh-context reviewer inspected commit range 759858f..5fe79ca, read-only, against the approved spec/plan and execution decisions. It inspected SQL, client lifecycle, local workflow evidence and desktop/mobile captures. No second review or implementer agents were dispatched.

No Critical finding was identified. Four Important findings were accepted and fixed in one pass:

1. Assignment removal and membership reductions now invalidate private queries and remove private draft/action storage. The old regression that retained inaccessible scores was corrected. A new browser regression failed with the old implementation and now verifies that the editor and tab storage no longer expose those values.
2. Persisted drafts now retain their original baseline and version. A concurrent student update followed by reload reproduced an overwrite before the fix. Restored student/class/grade/subject drafts now keep their original version; newer server versions require explicit review and discard/load-latest. Browser checks preserve the other editor's student and grade changes. Two unit regressions verify provenance and reject unversioned legacy draft storage.
3. Enrollment search and pagination clear selection. Submission requires a visible current option and a completed query. The browser regression reproduced hidden selection submission before the fix and now verifies disabled submission.
4. Subject editor replacement/cancellation asks before discarding dirty work. Pending/unknown saves prevent switching, and per-subject drafts persist. The browser regression initially found no confirmation and now verifies cancelling it preserves the description.

Final verification: 45 unit tests, nine SQL suites, TypeScript/PostgreSQL grade vectors, concurrent write/replay checks, production build and nine Playwright CLI suites passed. Asset/bundle checks and ZIP inventory checks are recorded in the delivery audit. The review fixes need no additional hosted migration.

## Deferred minor

Expand the cross-language grading generator with mixed-score totals around both display and classification halfway points. Existing uniform-score vectors cover all thresholds, and browser coverage includes 88/90/91/89/92/90, but mixed SQL/TypeScript comparisons would strengthen the evidence.

## Behaviors the reviewer declined to judge

Owner-driven hosted email delivery/recovery/throttling; physical Safari/iOS and final HTTPS redirects; global-lock throughput at unspecified large scale; institutional grade/curriculum authority; exact side-by-side pixel fidelity. Each was explicitly resolved as a documented limit/decision rather than silently treated as verified; see implementation-decisions.md.
