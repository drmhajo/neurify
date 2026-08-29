import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../supabase/functions/central-registration/index.ts", import.meta.url), "utf8");
await writeFile("/tmp/central-registration-deploy.json", JSON.stringify({
  project_id: "zyszoiezbbrunkgscwth",
  name: "central-registration",
  verify_jwt: false,
  entrypoint_path: "index.ts",
  files: [{ name: "index.ts", content: source }],
}, null, 2));
