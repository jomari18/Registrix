// Loopback-only synthetic Auth adapter. RPCs execute the REAL SQL in the isolated test DB.
import http from "node:http";
import { randomUUID } from "node:crypto";
import { pool, setup, actor, rpc, ids, connection } from "./db-test-lib.mjs";
if (connection.host !== "127.0.0.1" || connection.database !== "registrix_test")
  throw Error("Refusing hosted fixture target");
await setup();
const users = new Map();
for (const [role, id] of Object.entries(ids)) {
  const name =
    role === "admin"
      ? "Alex Demo"
      : role === "teacher"
        ? "Taylor Demo"
        : role === "registrar"
          ? "Jamie Demo"
          : "Pending Demo";
  await pool.query(
    "insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)values($1,$2,$3,$4)",
    [
      id,
      role + "@example.test",
      role === "unverified" ? null : new Date(),
      JSON.stringify({
        display_name: name,
        username: "fixture_" + role,
        position: role,
      }),
    ],
  );
  if (["admin", "registrar", "teacher"].includes(role))
    await pool.query(
      "update registrix_private.memberships set state='active',role=$2 where user_id=$1",
      [id, role === "admin" ? "administrator" : role],
    );
  users.set(role + "@example.test", {
    id,
    email: role + "@example.test",
    email_confirmed_at: role === "unverified" ? null : new Date().toISOString(),
    user_metadata: { display_name: name },
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
  });
}
await pool.query(
  await import("node:fs/promises").then((fs) =>
    fs.readFile("supabase/demo-seed.sql", "utf8"),
  ),
);
const controls = { drop: "", delay: "", fail: "" };
function jwt(user) {
  const encode = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", email: user.email, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })}.synthetic-signature`;
}
function session(user) {
  return {
    access_token: jwt(user),
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "fixture-" + user.id,
    user,
  };
}
function identity(req) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const id = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString(),
    ).sub;
    return [...users.values()].find((u) => u.id === id);
  } catch {
    return null;
  }
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (
    origin &&
    !["http://127.0.0.1:5192", "http://localhost:5192"].includes(origin)
  ) {
    res.writeHead(403);
    res.end();
    return;
  }
  res.setHeader(
    "Access-Control-Allow-Origin",
    origin ?? "http://127.0.0.1:5192",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization,apikey,content-type,content-profile,accept-profile,x-client-info,x-supabase-api-version",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const send = (status, data) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, "http://127.0.0.1:55445");
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 100000) throw Error("Request too large");
    }
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === "/health") {
      send(200, { synthetic: true, controls });
      return;
    }
    if (url.pathname === "/__fixture") {
      if (body.op === "control")
        Object.assign(controls, { drop: "", delay: "", fail: "" }, body.values);
      if (body.op === "revoke")
        await pool.query(
          "update registrix_private.memberships set state='revoked' where user_id=$1",
          [ids[body.actor]],
        );
      if (body.op === "restore")
        await pool.query(
          "update registrix_private.memberships set state='active' where user_id=$1",
          [ids[body.actor]],
        );
      if (body.op === "assign") {
        const cl = (
          await pool.query("select c.id from public.classes c join public.subjects s on s.id=c.subject_id where s.code='(BSCS)CC101' and c.section='A' and c.school_year='2026-2027' order by c.id limit 1")
        ).rows[0];
        await pool.query(
          "insert into registrix_private.assignments(user_id,class_id,active)values($1,$2,$3)on conflict(user_id,class_id)do update set active=excluded.active,version=assignments.version+1",
          [ids.teacher, body.class_id ?? cl.id, body.active ?? true],
        );
      }
      if (body.op === "staleStudent")
        await pool.query(
          "update public.students set version=version+1 where id=$1",
          [body.id],
        );
      send(200, { ok: true });
      return;
    }
    if (url.pathname.startsWith("/auth/v1/")) {
      const path = url.pathname.slice(9),
        user = identity(req);
      if (path === "settings") {
        send(200, {
          external: { email: true },
          disable_signup: false,
          mailer_autoconfirm: false,
        });
        return;
      }
      if (path === "token") {
        if (url.searchParams.get("grant_type") === "refresh_token") {
          const u = [...users.values()].find(
            (u) => "fixture-" + u.id === body.refresh_token,
          );
          send(
            u ? 200 : 400,
            u ? session(u) : { msg: "Invalid refresh token" },
          );
          return;
        }
        const u = users.get(body.email?.trim().toLowerCase());
        if (!u || body.password !== "RegistrixDemo123!") {
          send(400, {
            code: "invalid_credentials",
            msg: "Invalid login credentials",
          });
          return;
        }
        if (!u.email_confirmed_at) {
          send(400, {
            code: "email_not_confirmed",
            msg: "Email not confirmed",
          });
          return;
        }
        send(200, session(u));
        return;
      }
      if (path === "signup") {
        const email = body.email.toLowerCase();
        if (users.has(email)) {
          send(400, { msg: "Already registered" });
          return;
        }
        const id = randomUUID(),
          metadata = body.data ?? {};
        await pool.query(
          "insert into auth.users(id,email,raw_user_meta_data)values($1,$2,$3)",
          [id, email, JSON.stringify(metadata)],
        );
        const u = {
          id,
          email,
          email_confirmed_at: null,
          user_metadata: metadata,
          aud: "authenticated",
          role: "authenticated",
          created_at: new Date().toISOString(),
        };
        users.set(email, u);
        send(200, u);
        return;
      }
      if (path === "verify") {
        const u = users.get(body.email?.toLowerCase());
        if (!u || body.token !== "12345678") {
          send(400, {
            code: "otp_expired",
            msg: "Token is invalid or expired",
          });
          return;
        }
        await pool.query(
          "update auth.users set email_confirmed_at=now()where id=$1",
          [u.id],
        );
        u.email_confirmed_at = new Date().toISOString();
        send(200, session(u));
        return;
      }
      if (path === "resend" || path === "recover" || path === "logout") {
        send(200, {});
        return;
      }
      if (path === "user") {
        send(user ? 200 : 401, user ?? { msg: "No session" });
        return;
      }
    }
    if (url.pathname.startsWith("/rest/v1/rpc/")) {
      const name = url.pathname.split("/").at(-1),
        u = identity(req);
      if (!u) {
        send(401, { message: "No authenticated fixture user" });
        return;
      }
      if (controls.delay === name) {
        controls.delay = "";
        await new Promise((r) => setTimeout(r, 1800));
      }
      if (controls.fail === name) {
        controls.fail = "";
        send(503, { message: "Simulated unavailable server" });
        return;
      }
      const result = await actor(u.id, async (c) =>
        name === "get_my_access"
          ? (await c.query("select public.get_my_access()result")).rows[0]
              .result
          : await rpc(c, name, body.p_request ?? {}),
      );
      if (controls.drop === name) {
        controls.drop = "";
        send(503, {
          message:
            "The database committed; simulated gateway lost its response.",
        });
        return;
      }
      send(200, result);
      return;
    }
    send(404, { message: "No fixture endpoint" });
  } catch (error) {
    console.error("Fixture:", error.message);
    send(400, { message: "Synthetic fixture request failed" });
  }
});
server.listen(55445, "127.0.0.1", () =>
  console.log(
    "Synthetic Registrix Auth + real database RPC adapter: 127.0.0.1:55445",
  ),
);
process.on("SIGINT", () =>
  server.close(() => pool.end().then(() => process.exit())),
);
