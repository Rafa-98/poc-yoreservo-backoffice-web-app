/**
 * Verifies that every locale in /locales has exactly the same files and keys
 * as the reference locale (es). Run: `npm run i18n:check`
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES_DIR = join(process.cwd(), "locales");
const REFERENCE = "es";

const flatten = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" ? flatten(child, path) : [path];
  });

const load = (locale, file) =>
  JSON.parse(readFileSync(join(LOCALES_DIR, locale, file), "utf8"));

const locales = readdirSync(LOCALES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const referenceFiles = readdirSync(join(LOCALES_DIR, REFERENCE));

let problems = 0;

for (const locale of locales.filter((name) => name !== REFERENCE)) {
  const files = readdirSync(join(LOCALES_DIR, locale));

  for (const file of referenceFiles) {
    if (!files.includes(file)) {
      console.error(`[${locale}] missing file: ${file}`);
      problems++;
      continue;
    }

    const expected = new Set(flatten(load(REFERENCE, file)));
    const actual = new Set(flatten(load(locale, file)));

    for (const key of expected) {
      if (!actual.has(key)) {
        console.error(`[${locale}] ${file}: missing key "${key}"`);
        problems++;
      }
    }
    for (const key of actual) {
      if (!expected.has(key)) {
        console.error(`[${locale}] ${file}: extra key "${key}"`);
        problems++;
      }
    }
  }
}

if (problems > 0) {
  console.error(`\ni18n check failed with ${problems} problem(s).`);
  process.exit(1);
}
console.log(`i18n check passed (${locales.join(", ")}).`);
