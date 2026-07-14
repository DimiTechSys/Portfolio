/* eslint-disable @typescript-eslint/no-require-imports */
// parse-scaffold.js
const fs = require("fs");
const path = require("path");

const scaffoldFile = process.argv[2];

if (!scaffoldFile) {
  console.error("Usage: node parse-scaffold.js scaffold.txt");
  process.exit(1);
}

if (!fs.existsSync(scaffoldFile)) {
  console.error(`File not found: ${scaffoldFile}`);
  process.exit(1);
}

const raw = fs.readFileSync(scaffoldFile, "utf8");

// Only treat lines like:
// // src/...
// as file headers
const headerRegex =
  /^\/\/\s+((?:src|app|components|lib|hooks|utils|types|styles|public)\/[^\r\n]+)$/gm;

const matches = [...raw.matchAll(headerRegex)];

if (matches.length === 0) {
  console.error("No scaffold headers found.");
  console.error('Expected lines like: // src/app/api/test/route.ts');
  process.exit(1);
}

for (let i = 0; i < matches.length; i++) {
  const current = matches[i];
  const next = matches[i + 1];

  const relativePath = current[1].trim();
  const start = current.index + current[0].length;
  const end = next ? next.index : raw.length;

  let content = raw.slice(start, end);

  // remove one leading newline after header
  content = content.replace(/^\r?\n/, "");

  // trim only trailing empty space/newlines
  content = content.replace(/\s+$/, "") + "\n";

  const fullPath = path.join(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");

  console.log(`Created: ${relativePath}`);
}

console.log(`Done. ${matches.length} file(s) written.`);