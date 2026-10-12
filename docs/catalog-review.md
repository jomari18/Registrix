# Source catalog review

Read only C# text from StudentRecords-Recovery.zip; no Access database opened or imported. Production entries are derived from StudentReg.cs and compared with Gradingsheet.cs.

Preview: 402 labels, 65 groups. Source: 65 groups, 407 resolved scoped mappings; 407 imported entries.

Parenthesized units such as (2) are numeric 2. No weighting is inferred. Conflicting definitions are held out pending curriculum review. Identical repeated labels are deduplicated per scope.

## Findings

- StudentReg.cs:1221: (BSTM)GE7 — conflict
- StudentReg.cs:1807: (BSBA)BA CC 6 — conflict
- StudentReg.cs:166: (BSTM)THC4 — missing description
- StudentReg.cs:204: (BSTM)GE7 — held out conflict
- StudentReg.cs:387: (BSBA)BA CC 6 — held out conflict
- StudentReg.cs:398: (BSBA)BA CC 6 — held out conflict
- StudentReg.cs:398: (BSBA)BA 4 — missing description
- StudentReg.cs:552: (BEED)EDUC107 — missing description


Only academic labels are delivered. Original source files stay in ignored local scratch and the MDB, accounts, credentials and school artwork are excluded.
