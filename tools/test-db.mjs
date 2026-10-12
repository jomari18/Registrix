import { readFile, readdir } from "node:fs/promises";
import { pool, setup } from "./db-test-lib.mjs";
try {
  await setup();
  const filters = process.argv.slice(2);
  for (const f of (await readdir("tests/postgres"))
    .filter(
      (x) =>
        x.endsWith(".sql") &&
        x !== "bootstrap.sql" &&
        (!filters.length || filters.some((y) => x.startsWith(y))),
    )
    .sort()) {
    await pool.query(await readFile("tests/postgres/" + f, "utf8"));
    console.log("PASS " + f);
  }
  if (!filters.length || filters.includes("grades")) {
    const { runVectors } = await import("../tests/postgres/grade-vectors.mjs");
    await runVectors();
    console.log("PASS TypeScript/Postgres grade equivalence");
  }
  if (
    !filters.length &&
    (await readdir("tests/postgres").then((x) => x.includes("concurrency.mjs")))
  ) {
    const { runConcurrency } = await import(
      "../tests/postgres/concurrency.mjs"
    );
    await runConcurrency();
    console.log("PASS concurrent writes");
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
