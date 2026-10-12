async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.request.post("http://127.0.0.1:55445/__fixture", {
    data: { op: "assign", active: true },
  });
  await page.goto("http://127.0.0.1:5192/auth");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("teacher@example.test");
  await page.getByLabel("Password", { exact: true }).fill("RegistrixDemo123!");
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/students");
  await page
    .getByRole("link", { name: "View student →", exact: true })
    .first()
    .click();
  await page
    .getByRole("heading", { name: "Student information", exact: true })
    .waitFor();
  if (
    (await page
      .getByRole("link", { name: "Edit student", exact: true })
      .count()) ||
    (await page
      .getByRole("button", { name: "Archive student", exact: true })
      .count()) ||
    (await page
      .getByRole("button", { name: "Add enrollment", exact: true })
      .count())
  )
    throw Error("Teacher sees identity/enrollment controls");
  await page.goto("http://127.0.0.1:5192/students/new");
  await page.waitForURL("http://127.0.0.1:5192/");
  await page.goto("http://127.0.0.1:5192/accounts");
  await page.waitForURL("http://127.0.0.1:5192/");
  return { passed: "teacher identity and administrative route restrictions" };
}
