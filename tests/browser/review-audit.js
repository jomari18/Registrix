async (page) => {
  page.setDefaultTimeout(5000);
  // Other suites verify the native leave dialog; here reload deliberately restores drafts.
  await page.addInitScript(() => {
    const add = window.addEventListener.bind(window);
    window.addEventListener = (type, ...args) => {
      if (type !== "beforeunload") add(type, ...args);
    };
  });
  const errors = [];
  const check = (value, message) => {
    if (!value) throw Error(message);
  };
  const fixture = async (data) =>
    page.request.post("http://127.0.0.1:55445/__fixture", { data });
  const login = async (role) => {
    await page.goto("http://127.0.0.1:5192/auth");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page
      .getByLabel("Email address", { exact: true })
      .fill(role + "@example.test");
    await page
      .getByLabel("Password", { exact: true })
      .fill("RegistrixDemo123!");
    await page.getByRole("button", { name: "Sign in →", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .waitFor();
  };
  const rpc = async (name, p_request) => {
    const token = await page.evaluate(
      () =>
        JSON.parse(
          [
            ...Object.entries(localStorage),
            ...Object.entries(sessionStorage),
          ].find(([k, v]) => {
            try {
              return !!JSON.parse(v)?.access_token;
            } catch {
              return false;
            }
          })[1],
        ).access_token,
    );
    const result = await page.request.post(
      "http://127.0.0.1:55445/rest/v1/rpc/" + name,
      { headers: { Authorization: "Bearer " + token }, data: { p_request } },
    );
    return (await result.json()).data;
  };
  const go = async (path) => {
    await page.evaluate(() => {
      window.onbeforeunload = null;
    });
    await page.goto("http://127.0.0.1:5192" + path);
  };
  // Real concurrent editor regression: the second save commits through the same SQL RPC.
  await login("admin");
  await go("/students");
  await page
    .getByRole("link", { name: "View student →", exact: true })
    .first()
    .click();
  const studentId = page.url().split("/").pop();
  await page.getByRole("link", { name: "Edit student", exact: true }).click();
  await page
    .getByLabel("First name", { exact: true })
    .fill("Persisted old draft");
  const student = await rpc("get_student", { id: studentId });
  await rpc("save_student", {
    actionId: crypto.randomUUID(),
    expectedVersion: student.version,
    payload: {
      id: studentId,
      student_no: student.student_no,
      surname: student.surname,
      first_name: "Other editor update",
      middle_initial: student.middle_initial,
      gender: student.gender,
    },
  });
  // Remove native leave handlers only in this test to deliberately reload a persisted draft.
  await page.evaluate(() => {
    const storage = {};
    for (const k of Object.keys(sessionStorage))
      storage[k] = sessionStorage.getItem(k);
    window.__reviewStorage = storage;
  });
  // Native dialog acceptance is registered before reload.
  page.once("dialog", (d) => d.accept());
  await page.reload();
  await page.getByLabel("First name", { exact: true }).waitFor();
  check(
    (await page.getByLabel("First name", { exact: true }).inputValue()) ===
      "Persisted old draft",
    "Draft was not restored",
  );
  try {
    const save = page.getByRole("button", {
      name: "Save student",
      exact: true,
    });
    if (!(await save.isDisabled())) await save.click();
    await page.waitForTimeout(300);
    check(
      (await rpc("get_student", { id: studentId })).first_name ===
        "Other editor update",
      "Reloaded stale draft overwrote the concurrent student edit",
    );
  } catch (e) {
    errors.push("draft-version: " + e.message);
  }
  await login("admin");
  await go("/students/" + studentId);
  await page
    .getByRole("group", { name: "Matching classes", exact: true })
    .getByRole("radio")
    .first()
    .check();
  await page
    .getByLabel("Search classes", { exact: true })
    .fill("NO-MATCH-REVIEW");
  await page.waitForTimeout(250);
  try {
    check(
      await page
        .getByRole("button", { name: "Add enrollment", exact: true })
        .isDisabled(),
      "Hidden enrollment target remained submittable",
    );
  } catch (e) {
    errors.push("selection: " + e.message);
  }
  await go("/classes?view=catalog");
  await page
    .getByRole("button", { name: "Edit subject", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Subject description", { exact: true })
    .fill("Keep this unsaved subject");
  await page
    .getByRole("button", { name: "Edit subject", exact: true })
    .nth(1)
    .click();
  try {
    await page
      .getByRole("dialog", { name: "Discard this subject draft?", exact: true })
      .waitFor();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    check(
      (await page
        .getByLabel("Subject description", { exact: true })
        .inputValue()) === "Keep this unsaved subject",
      "Subject switch discarded draft",
    );
  } catch (e) {
    errors.push("catalog-switch: " + e.message);
  }
  await login("teacher");
  await fixture({ op: "assign", active: true });
  await go("/classes");
  await page
    .getByRole("link", { name: "Open class →", exact: true })
    .first()
    .click();
  await page
    .getByRole("link", { name: "View grades", exact: true })
    .first()
    .click();
  const enrollmentId = page.url().split("/").pop();
  await page.getByLabel("Monthly", { exact: true }).fill("61");
  const enrollment = await rpc("get_grade", { id: enrollmentId });
  const newer = await rpc("save_grades", {
    actionId: crypto.randomUUID(),
    expectedVersion: enrollment.grade?.version ?? null,
    payload: {
      enrollment_id: enrollmentId,
      scores: {
        monthly: 92,
        firstPrelim: 92,
        secondPrelim: 92,
        midterm: 92,
        preFinal: 92,
        final: 92,
      },
    },
  });
  check(!!newer, "Concurrent grade save failed");
  await page.reload();
  await page.getByLabel("Monthly", { exact: true }).waitFor();
  check(
    (await page.getByLabel("Monthly", { exact: true }).inputValue()) === "61",
    "Grade draft lost on reload",
  );
  check(
    await page
      .getByRole("button", { name: "Save grades", exact: true })
      .isDisabled(),
    "Restored grade adopted newer version",
  );
  check(
    (await rpc("get_grade", { id: enrollmentId })).grade.scores.monthly === 92,
    "Newer grade overwritten",
  );
  await page
    .getByRole("button", { name: "Discard draft and load latest", exact: true })
    .click();
  check(
    (await page.getByLabel("Monthly", { exact: true }).inputValue()) === "92",
    "Explicit grade reset did not load latest",
  );
  await page.getByLabel("Final", { exact: true }).fill("82");
  await fixture({ op: "assign", active: false });
  await page.getByRole("button", { name: "Save grades", exact: true }).click();
  await page.waitForTimeout(500);
  try {
    check(
      (await page.getByLabel("Final", { exact: true }).count()) === 0,
      "Revoked editor still exposes scores",
    );
    check(
      await page.evaluate(() =>
        Object.keys(sessionStorage).every(
          (k) =>
            !k.startsWith("registrix:draft:") &&
            !k.startsWith("registrix:action:"),
        ),
      ),
      "Revoked private tab state remains",
    );
  } catch (e) {
    errors.push("permission-clear: " + e.message);
  }
  await fixture({ op: "assign", active: true });
  await page.evaluate((errors) => {
    window.__registrixReviewResult = { errors };
  }, errors);
  if (errors.length) throw Error(errors.join("\n"));
  return { passed: "four final-review regressions" };
}
