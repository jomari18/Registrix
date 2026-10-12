import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
export const connection = {
  host: "127.0.0.1",
  port: 55444,
  user: "registrix_test",
  database: "registrix_test",
};
export const pool = new pg.Pool(connection);
export const ids = {
  admin: "10000000-0000-4000-8000-000000000001",
  registrar: "10000000-0000-4000-8000-000000000002",
  teacher: "10000000-0000-4000-8000-000000000003",
  pending: "10000000-0000-4000-8000-000000000004",
  unverified: "10000000-0000-4000-8000-000000000005",
};
export async function actor(id, fn, role = "authenticated") {
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query(
      `set local role ${role === "anon" ? "anon" : "authenticated"}`,
    );
    await c.query("select set_config('request.jwt.claim.sub',$1,true)", [
      id ?? "",
    ]);
    const r = await fn(c);
    await c.query("commit");
    return r;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}
export async function rpc(c, name, request = {}) {
  if (!/^[a-z_]+$/.test(name)) throw Error("Unsafe RPC");
  return (
    await c.query(`select public.${name}($1::jsonb) result`, [
      JSON.stringify(request),
    ])
  ).rows[0].result;
}
export async function setup() {
  if (
    connection.host !== "127.0.0.1" ||
    connection.port !== 55444 ||
    connection.database !== "registrix_test" ||
    connection.user !== "registrix_test"
  )
    throw Error("Refusing non-isolated database");
  await pool.query(
    "drop schema if exists registrix_private cascade;drop schema public cascade;create schema public;drop schema if exists auth cascade",
  );
  await pool.query(await readFile("tests/postgres/bootstrap.sql", "utf8"));
  for (const f of (await readdir("supabase/migrations"))
    .filter((x) => x.endsWith(".sql"))
    .sort())
    await pool.query(await readFile("supabase/migrations/" + f, "utf8"));
  await pool.query(await readFile("supabase/seed.sql", "utf8"));
  await pool.query(await readFile("supabase/seed.sql", "utf8"));
}
