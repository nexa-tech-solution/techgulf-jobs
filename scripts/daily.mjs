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
if (sync === 2) {
  console.warn("\nSync finished with some sources failed. Check the lines marked FAILED above.");
  if (process.env.GITHUB_ACTIONS) console.log("::warning::Some job sources failed to sync. Check the lines marked FAILED.");
} else if (sync !== 0) console.warn("\nSync crashed.");
const digest = run("2/2 Email digest", "send-digest.mjs");

console.log(`\nSync: ${sync === 0 ? "OK" : sync === 2 ? "partial" : "had errors"}. Email: ${digest === 0 ? "OK" : "had errors"}.`);
// Partial sync (2) is a warning, not a failure.
process.exitCode = (sync !== 0 && sync !== 2) || digest ? 1 : 0;
