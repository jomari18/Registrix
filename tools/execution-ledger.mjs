import { readFile, mkdir, writeFile, appendFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const plan = "docs/superpowers/plans/2026-10-12-react-supabase.md";
const workspace = ".superpowers/sdd/2026-10-12-react-supabase";
await mkdir(workspace, { recursive: true });
const git = (...args) =>
  execFileSync(
    "git",
    ["-c", `safe.directory=${process.cwd().replaceAll("\\", "/")}`, ...args],
    { encoding: "utf8" },
  ).trim();
const [mode, n, ...details] = process.argv.slice(2);
if (mode === "init")
  await writeFile(
    `${workspace}/progress.md`,
    `# SDD ledger — plan: ${plan}\nRuling: Work in the approved dedicated Registrix repository on codex/registrix-conversion — isolation already separates all portfolio projects; no second checkout needed.\nRuling: Native bash helpers cannot find dirname/basename on this Windows environment; use this Node equivalent for task briefs and ledger, retaining the same completion gates.\nPre-flight: task1 GradeScores/GradeResult → task3 SQL/task9 forms: compatible exact decimal strings/nulls.\nPre-flight: task2 catalog → task4 seed/task8 selectors: scoped entries, report conflicts.\nPre-flight: task3 access → task4 RPC/task6 auth: DB membership, verified users only.\nPre-flight: task4 versioned envelopes → task7 hooks/tasks8–10 pages: immutable actor/action receipt contract.\n`,
  );
if (mode === "start") {
  const text = await readFile(plan, "utf8");
  const section = text
    .split(new RegExp(`## Task ${n}:`))[1]
    ?.split(/\n## Task /)[0];
  if (!section) throw Error("No task");
  await writeFile(`${workspace}/task-${n}.md`, section);
  await appendFile(
    `${workspace}/progress.md`,
    `Task ${n}: started BASE ${git("rev-parse", "HEAD")}\n`,
  );
  console.log(section);
}
if (mode === "done")
  await appendFile(
    `${workspace}/progress.md`,
    `Task ${n}: complete (HEAD ${git("rev-parse", "HEAD")}, verification: ${details.join(" ")})\n`,
  );
if (mode === "note")
  await appendFile(
    `${workspace}/progress.md`,
    `Task ${n}: ${details.join(" ")}\n`,
  );
