import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extractCatalog } from "../src/domain/catalog.ts";
const primary = extractCatalog(
  await readFile(".local-source/StudentReg.cs", "utf8"),
);
const secondary = extractCatalog(
  await readFile(".local-source/Gradingsheet.cs", "utf8"),
);
const raw = await readFile("preview/source-catalog.js", "utf8");
const preview = JSON.parse(
  raw
    .slice(raw.indexOf("=") + 1)
    .trim()
    .replace(/;$/, ""),
);
const secondaryByKey = new Map(
  secondary.entries.map((e) => [
    [e.code, e.course, e.yearLevel, e.semester].join("|"),
    e,
  ]),
);
const disagreements = primary.entries.filter((e) => {
  const other = secondaryByKey.get(
    [e.code, e.course, e.yearLevel, e.semester].join("|"),
  );
  return (
    other && (other.units !== e.units || other.description !== e.description)
  );
});
const held = new Set(disagreements.map((e) => e.code));
const entries = primary.entries.filter((e) => !held.has(e.code));
await mkdir("data", { recursive: true });
await writeFile("data/catalog.json", JSON.stringify(entries, null, 2) + "\n");
await writeFile(
  "docs/catalog-review.md",
  `# Source catalog review\n\nRead only C# text from StudentRecords-Recovery.zip; no Access database opened or imported. Production entries are derived from StudentReg.cs and compared with Gradingsheet.cs.\n\nPreview: ${Object.keys(preview.subjects).length} labels, ${Object.keys(preview.groups).length} groups. Source: ${primary.groups} groups, ${primary.entries.length} resolved scoped mappings; ${entries.length} imported entries.\n\nParenthesized units such as (2) are numeric 2. No weighting is inferred. Conflicting definitions are held out pending curriculum review. Identical repeated labels are deduplicated per scope.\n\n## Findings\n\n${primary.issues.map((e) => `- StudentReg.cs:${e.line}: ${e.code} — ${e.kind}`).join("\n")}\n${disagreements.map((e) => `- ${e.code} differs between original forms; held out.`).join("\n")}\n\nOnly academic labels are delivered. Original source files stay in ignored local scratch and the MDB, accounts, credentials and school artwork are excluded.\n`,
);
console.log(
  `${entries.length} entries, ${primary.groups} groups, ${primary.issues.length} source findings, ${disagreements.length} cross-form differences.`,
);
