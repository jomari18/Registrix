async (page) => {
  page.setDefaultTimeout(8000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:5192/auth");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("RegistrixDemo123!");
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .waitFor();
  await page.request.post("http://127.0.0.1:55445/__fixture", {
    data: { op: "control", values: { fail: "list_students" } },
  });
  await page.goto("http://127.0.0.1:5192/students");
  await page.getByRole("alert").waitFor();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByRole("link", { name: "View student →", exact: true })
    .first()
    .waitFor();
  await page
    .getByLabel("Search students", { exact: true })
    .fill("NOT-A-REAL-STUDENT-987");
  await page
    .getByRole("heading", { name: "No matching students.", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/students/new");
  await page.getByLabel("Student number", { exact: true }).fill("OFFLINE-001");
  await page.getByLabel("Surname", { exact: true }).fill("Offline Demo");
  await page.getByLabel("First name", { exact: true }).fill("Avery");
  await page.getByLabel("Gender", { exact: true }).selectOption("other");
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Save student", exact: true }).click();
  await page
    .getByRole("button", { name: "Recover saved result", exact: true })
    .waitFor();
  if (
    (await page.getByLabel("Surname", { exact: true }).inputValue()) !==
    "Offline Demo"
  )
    throw Error("Offline save erased draft");
  await page.context().setOffline(false);
  await page
    .getByRole("button", { name: "Recover saved result", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Retry same request", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Retry same request", exact: true })
    .click();
  await page.waitForURL(/\/students\/[a-f0-9-]+\?new=1$/);
  await page.evaluate(() => {
    window.__registrixAudit = "resilience";
  });
  return {
    passed:
      "unavailable query retry, empty search, offline draft and same-request retry after reconnect",
  };
}
