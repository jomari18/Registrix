async (page) => {
  page.setDefaultTimeout(8000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const check = (v, m) => {
    if (!v) throw Error(m);
  };
  await page.goto("http://127.0.0.1:5192/students/new");
  await page.getByLabel("Student number", { exact: true }).fill("RECOVER-001");
  await page.getByLabel("Surname", { exact: true }).fill("Recover Demo");
  await page.getByLabel("First name", { exact: true }).fill("Morgan");
  await page.getByLabel("Gender", { exact: true }).selectOption("other");
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Students", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Leave your unsaved changes?", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  check(
    (await page.getByLabel("Surname", { exact: true }).inputValue()) ===
      "Recover Demo",
    "Cancel discarded draft",
  );
  check(
    (await page.evaluate(() => document.activeElement?.textContent)) ===
      "Students",
    "Dialog did not restore focus",
  );
  await page.request.post("http://127.0.0.1:55445/__fixture", {
    data: { op: "control", values: { drop: "save_student" } },
  });
  await page.getByRole("button", { name: "Save student", exact: true }).click();
  await page
    .getByRole("button", { name: "Recover saved result", exact: true })
    .waitFor();
  check(
    await page.getByLabel("Surname", { exact: true }).isDisabled(),
    "Ambiguous save permits payload changes",
  );
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await page
    .getByRole("button", { name: "Recover saved result", exact: true })
    .waitFor();
  check(
    (await page.getByLabel("Surname", { exact: true }).inputValue()) ===
      "Recover Demo",
    "Refresh lost unresolved draft",
  );
  await page
    .getByRole("button", { name: "Recover saved result", exact: true })
    .click();
  await page.waitForURL(/\/students\/[a-f0-9-]+\?new=1$/);
  await page.goto("http://127.0.0.1:5192/students");
  await page.getByLabel("Search students", { exact: true }).waitFor();
  await page.request.post("http://127.0.0.1:55445/__fixture", {
    data: { op: "control", values: { delay: "list_students" } },
  });
  await page.getByLabel("Search students", { exact: true }).fill("DEMO");
  await page.waitForTimeout(100);
  await page.getByLabel("Search students", { exact: true }).fill("RECOVER-001");
  await page
    .getByRole("table")
    .getByText("RECOVER-001", { exact: true })
    .waitFor();
  await page.waitForTimeout(2000);
  check(
    (await page
      .getByRole("table")
      .getByText("DEMO-2026-001", { exact: true })
      .count()) === 0,
    "Stale search response replaced current filter",
  );
  console.log(
    "PASS mutations: unsaved confirmation and focus, lost committed response, refresh/recovery, locked immutable draft and stale query cancellation",
  );
  await page.evaluate(() => {
    window.__registrixAudit = "mutations";
  });
  return { passed: "mutations" };
}

