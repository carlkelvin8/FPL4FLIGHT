/**
 * Version Bump Script
 * Usage: node scripts/bump-version.js [patch|minor|major]
 * Updates app.config.ts versionName and android versionCode
 */

const fs = require("fs");
const path = require("path");

const type = process.argv[2] || "patch";
const configPath = path.join(__dirname, "../apps/mobile/app.config.ts");
const content = fs.readFileSync(configPath, "utf-8");

// Extract current version
const versionMatch = content.match(/version:\s*"(\d+)\.(\d+)\.(\d+)"/);
if (!versionMatch) { console.error("Could not find version in app.config.ts"); process.exit(1); }

let [, major, minor, patch] = versionMatch.map(Number);

if (type === "major") { major++; minor = 0; patch = 0; }
else if (type === "minor") { minor++; patch = 0; }
else { patch++; }

const newVersion = `${major}.${minor}.${patch}`;

// Update version
let updated = content.replace(/version:\s*"\d+\.\d+\.\d+"/, `version: "${newVersion}"`);

// Update versionCode (increment by 1)
const codeMatch = updated.match(/versionCode:\s*(\d+)/);
if (codeMatch) {
  const newCode = parseInt(codeMatch[1]) + 1;
  updated = updated.replace(/versionCode:\s*\d+/, `versionCode: ${newCode}`);
  console.log(`  versionCode: ${newCode}`);
}

fs.writeFileSync(configPath, updated);
console.log(`✅ Version bumped to ${newVersion}`);
console.log(`  Run: npm run build to create new APK`);
