async (page) => {
  page.setDefaultTimeout(8000);
  const check = (value, message) => {
    if (!value) throw Error(message);
  };
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
  await page.goto("http://127.0.0.1:5192/students");
  await page
    .getByRole("link", { name: "View student →", exact: true })
    .first()
    .click();
  const studentUrl = page.url();
  const classes = page.getByRole("group", {
    name: "Matching classes",
    exact: true,
  });
  await classes
    .getByRole("radio", { name: /Introduction to Computing/ })
    .waitFor();
  check(
    (await page.getByLabel("Select a class", { exact: true }).count()) === 0,
    "Separate class dropdown remains",
  );
  await classes
    .getByRole("radio", { name: /Introduction to Computing/ })
    .check();
  check(
    await page
      .getByRole("button", { name: "Add enrollment", exact: true })
      .isEnabled(),
    "Visible class selection did not enable action",
  );
  await page
    .getByLabel("Search classes", { exact: true })
    .fill("NO-MATCH-SELECTOR");
  await page.getByText("No matching classes.", { exact: true }).waitFor();
  check(
    (await classes.getByRole("radio").count()) === 0,
    "Old results remain after filtering",
  );
  check(
    await page
      .getByRole("button", { name: "Add enrollment", exact: true })
      .isDisabled(),
    "Old selection stayed submittable",
  );
  await page.getByLabel("Search classes", { exact: true }).fill("CC101");
  await classes
    .getByRole("radio", { name: /Introduction to Computing/ })
    .waitFor();
  await classes.getByRole("radio").first().focus();
  await page.keyboard.press("Space");
  check(
    await classes.getByRole("radio").first().isChecked(),
    "Keyboard selection failed",
  );
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "Add enrollment", exact: true })
      .scrollIntoViewIfNeeded();
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Class results overflow " + width,
    );
    await page.screenshot({
      path: "outputs/registrix-selector-classes-" + width + ".png",
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:5192/classes");
  await page
    .getByRole("link", { name: "Open class →", exact: true })
    .first()
    .click();
  const students = page.getByRole("group", {
    name: "Matching students",
    exact: true,
  });
  await students.getByRole("radio").first().waitFor();
  await students.getByRole("radio").first().check();
  await page
    .getByLabel("Search students to enroll", { exact: true })
    .fill("NO-MATCH-STUDENT");
  await page.getByText("No matching students.", { exact: true }).waitFor();
  check(
    await page
      .getByRole("button", { name: "Add enrollment", exact: true })
      .isDisabled(),
    "Filtered student remains selected",
  );
  await page
    .getByLabel("Search students to enroll", { exact: true })
    .fill("DEMO");
  await students.getByRole("radio").first().waitFor();
  const teachers = page.getByRole("group", {
    name: "Matching teachers",
    exact: true,
  });
  await teachers.getByRole("radio", { name: /Taylor Demo/ }).waitFor();
  check(
    (await page.getByLabel("Teacher", { exact: true }).count()) === 0,
    "Separate teacher dropdown remains",
  );
  await teachers.getByRole("radio", { name: /Taylor Demo/ }).check();
  await page
    .getByLabel("Search staff to assign", { exact: true })
    .fill("NO-MATCH-TEACHER");
  await page.getByText("No matching teachers.", { exact: true }).waitFor();
  check(
    await page
      .getByRole("button", { name: "Assign teacher", exact: true })
      .isDisabled(),
    "Filtered teacher remains selected",
  );
  await page
    .getByLabel("Search staff to assign", { exact: true })
    .fill("Taylor");
  await teachers.getByRole("radio").first().waitFor();
  await teachers.getByRole("radio").first().check();
  await page
    .getByRole("button", { name: "Assign teacher", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Assign teacher?", exact: true })
    .waitFor();
  check(
    (await page.getByRole("dialog").innerText()).includes("Taylor Demo"),
    "Confirmation hides selected teacher name",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "Assign teacher", exact: true })
      .scrollIntoViewIfNeeded();
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "People results overflow " + width,
    );
    await page.screenshot({
      path: "outputs/registrix-selector-people-" + width + ".png",
      fullPage: true,
    });
  }
  return {
    passed:
      "all three visible result selectors, filtering, selection safety, keyboard and responsive layouts",
  };
}
