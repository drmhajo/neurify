import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "supabase/functions/central-registration/index.ts"), "utf8");
writeFileSync("/tmp/central-registration-deploy-input.json", JSON.stringify({
  project_id: "zyszoiezbbrunkgscwth",
  name: "central-registration",
  verify_jwt: false,
  entrypoint_path: "index.ts",
  files: [{ name: "index.ts", content: source }],
}));
