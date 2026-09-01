import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Neurify default language", () => {
  it("opens in English when no preference has been saved and preserves explicit choices", () => {
    const languageProvider = fs.readFileSync(path.join(root, "lib", "language.tsx"), "utf8");

    expect(languageProvider).toContain('const DEFAULT_LANGUAGE: AppLanguage = "en"');
    expect(languageProvider).toContain("useState<AppLanguage>(DEFAULT_LANGUAGE)");
    expect(languageProvider).toContain('if (value === "ar" || value === "en") setLanguageState(value)');
    expect(languageProvider).toContain("AsyncStorage.setItem(LANGUAGE_KEY, next)");
  });
});
