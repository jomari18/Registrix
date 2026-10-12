import assert from "node:assert/strict";
import { pool, actor, rpc, ids } from "../../tools/db-test-lib.mjs";
import { randomUUID } from "node:crypto";
export async function runConcurrency() {
  const s = (
    await pool.query("select * from public.students where student_no='FIX-001'")
  ).rows[0];
  const request = () => ({
    actionId: randomUUID(),
    expectedVersion: s.version,
    payload: {
      id: s.id,
      student_no: s.student_no,
      surname: s.surname,
      first_name: "Concurrent edit",
      middle_initial: "",
      gender: s.gender,
    },
  });
  const results = await Promise.all([
    actor(ids.admin, (c) => rpc(c, "save_student", request())),
    actor(ids.admin, (c) => rpc(c, "save_student", request())),
  ]);
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.equal(results.filter((r) => r.code === "VERSION_CONFLICT").length, 1);
  const updated = (
    await pool.query("select version from public.students where id=$1", [s.id])
  ).rows[0];
  assert.equal(updated.version, s.version + 1);
  const identical = {
    actionId: randomUUID(),
    expectedVersion: updated.version,
    payload: {
      id: s.id,
      student_no: s.student_no,
      surname: s.surname,
      first_name: "Replay edit",
      gender: s.gender,
    },
  };
  const replays = await Promise.all([
    actor(ids.admin, (c) => rpc(c, "save_student", identical)),
    actor(ids.admin, (c) => rpc(c, "save_student", identical)),
  ]);
  assert.deepEqual(replays[0], replays[1]);
  assert.equal(replays[0].ok, true);
}
