async (page) => {
  page.setDefaultTimeout(8000);
  await page.setViewportSize({ width: 1440, height: 900 });
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
  await page.getByLabel("Password", { exact: true }).fill("RegistrixDemo123!");
  await page.getByRole("button", { name: "Sign in →", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/students");
  await page.getByRole("link", { name: "Add student", exact: true }).click();
  await page.getByLabel("Student number", { exact: true }).fill("AUDIT-101");
  await page
    .getByLabel("Surname", { exact: true })
    .fill("Synthetic Dela Cruz–Ñaña");
  await page.getByLabel("First name", { exact: true }).fill("José María");
  await page.getByLabel("Gender", { exact: true }).selectOption("other");
  await page.getByRole("button", { name: "Save student", exact: true }).click();
  await page.waitForURL(/\/students\/[a-f0-9-]+\?new=1$/);
  const firstUrl = page.url();
  await page
    .getByLabel("Select a class", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("button", { name: "Add enrollment", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Saved to the workspace." })
    .waitFor();
  await page.goto("http://127.0.0.1:5192/students/new");
  await page.getByLabel("Student number", { exact: true }).fill("AUDIT-102");
  await page
    .getByLabel("Surname", { exact: true })
    .fill("Synthetic Dela Cruz–Ñaña");
  await page.getByLabel("First name", { exact: true }).fill("José María");
  await page.getByLabel("Gender", { exact: true }).selectOption("other");
  await page.getByRole("button", { name: "Save student", exact: true }).click();
  await page.waitForURL(/\/students\/[a-f0-9-]+\?new=1$/);
  await page.goto("http://127.0.0.1:5192/classes/new");
  await page
    .getByLabel("Subject", { exact: true })
    .selectOption({ label: "(BSCS)CC102 · Fundamentals of Programming" });
  await page.getByLabel("Section", { exact: true }).selectOption("B");
  await page.getByRole("button", { name: "Save class", exact: true }).click();
  await page.waitForURL(/\/classes\/[a-f0-9-]+$/);
  await page.goto(firstUrl);
  await page
    .getByLabel("Select a class", { exact: true })
    .selectOption({ label: "(BSCS)CC102 · BSCS 1-B · 1st · 2026-2027" });
  await page
    .getByRole("button", { name: "Add enrollment", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Saved to the workspace." })
    .waitFor();
  await page.reload();
  await page
    .getByRole("heading", {
      name: "Synthetic Dela Cruz–Ñaña, José María",
      exact: true,
    })
    .waitFor();
  check(
    (await page
      .getByRole("link", { name: "Enter grades", exact: true })
      .count()) === 2,
    "Student did not retain independent enrollments",
  );
  await page
    .getByRole("button", {
      name: "Archive enrollment (BSCS)CC102",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Archive enrollment", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Restore enrollment (BSCS)CC102",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", { name: "Archive student", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Archive student", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore student", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Restore student", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Restore student", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Archive student", exact: true })
    .waitFor();
  check(
    await page
      .getByRole("button", {
        name: "Restore enrollment (BSCS)CC102",
        exact: true,
      })
      .isVisible(),
    "Restoring student reversed a separate enrollment archive",
  );
  await page.getByRole("link", { name: "Edit student", exact: true }).click();
  await page.getByLabel("First name", { exact: true }).fill("Version draft");
  const studentId = firstUrl.split("/").at(-1).split("?")[0];
  await page.request.post("http://127.0.0.1:55445/__fixture", {
    data: { op: "staleStudent", id: studentId },
  });
  await page.getByRole("button", { name: "Save student", exact: true }).click();
  await page.getByRole("alert").waitFor();
  check(
    (await page.getByLabel("First name", { exact: true }).inputValue()) ===
      "Version draft",
    "Conflict erased draft",
  );
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Students", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Leave page", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(firstUrl);
  await page
    .getByRole("heading", {
      name: "Synthetic Dela Cruz–Ñaña, José María",
      exact: true,
    })
    .waitFor();
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Long student name overflows mobile",
  );
  await page.screenshot({
    path: "outputs/registrix-mobile-student.png",
    fullPage: true,
  });
  console.log(
    "PASS records: duplicate names, independent enrollments, archive/restore precedence, stale draft and mobile long names",
  );
}

