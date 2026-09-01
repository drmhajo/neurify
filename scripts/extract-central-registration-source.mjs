import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const [sourcePath, destinationPath] = process.argv.slice(2);
if (!sourcePath || !destinationPath) {
  throw new Error("Usage: node extract-central-registration-source.mjs <source-json> <destination-ts>");
}

const payload = JSON.parse(readFileSync(sourcePath, "utf8"));
const source = payload.files?.find((file) => file.name === "central-registration/index.ts")?.content;
if (typeof source !== "string" || !source.trim()) {
  throw new Error("Central registration source was not found in the retrieved payload.");
}

mkdirSync(destinationPath.slice(0, destinationPath.lastIndexOf("/")), { recursive: true });
writeFileSync(destinationPath, source, "utf8");
