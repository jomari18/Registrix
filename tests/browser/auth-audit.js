async (page) => {
  const check = (v, m) => {
    if (!v) throw Error(m);
  };
  await page.goto("http://127.0.0.1:5192/auth");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await page.getByRole("alert").waitFor();
  await page.getByLabel("Password", { exact: true }).fill("RegistrixDemo123!");
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .waitFor();
  await page.evaluate(() =>
    sessionStorage.setItem("registrix:test-draft", "keep"),
  );
  await page.reload();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .waitFor();
  check(
    (await page.evaluate(() =>
      sessionStorage.getItem("registrix:test-draft"),
    )) === "keep",
    "Same-user hydration erased a draft",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  check(
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .isVisible(),
    "Cancel signed out",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  await page.waitForURL("**/auth");
  check(
    (await page.evaluate(() =>
      sessionStorage.getItem("registrix:test-draft"),
    )) === null,
    "Logout retained private draft",
  );
  await page.goto("http://127.0.0.1:5192/register");
  await page.getByLabel("Full name", { exact: true }).fill("Fresh Demo");
  await page.getByLabel("Username", { exact: true }).fill("fresh_demo");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fresh@example.test");
  await page.getByLabel("Password", { exact: true }).fill("RegistrixDemo123!");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("RegistrixDemo123!");
  await page
    .getByRole("button", { name: "Create account →", exact: true })
    .click();
  await page.waitForURL("**/verify?**");
  await page.getByLabel("Verification code", { exact: true }).fill("11111111");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await page.getByRole("alert").waitFor();
  await page.getByRole("button", { name: "Resend code", exact: true }).click();
  await page.getByRole("button", { name: /Resend in/ }).waitFor();
  await page.getByLabel("Verification code", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await page.waitForURL("**/access");
  await page
    .getByRole("heading", { name: "You’re on the list.", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/students");
  await page.waitForURL("**/access");
  check(
    (await page.getByRole("navigation").count()) === 0,
    "Pending user mounted workspace",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("**/auth");
  await page.goto("http://127.0.0.1:5192/forgot-password");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("fresh@example.test");
  await page
    .getByRole("button", { name: "Send reset instructions", exact: true })
    .click();
  await page.getByRole("status").waitFor();
  console.log(
    "PASS auth: invalid login/code, eight-digit OTP, resend cooldown, pending gate, approved session, draft retention and logout, recovery",
  );
}
