import * as fs from "fs";

// read .env manually
let url = "";
let key = "";
try {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const matchUrl = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+)/);
    if (matchUrl) url = matchUrl[1].replace(/['"]/g, "").trim();
    const matchKey = line.match(/^\s*VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*(.+)/);
    if (matchKey) key = matchKey[1].replace(/['"]/g, "").trim();
  }
} catch (e) {
  console.error("Could not read .env file:", e);
}

async function main() {
  const restUrl = `${url}/rest/v1/`;
  const response = await fetch(restUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  const schema = (await response.json()) as any;
  console.log("Schema paths keys:", Object.keys(schema.paths || {}));
  console.log("Schema definitions keys:", Object.keys(schema.definitions || {}));
}

main();
