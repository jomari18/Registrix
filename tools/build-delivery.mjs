import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
await mkdir("outputs", { recursive: true });
const migrations = (await readdir("supabase/migrations"))
  .filter((f) => f.endsWith(".sql"))
  .sort();
const contents = await Promise.all(
  migrations.map((f) => readFile("supabase/migrations/" + f, "utf8")),
);
await writeFile(
  "outputs/Registrix-Supabase-Setup.sql",
  "-- NEW EMPTY DEDICATED REGISTRIX PROJECT ONLY. Run once. No real records/accounts.\n" +
    contents.join("\n\n") +
    "\n" +
    (await readFile("supabase/seed.sql", "utf8")),
);
await writeFile(
  "outputs/Registrix-Supabase-Upgrade.sql",
  "-- Existing initial Registrix setup only: follow-up migrations, no reset.\n" +
    contents.slice(2).join("\n\n"),
);
await writeFile(
  "outputs/Registrix-First-Administrator.sql",
  await readFile("docs/admin-access.sql", "utf8"),
);
await writeFile(
  "outputs/Registrix-Optional-Fictional-Demo.sql",
  await readFile("supabase/demo-seed.sql", "utf8"),
);
console.log(
  "Combined " +
    migrations.length +
    " migrations and catalog seed; guarded admin and fictional demo remain separate.",
);
