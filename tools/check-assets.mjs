import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
async function walk(root) {
  return (
    await Promise.all(
      (await readdir(root, { withFileTypes: true })).map((e) =>
        e.isDirectory()
          ? walk(path.join(root, e.name))
          : [path.join(root, e.name)],
      ),
    )
  ).flat();
}
const files = await walk("public/assets");
for (const f of files.filter((f) => f.endsWith(".svg"))) {
  const text = await readFile(f, "utf8");
  if (/<script|onload=|https?:\/\/(?!www.w3.org)/i.test(text))
    throw Error("Unexpected external or executable SVG " + f);
}
for (const f of await walk("src")) {
  const t = await readFile(f, "utf8");
  for (const m of t.matchAll(/['"](\/assets\/[^'"`$]+)['"]/g)) {
    if (!files.includes(path.normalize("public" + m[1])))
      throw Error("Missing asset " + m[1]);
  }
}
if (!files.some((f) => f.endsWith("LICENSE.txt")))
  throw Error("Missing artwork license");
console.log(`${files.length} local supplied assets/license checked.`);
