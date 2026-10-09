// Copies the standalone viewer (the repo root) into media/, which is what the extension serves.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const media = join(root, "vscode", "media");

rmSync(media, { recursive: true, force: true });
mkdirSync(join(media, "assets"), { recursive: true });
for (const file of ["index.html", "viewer.js", "viewer.css", "validator-worker.mjs", "validator-core.mjs", "demo-data.js"]) {
  cpSync(join(root, file), join(media, file));
}
cpSync(join(root, "vendor"), join(media, "vendor"), { recursive: true });
cpSync(join(root, "schema"), join(media, "schema"), { recursive: true });
cpSync(join(root, "assets", "doclang_v3_sail.svg"), join(media, "assets", "doclang_v3_sail.svg"));
console.log(`viewer synced to ${media}`);
