import { execSync } from "child_process";
import { mkdirSync, rmSync, cpSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

/** Builds a clean, store-ready zip: production manifest (no
    localhost:3000 -- that's dev-only config, not something a Chrome
    Web Store listing should ship) + only the files the extension
    actually needs at runtime. No node_modules, test-pages, .map
    files, tsconfig, or other dev artifacts. */

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const STAGE = path.join(ROOT, "release", "stage");
const OUT_DIR = path.join(ROOT, "release");

console.log("Building...");
execSync("npm run build", { cwd: ROOT, stdio: "inherit" });

rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });

const manifest = JSON.parse(readFileSync(path.join(ROOT, "manifest.json"), "utf-8"));
const stripLocalhost = (arr) => arr.filter((m) => !m.startsWith("http://localhost"));
manifest.host_permissions = stripLocalhost(manifest.host_permissions);
manifest.externally_connectable.matches = stripLocalhost(manifest.externally_connectable.matches);
writeFileSync(path.join(STAGE, "manifest.json"), JSON.stringify(manifest, null, 2));

cpSync(path.join(ROOT, "icons"), path.join(STAGE, "icons"), { recursive: true });
mkdirSync(path.join(STAGE, "src", "popup"), { recursive: true });
cpSync(path.join(ROOT, "src", "popup", "popup.html"), path.join(STAGE, "src", "popup", "popup.html"));

cpSync(path.join(ROOT, "dist"), path.join(STAGE, "dist"), {
  recursive: true,
  filter: (src) => !src.endsWith(".map"),
});

const zipName = `knowbefore-extension-v${manifest.version}.zip`;
const zipPath = path.join(OUT_DIR, zipName);
if (existsSync(zipPath)) rmSync(zipPath);
execSync(`zip -rq "${zipPath}" .`, { cwd: STAGE, stdio: "inherit" });

rmSync(STAGE, { recursive: true, force: true });
console.log(`\nPackaged: release/${zipName}`);
