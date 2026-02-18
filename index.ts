import fs from "fs";
import path from "path";
import Ajv2020 from "ajv/dist/2020";
import signale from "signale";

interface Country {
  tag: string;
  name: string;
  coop?: number;
  team?: string;
}
// test
interface CountryList {
  countries: Country[];
}

const SCHEMA_PATH = "schema/countryList.schema.json";
const DATA_DIR = "./countrylists/";

// Dateien, die wir ignorieren wollen
const IGNORE_FILES = [
  "*.md",
];

const ajv = new Ajv2020({ allErrors: true });

// 1. Schema laden
if (!fs.existsSync(SCHEMA_PATH)) {
  signale.error(`❌ Schema file not found at ${SCHEMA_PATH}`);
  process.exit(1);
}
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));
const validate = ajv.compile(schema);

// 2. Alle JSON-Dateien finden
const files = fs.readdirSync(DATA_DIR).filter(file => {
  return file.endsWith(".json") && 
         !IGNORE_FILES.includes(file) &&
         !file.includes(".schema.json"); // Schema-Dateien selbst ignorieren
});

if (files.length === 0) {
  signale.warn("⚠️ No JSON files found to validate.");
  process.exit(0);
}

signale.info(`🔎 Found ${files.length} files to validate: ${files.join(", ")}`);

let hasError = false;
const allTags = new Set<string>();

// 3. Jede Datei validieren
for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content) as CountryList;

    if (!validate(data)) {
      signale.error(`❌ Validation failed for ${file}:`);
      signale.error(validate.errors);
      hasError = true;
      continue;
    }

    for (const country of data.countries) {
      if (allTags.has(country.tag)) {
        signale.error(`❌ Duplicate tag found: "${country.tag}" in ${file} (already exists in another file)`);
        hasError = true;
      } else {
        allTags.add(country.tag);
      }
    }
    

    const fileTags = data.countries.map(c => c.tag);
    if (new Set(fileTags).size !== fileTags.length) {
       signale.error(`❌ Duplicate tags found inside ${file}`);
       hasError = true;
    }

    signale.info(`✅ ${file} is valid`);

  } catch (err) {
    signale.error(`❌ Error reading/parsing ${file}:`, err);
    hasError = true;
  }
}

if (hasError) {
  signale.error("\n💥 Validation failed with errors.");
  process.exit(1);
} else {
  signale.success("\n🎉 All files are valid!");
}
