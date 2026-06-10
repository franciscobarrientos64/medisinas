// Genera src/version.js con el número de versión que vive en src/build.json.
// Se ejecuta en `prestart` y `prebuild` (local y Vercel). El número es un contador
// versionado (src/build.json) que se incrementa en cada cambio que desplegamos,
// así la etiqueta del TopNav es un número limpio y consistente en todos lados.
const fs = require("fs");
const path = require("path");

let n = "?";
try {
  n = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src", "build.json"), "utf8")).n;
} catch {}

const out = path.join(__dirname, "..", "src", "version.js");
fs.writeFileSync(out, `// Generado por scripts/gen-version.js — no editar a mano.\nexport const VERSION = ${JSON.stringify(String(n))};\n`);
console.log("[gen-version] VERSION =", n);
