async (page) => {
  page.setDefaultTimeout(8000);
  page.on("dialog", (d) => d.accept());
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
  const pages = [
    "/",
    "/students",
    "/students/new",
    "/classes",
    "/classes/new",
    "/classes?view=catalog",
    "/grades",
    "/accounts",
    "/help",
    "/about",
  ];
  const issues = [];
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [390, 844],
    [360, 800],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of pages) {
      await page.goto("http://127.0.0.1:5192" + route);
      await page.locator("main h1").waitFor();
      await page.waitForTimeout(100);
      const result = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: innerWidth,
        broken: [...document.images]
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => i.src),
      }));
      if (result.scroll > result.width + 1)
        issues.push(`${width} ${route} overflow ${result.scroll}`);
      if (result.broken.length) issues.push(`${route} missing image`);
      if(route==='/'){
        const cta=await page.getByRole('link',{name:'Explore classes',exact:true}).boundingBox();
        if(!cta||cta.height>64)issues.push(`${width} dashboard action is enlarged to ${cta?.height}px`);
      }
      if(width<760){const bounds=await page.getByRole('navigation',{name:'Mobile navigation',exact:true}).getByRole('link').evaluateAll(links=>links.map(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})));if(bounds.some(b=>b.left<0||b.right>width+1))issues.push(`${width} mobile navigation extends beyond viewport`);}
      if (route === "/" || route === "/classes" || route === "/grades")
        await page.screenshot({
          path: `outputs/registrix-${width}-${route === "/" ? "dashboard" : route.slice(1)}.png`,
          fullPage: true,
        });
    }
  }
  if (issues.length) throw Error(issues.join("\n"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:5192/auth");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [360, 800],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "/auth",
      "/register",
      "/verify",
      "/forgot-password",
      "/reset-password",
    ]) {
      await page.goto("http://127.0.0.1:5192" + route);
      await page.locator(".auth-form h1, .access-card h1").first().waitFor();
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        throw Error(`Auth overflow ${width} ${route}`);
      if (route === "/auth")
        await page.screenshot({
          path: `outputs/registrix-${width}-auth.png`,
          fullPage: true,
        });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:5192/auth");
  await page.getByLabel("Email address", { exact: true }).focus();
  await page.keyboard.press("Tab");
  if (
    (await page.evaluate(() =>
      document.activeElement?.getAttribute("autocomplete"),
    )) !== "current-password"
  )
    throw Error("Password keyboard order failed");
  await page.evaluate(() => {
    window.__registrixAudit = "responsive";
  });
  return {
    passed:
      "40 workspace and 15 auth viewport checks, assets, reduced motion and keyboard order",
  };
}

