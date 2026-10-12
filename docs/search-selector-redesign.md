# Visible search results

Approved in chat on 13 October 2026; implementation resumed after the requested 4:40 AM wait.

All three instances of a search field filtering a separate record dropdown now show directly selectable results:

- Class enrollment on a student's record: subject description, code, course/year/section, semester and school year.
- Student enrollment on a class record: full name and student number.
- Teacher assignment: approved teacher name, username and email; confirmation names the selected person.

Results use native labelled radio inputs for pointer and keyboard selection. Selected rows are visibly highlighted. Search and page changes clear the prior selection. Loading, no-match and failed-query states appear in the same picker; the action requires a current visible selection and a completed query. Unresolved mutations lock the picker and its pagination. Large result pages scroll within the list. Fixed-option dropdowns and searches filtering visible tables retain their existing behavior.

No Supabase schema, grading or authorization change was made. The staff API paginates active staff before teacher filtering; an empty page containing other staff roles is described as such and retains its pagination, rather than implying the entire project has no teachers.

Verification: new selector audit failed against the old dropdown UI before implementation. It now covers all three selectors, text filtering, empty results, invalidated selections, named confirmation, keyboard selection and desktop/390px/360px layouts. Existing record and administrator audits were adapted to choose visible results and continue checking actual local SQL writes. The permission regression now waits for the stable cleared-editor message, rather than a transient save error displayed before private data is cleared.

Final check results are recorded in AUDIT.md. Screenshots use synthetic identities; no real hosted student records were created or changed during tests.
