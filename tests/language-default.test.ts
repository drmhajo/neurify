import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Neurify default language", () => {
  it("opens in English when no preference is saved and restores explicit language choices", () => {
    const source = fs.readFileSync(path.join(root, "lib", "language.tsx"), "utf8");
    expect(source).toContain('const DEFAULT_LANGUAGE: AppLanguage = "en"');
    expect(source).toContain("useState<AppLanguage>(DEFAULT_LANGUAGE)");
    expect(source).toContain('if (value === "ar" || value === "en") setLanguageState(value)');
    expect(source).toContain("AsyncStorage.setItem(LANGUAGE_KEY, next)");
  });
});
