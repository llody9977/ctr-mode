// Guards against dead exports in the published modules.
//
// These modules are a reference implementation: readers copy from them. An export
// that nothing references is code presented as usable that the test suite never
// exercises and no reviewer re-checks — and it is how a superseded framing survives
// a decision that removed it (an AES-CBC helper kept "for comparison with chaining
// mode" outlived the comparison itself, which had already been cut from the page
// for pitting CTR against an option the reader cannot actually select).
//
// Lint does not cover this: `no-unused-vars` is module-local and an export is, by
// definition, used from the module's own point of view.
//
// Run: `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { basename } from "node:path";

const ROOT = new URL("../", import.meta.url);
const MODULES = ["docs/js/crypto.mjs", "docs/js/attacks.mjs", "docs/js/html.mjs"];

// Every file that may legitimately reference an export.
async function consumerFiles() {
  const files = ["docs/index.html", ...MODULES];
  for (const dir of ["docs/js", "test"]) {
    for (const name of await readdir(new URL(dir, ROOT))) {
      if (name.endsWith(".mjs")) files.push(`${dir}/${name}`);
    }
  }
  return [...new Set(files)];
}

// `export const x`, `export function x`, `export async function x`, `export class x`.
const EXPORT_RE = /^export\s+(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm;

test("no module exports a symbol nothing else references", async () => {
  const consumers = await consumerFiles();
  const sources = new Map();
  for (const path of consumers) {
    sources.set(path, await readFile(new URL(path, ROOT), "utf8"));
  }

  const dead = [];
  for (const modulePath of MODULES) {
    const source = sources.get(modulePath);
    for (const [, name] of source.matchAll(EXPORT_RE)) {
      // A JS identifier may contain `$`, which is a regex metacharacter, so the
      // name is quoted before interpolation.
      const quoted = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // `\b` is the wrong boundary here: `$` is not a word character, so `\b\$foo`
      // never matches `( $foo )` and a live `$`-prefixed export reads as dead.
      // These lookarounds use the actual JS identifier character set instead.
      // No `g` flag either — `test` on a global regex advances lastIndex between
      // calls, so one reused across the lines below starts each search partway
      // into the next line and misses references.
      const pattern = new RegExp(`(?<![\\w$])${quoted}(?![\\w$])`);
      const declaration = new RegExp(
        `^export\\s+(?:async\\s+)?(?:const|let|function|class)\\s+${quoted}(?![\\w$])`);

      // Count references anywhere except the line that declares it.
      const referenced = consumers.some((path) => {
        const text = sources.get(path);
        if (path !== modulePath) return pattern.test(text);
        // Same module: ignore the declaration itself, count any other mention.
        return text.split("\n")
          .some((line) => !declaration.test(line) && pattern.test(line));
      });
      if (!referenced) dead.push(`${basename(modulePath)} → ${name}`);
    }
  }

  assert.deepEqual(
    dead, [],
    `unreferenced export(s) — delete them, or reference them from the page or tests:\n  ${dead.join("\n  ")}`
  );
});
