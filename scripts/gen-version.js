// Genera src/version.js con un identificador de versión derivado del commit de git.
// Se ejecuta automáticamente en `prestart` y `prebuild` (local y Vercel), así la
// etiqueta de versión del TopNav cambia sola en cada cambio que desplegamos.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function shortSha() {
  // Vercel expone el SHA aunque el clone sea shallow.
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev";
  }
}

const version = shortSha();
const out = path.join(__dirname, "..", "src", "version.js");
fs.writeFileSync(out, `// Generado por scripts/gen-version.js — no editar a mano.\nexport const VERSION = ${JSON.stringify(version)};\n`);
console.log("[gen-version] VERSION =", version);
