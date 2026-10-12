import http from "node:http";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const projectName = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")).name === "registrix" ? "Registrix" : "CestDelicieux";
const cli =
  process.env.PLAYWRIGHT_CLI ?? path.join(process.env.APPDATA ?? "", "npm", "playwright-cli.cmd");
async function call(args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(cli, args, {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "",
      stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(Error("CLI timeout"));
    }, 120000);
    child.stdout.on("data", (data) => (stdout += data));
    child.stderr.on("data", (data) => (stderr += data));
    child.on("error", reject);
    child.on("close", (status) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, status });
    });
  });
}
await mkdir("outputs/recovery-audit", { recursive: true });
const user = {
  id: "00000000-0000-4000-8000-000000000099",
  email: "recovery@example.test",
  email_confirmed_at: new Date().toISOString(),
  aud: "authenticated",
  role: "authenticated",
  user_metadata: { display_name: "Recovery Demo" },
};
const jwt = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: "authenticated",
  },
  "synthetic-only",
]
  .map((x) =>
    typeof x === "string"
      ? x
      : Buffer.from(JSON.stringify(x)).toString("base64url"),
  )
  .join(".");
let active = false,
  updates = 0,
  recoveryRequests = 0;
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (
    origin &&
    ["http://127.0.0.1:5204", "http://127.0.0.1:5205"].includes(origin)
  )
    res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Content-Type", "application/json");
  const send = (status, data) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };
  if (req.method === "OPTIONS") {
    send(200, {});
    return;
  }
  let input = "";
  for await (const chunk of req) input += chunk;
  const body = JSON.parse(input || "{}"),
    url = new URL(req.url, "http://127.0.0.1:55504");
  if (url.pathname === "/__metrics") {
    send(200, { updates, recoveryRequests, active });
    return;
  }
  if (url.pathname === "/__reset") {
    active = false;
    updates = 0;
    recoveryRequests = 0;
    send(200, {});
    return;
  }
  if (url.pathname === "/auth/v1/recover") {
    recoveryRequests++;
    send(200, {});
    return;
  }
  if (url.pathname === "/auth/v1/verify") {
    if (
      body.type !== "recovery" ||
      body.email !== user.email ||
      body.token !== "87654321"
    ) {
      send(403, {
        code: "otp_expired",
        msg: "Invalid or expired recovery OTP",
      });
      return;
    }
    active = true;
    send(200, {
      access_token: jwt,
      refresh_token: "synthetic-recovery-refresh",
      token_type: "bearer",
      expires_in: 3600,
      user,
    });
    return;
  }
  if (url.pathname === "/auth/v1/user") {
    if (!active || req.headers.authorization !== "Bearer " + jwt) {
      send(401, { code: "session_not_found", msg: "No recovery session" });
      return;
    }
    if (req.method === "PUT") {
      if (!body.password || body.password.length < 8) {
        send(400, { code: "weak_password", msg: "Weak password" });
        return;
      }
      updates++;
    }
    send(200, user);
    return;
  }
  if (url.pathname === "/auth/v1/logout") {
    active = false;
    send(200, {});
    return;
  }
  if (url.pathname.startsWith("/rest/")) {
    send(200, { ok: true, data: { products: [], categories: [] } });
    return;
  }
  send(200, {});
});
await new Promise((resolve) => server.listen(55504, "127.0.0.1", resolve));
const children = [];
async function ready(url) {
  for (let n = 0; n < 70; n++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error("UI not ready");
}
try {
  for (const [project, port] of [[projectName, projectName === "Registrix" ? 5204 : 5205]]) {
    const child = spawn(
      process.execPath,
      [
        path.join(projectRoot, "node_modules/vite/bin/vite.js"),
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          VITE_SUPABASE_URL: "http://127.0.0.1:55504",
          VITE_SUPABASE_PUBLISHABLE_KEY:
            "sb_publishable_synthetic_recovery_fixture",
        },
        stdio: "ignore",
      },
    );
    children.push(child);
    await ready("http://127.0.0.1:" + port + "/auth");
    const script = `async(page)=>{page.setDefaultTimeout(8000);await page.request.post('http://127.0.0.1:55504/__reset');await page.setViewportSize({width:1440,height:900});await page.goto('http://127.0.0.1:${port}/auth');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload();await page.getByRole('link',{name:'Forgot password?',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('recovery@example.test');await page.getByRole('button',{name:'Send recovery code',exact:true}).click();await page.getByLabel('Recovery code',{exact:true}).waitFor();if(!await page.getByRole('button',{name:/Resend in/}).isDisabled())throw Error('Resend cooldown absent');await page.getByLabel('Recovery code',{exact:true}).fill('00000000');await page.getByRole('button',{name:'Verify recovery code',exact:true}).click();await page.getByRole('alert').waitFor();if(await page.getByLabel('New password',{exact:true}).count())throw Error('Wrong OTP opened reset');await page.getByLabel('Recovery code',{exact:true}).fill('87654321');await page.getByRole('button',{name:'Verify recovery code',exact:true}).click();await page.getByLabel('New password',{exact:true}).waitFor();if(!await page.evaluate(()=>Object.values(localStorage).every(v=>!v.includes('synthetic-recovery-refresh'))))throw Error('Recovery tokens persisted');await page.getByLabel('New password',{exact:true}).fill('SyntheticNewPassword123!');await page.getByLabel('Confirm password',{exact:true}).fill('MismatchPassword123!');await page.getByRole('button',{name:'Update password',exact:true}).click();await page.getByRole('alert').filter({hasText:'Passwords do not match.'}).waitFor();for(const width of [1440,390,360]){await page.setViewportSize({width,height:900});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Recovery page overflow');await page.screenshot({path:'outputs/recovery-audit/${project}-password-'+width+'.png',fullPage:true})}await page.getByLabel('Confirm password',{exact:true}).fill('SyntheticNewPassword123!');await page.getByRole('button',{name:'Update password',exact:true}).click();await page.getByRole('status').filter({hasText:'Password updated. Sign in with your new password.'}).waitFor();const result=await(await page.request.get('http://127.0.0.1:55504/__metrics')).json();if(result.updates!==1||result.active)throw Error('Reset did not update once and end session');await page.getByRole('link',{name:'Sign in with your new password',exact:true}).click();await page.waitForURL('**/auth');await page.goto('http://127.0.0.1:${port}/forgot-password');if(await page.getByLabel('New password',{exact:true}).count())throw Error('Refresh retained recovery proof');return {passed:'${project} request/wrong OTP/recovery verify/mismatch/session cleanup/refresh/mobile'};}`;
    const scriptFile = "outputs/recovery-audit/" + project + ".js";
    await writeFile(scriptFile, script);
    const session = "otp-" + project.toLowerCase();
    await call(["-s=" + session, "close"]);
    await call(["-s=" + session, "open", "about:blank"]);
    const audit = await call([
      "-s=" + session,
      "run-code",
      "--filename=" + scriptFile,
    ]);
    await writeFile(
      "outputs/recovery-audit/" + project + ".log",
      (audit.stdout ?? "") + (audit.stderr ?? ""),
    );
    await call(["-s=" + session, "close"]);
    if (audit.status !== 0 || audit.stdout?.includes("### Error"))
      throw Error(project + " failed: " + audit.stdout?.slice(0, 1000));
    console.log("PASS " + project + " full recovery UI");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  for (const child of children) child.kill();
  await new Promise((resolve) => server.close(resolve));
}
