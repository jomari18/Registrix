async (page) => {
  page.setDefaultTimeout(8000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const check = (v, m) => {
    if (!v) throw Error(m);
  };
  await page.goto("http://127.0.0.1:5192/classes");
  await page
    .getByRole("link", { name: "Open class →", exact: true })
    .first()
    .click();
  await page
    .getByRole("link", { name: "View grades", exact: true })
    .first()
    .click();
  await page.getByLabel("Monthly", { exact: true }).waitFor();
  const labels = [
    "Monthly",
    "First prelim",
    "Second prelim",
    "Midterm",
    "Pre-final",
    "Final",
  ];
  const fill = async (values) => {
    for (let i = 0; i < labels.length; i++)
      await page.getByLabel(labels[i], { exact: true }).fill(String(values[i]));
  };
  await fill([88, 90, 91, 89, 92, 90]);
  check(
    (
      await page
        .getByRole("region", { name: "Grade preview", exact: true })
        .innerText()
    ).includes("90.00"),
    "Immediate average incorrect",
  );
  check(
    (
      await page
        .getByRole("region", { name: "Grade preview", exact: true })
        .innerText()
    ).includes("1.75"),
    "Immediate equivalent incorrect",
  );
  await page.getByRole("button", { name: "Save grades", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Saved to the workspace." })
    .waitFor();
  await page.reload();
  check(
    (
      await page
        .getByRole("region", { name: "Saved result", exact: true })
        .innerText()
    ).includes("90.00"),
    "Persisted average incorrect",
  );
  await page.getByLabel("Final", { exact: true }).fill("");
  check(
    (
      await page
        .getByRole("region", { name: "Grade preview", exact: true })
        .innerText()
    ).includes("Incomplete"),
    "Empty score invented result",
  );
  await page.getByRole("button", { name: "Save grades", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Saved to the workspace." })
    .waitFor();
  await page.reload();
  check(
    (await page.getByLabel("Final", { exact: true }).inputValue()) === "",
    "Null score changed after reload",
  );
  await fill([0, 0, 0, 0, 0, 0]);
  check(
    (
      await page
        .getByRole("region", { name: "Grade preview", exact: true })
        .innerText()
    ).includes("0.00"),
    "Zero became missing",
  );
  await fill([96.45, 96.45, 96.45, 96.45, 96.45, 96.45]);
  check(
    (
      await page
        .getByRole("region", { name: "Grade preview", exact: true })
        .innerText()
    ).includes("1.00"),
    "96.45 boundary failed",
  );
  await fill([74.45, 74.45, 74.45, 74.45, 74.45, 74.45]);
  check(
    (
      await page
        .getByRole("region", { name: "Grade preview", exact: true })
        .innerText()
    ).includes("3.00"),
    "74.45 boundary failed",
  );
  await page.getByLabel("Final", { exact: true }).fill("100.01");
  await page.getByRole("alert").waitFor();
  check(
    await page
      .getByRole("button", { name: "Save grades", exact: true })
      .isDisabled(),
    "Invalid range accepted",
  );
  await page.getByLabel("Final", { exact: true }).fill("90.001");
  await page.getByRole("alert").waitFor();
  await page.getByLabel("Final", { exact: true }).fill("74.45");
  await page.request.post("http://127.0.0.1:55445/__fixture", {
    data: { op: "control", values: { drop: "save_grades" } },
  });
  await page.getByRole("button", { name: "Save grades", exact: true }).click();
  await page
    .getByRole("button", { name: "Recover saved result", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Recover saved result", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Saved result recovered." })
    .waitFor();
  check(
    (
      await page
        .getByRole("region", { name: "Saved result", exact: true })
        .innerText()
    ).includes("3.00"),
    "Recovered server result incorrect",
  );
  await page.getByLabel("Final", { exact: true }).fill("80");
  await page.request.post("http://127.0.0.1:55445/__fixture", {
    data: { op: "assign", active: false },
  });
  await page.getByRole("button", { name: "Save grades", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Enrollment is unavailable." })
    .waitFor();
  check(
    (await page.getByLabel("Final", { exact: true }).count()) === 0,
    "Revocation retained inaccessible scores",
  );
  check(
    await page.evaluate(() =>
      Object.keys(sessionStorage).every(
        (k) =>
          !k.startsWith("registrix:draft:") &&
          !k.startsWith("registrix:action:"),
      ),
    ),
    "Revocation retained private drafts/actions",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Grade entry overflows mobile",
  );
  await page.screenshot({
    path: "outputs/registrix-mobile-grading.png",
    fullPage: true,
  });
  await page.evaluate(() => {
    window.__registrixAudit = "grades";
  });
  return {
    passed:
      "grade preview/persistence/nulls/zero/boundaries/invalid input/recovery/assignment revocation",
  };
}
