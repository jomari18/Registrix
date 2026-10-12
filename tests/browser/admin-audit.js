async (page) => {
  page.setDefaultTimeout(8000);
  await page.setViewportSize({ width: 1440, height: 900 });
  page.on("dialog", (d) => d.accept());
  const login = async (email) => {
    await page.goto("http://127.0.0.1:5192/auth");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("RegistrixDemo123!");
    await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  };
  await login("admin@example.test");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/accounts");
  await page
    .getByRole("article", { name: "Staff pending@example.test", exact: true })
    .waitFor();
  const pending = page.getByRole("article", {
    name: "Staff pending@example.test",
    exact: true,
  });
  await pending
    .getByLabel("Role for Pending Demo", { exact: true })
    .selectOption("teacher");
  await pending
    .getByRole("button", { name: "Approve access", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Approve access", exact: true })
    .click();
  await page.getByRole("button", { name: "Active", exact: true }).click();
  await page
    .getByRole("article", { name: "Staff pending@example.test", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/classes");
  await page
    .getByRole("link", { name: "Open class →", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Teacher", { exact: true })
    .selectOption({ label: "Pending Demo · fixture_pending" });
  await page
    .getByRole("button", { name: "Assign teacher", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Update assignment", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Saved to the workspace." })
    .waitFor();
  await login("pending@example.test");
  await page.getByRole("heading", { name: /Your academic day/ }).waitFor();
  await page.goto("http://127.0.0.1:5192/classes");
  await page
    .getByRole("link", { name: "Open class →", exact: true })
    .first()
    .waitFor();
  if (
    (await page
      .getByRole("link", { name: "Open class →", exact: true })
      .count()) !== 1
  )
    throw Error("Newly approved teacher has wrong class scope");
  await login("admin@example.test");
  await page.goto("http://127.0.0.1:5192/accounts");
  await page.getByRole("button", { name: "Active", exact: true }).click();
  await page
    .getByRole("article", { name: "Staff pending@example.test", exact: true })
    .getByRole("button", { name: "Revoke access", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Revoke access", exact: true })
    .click();
  await page.getByRole("button", { name: "Revoked", exact: true }).click();
  await page
    .getByRole("article", { name: "Staff pending@example.test", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Active", exact: true }).click();
  await page
    .getByRole("article", { name: "Staff admin@example.test", exact: true })
    .getByRole("button", { name: "Revoke access", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Revoke access", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Keep at least one active administrator." })
    .waitFor();
  await login("pending@example.test");
  await page.waitForURL("**/access");
  await page
    .getByRole("heading", { name: "Access has been revoked.", exact: true })
    .waitFor();
  await login("registrar@example.test");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/accounts");
  await page.waitForURL("http://127.0.0.1:5192/");
  if (
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Staff access", exact: true })
      .count()
  )
    throw Error("Registrar has staff access control");
  await page.evaluate(() => {
    window.__registrixAudit = "admin";
  });
  return {
    passed:
      "pending approval, teacher assignment/scope, revocation, last-admin protection, registrar restriction and real dashboard",
  };
}

