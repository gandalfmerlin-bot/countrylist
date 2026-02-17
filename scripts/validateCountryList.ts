import fs from "fs";
import Ajv from "ajv";

interface Country {
  tag: string;
  name: string;
  coop?: number;
  team?: string;
}

interface CountryList {
  countries: Country[];
}

const ajv = new Ajv({ allErrors: true });

const schema = JSON.parse(
  fs.readFileSync("schema/countryList.schema.json", "utf-8")
);
const data = JSON.parse(
  fs.readFileSync("countryList.json", "utf-8")
) as CountryList;

const validate = ajv.compile(schema);

if (!validate(data)) {
  console.error(validate.errors);
  process.exit(1);
}

const tags = data.countries.map((c) => c.tag);
if (new Set(tags).size !== tags.length) {
  console.error("Duplicate country tags found");
  process.exit(1);
}

console.log("countryList.json valid ✅");
