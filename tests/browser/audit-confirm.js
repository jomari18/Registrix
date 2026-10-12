async (page) => {
  await page.waitForFunction(
    () => window.__registrixAudit === "mutations",
    {},
    { timeout: 10000 },
  );
  return { passed: "mutations" };
}
