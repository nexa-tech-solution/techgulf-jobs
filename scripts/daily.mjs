// The one command to run each day: syncs jobs, then emails users about the new ones.
//   npm run daily               real run
//   npm run daily -- --dry-run  preview both steps, writes and sends nothing
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const extra = process.argv.slice(2).filter((a) => a === "--dry-run");

const run = (label, file) => {
  console.log(`\n=== ${label} ===`);
  return spawnSync(process.execPath, [join(here, file), ...extra], { stdio: "inherit", env: process.env }).status ?? 1;
};

const sync = run("1/2 Sync jobs", "sync-jobs.mjs");
// One failed source leaves its old jobs in place, so new jobs from the others can still go out.
if (sync !== 0) console.warn("\nSync finished with errors. Check the lines marked FAILED above.");
const digest = run("2/2 Email digest", "send-digest.mjs");

console.log(`\nSync: ${sync === 0 ? "OK" : "had errors"}. Email: ${digest === 0 ? "OK" : "had errors"}.`);
process.exitCode = sync || digest ? 1 : 0;
