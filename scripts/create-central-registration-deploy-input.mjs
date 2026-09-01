import { readFileSync, writeFileSync } from "node:fs";

const [sourcePath, destinationPath] = process.argv.slice(2);
if (!sourcePath || !destinationPath) {
  throw new Error("Usage: node create-central-registration-deploy-input.mjs <source-ts> <destination-json>");
}

const content = readFileSync(sourcePath, "utf8");
const input = {
  project_id: "zyszoiezbbrunkgscwth",
  name: "central-registration",
  entrypoint_path: "index.ts",
  verify_jwt: false,
  files: [{ name: "index.ts", content }],
};

writeFileSync(destinationPath, JSON.stringify(input), "utf8");
