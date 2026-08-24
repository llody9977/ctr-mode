// Guards the mathematical notation rendered inside the generated figures.
//
// A figure is content, not decoration, and it fails review differently from prose:
// text baked into an SVG is invisible to the greps that check the page, it passes
// every XML, link and generator-correspondence check, and it detaches from its
// caption the moment someone pastes it into a slide. This suite shipped because
// modes-ctr-etm-gcm.svg asserted "C[i] ⊕ Δ = P[i] ⊕ Δ" — a ciphertext value
// equated to a plaintext value, which differ by the keystream — while the prose
// beside it had the relation right and every other figure said "decrypts to".
//
// The rule encoded here: an equality may not have ciphertext-space on one side
// and plaintext-space on the other. Crossing between the two requires the
// keystream, so an equation that crosses without naming S is wrong.
//
// Run: `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const DIAGRAMS = new URL("../docs/diagrams/", import.meta.url);

// Text nodes only: attribute values carry coordinates and colours, not claims.
//
// The closing delimiter is a lookahead, not a consumed character. `<text …>` is
// immediately followed by `<tspan …>`, so consuming that `<` would swallow the
// start of the next tag and silently skip every tspan that carries the actual
// words — which is how the first draft of this guard "passed" against six
// figures while reading almost none of their text.
function figureText(svg) {
  return [...svg.matchAll(/<(?:text|tspan)\b[^>]*>([^<]*)(?=<)/g)]
    .map((m) => m[1])
    .map((s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"))
    .filter((s) => s.trim());
}

// Which space an expression lands in, or null when it cannot be decided.
//
// XOR is self-inverse, so an even number of same-space terms is a *difference*
// between two values in that space rather than a value in it: C₁ ⊕ C₂ is not a
// ciphertext, which is exactly why C₁ ⊕ C₂ = P₁ ⊕ P₂ is sound. An odd count is a
// value in that space. Naming S means the expression crosses spaces deliberately,
// so it is left alone.
function space(side) {
  if (/\bS\b|Sᵢ|E_K|keystream/i.test(side)) return null;   // crosses via the keystream
  const ciphertext = (side.match(/C(?:\[i\]|[₁₂₃ᵢ']|\b)/g) ?? []).length;
  const plaintext = (side.match(/P(?:\[i\]|[₁₂₃ᵢ']|\b)/g) ?? []).length;
  if (ciphertext % 2 === 1 && plaintext === 0) return "ciphertext";
  if (plaintext % 2 === 1 && ciphertext === 0) return "plaintext";
  return null;
}

// Every "a = b" pair in one line, including the chained a = b = c form.
// Not exported: nothing outside this file consumes it, and an unreferenced
// export is the exact fault test/exports.test.mjs forbids in docs/js — that
// guard does not reach test/, so the rule is honoured by hand here.
function unsoundEquations(line) {
  const bad = [];
  for (const equation of line.split(/[;,]|\s—\s/)) {
    const sides = equation.split("=").map((s) => s.trim()).filter(Boolean);
    if (sides.length < 2) continue;
    for (let i = 0; i < sides.length - 1; i++) {
      const left = space(sides[i]);
      const right = space(sides[i + 1]);
      if (left && right && left !== right) {
        bad.push(`${sides[i]} = ${sides[i + 1]} (${left} = ${right})`);
      }
    }
  }
  return bad;
}

test("the guard itself fires on the fault it exists to catch", () => {
  // The exact string that shipped, and the shapes next to it that are sound.
  assert.deepEqual(
    unsoundEquations("Malleable: C[i] ⊕ Δ = P[i] ⊕ Δ").length, 1,
    "a ciphertext value equated to a plaintext value must be rejected");
  assert.deepEqual(unsoundEquations("C = P ⊕ Δ").length, 1);

  for (const sound of [
    "Reused nonce ⇒ C₁ ⊕ C₂ = P₁ ⊕ P₂",          // both sides are differences
    "C = P ⊕ S",                                  // crosses via the keystream
    "P = C ⊕ S — whole plaintext, one request",
    "C₁ ⊕ C₂ = (P₁ ⊕ S) ⊕ (P₂ ⊕ S) = P₁ ⊕ P₂",
    "P₂ = (C₁ ⊕ C₂) ⊕ P₁",
    "C ⊕ Δ decrypts to P ⊕ Δ",                    // a relation, not an equality
    "Malleable: C[i] ⊕ Δ decrypts to",
  ]) {
    assert.deepEqual(unsoundEquations(sound), [], `must accept: ${sound}`);
  }
});

test("no committed figure equates a ciphertext expression to a plaintext one", async () => {
  const names = (await readdir(DIAGRAMS)).filter((n) => n.endsWith(".svg"));
  assert.ok(names.length >= 6, "expected the figure set to be present");

  const found = [];
  for (const name of names) {
    const svg = await readFile(new URL(name, DIAGRAMS), "utf8");
    for (const line of figureText(svg)) {
      for (const bad of unsoundEquations(line)) found.push(`${name}: ${bad}`);
    }
  }

  assert.deepEqual(found, [], `unsound equation(s) in generated figures:\n  ${found.join("\n  ")}`);
});

test("every figure carries its own scope line naming educational use", async () => {
  // A figure detaches from the page. Dual-use framing that lives only in the
  // surrounding prose does not travel with it, so each one states its own.
  const names = (await readdir(DIAGRAMS)).filter((n) => n.endsWith(".svg"));
  const missing = [];
  for (const name of names) {
    // Each scope line is its own text node, so take the whole node rather than
    // splitting on "." — the lines name source files, and "attacks.mjs" would
    // truncate the sentence before the words being checked for.
    const scope = figureText(await readFile(new URL(name, DIAGRAMS), "utf8"))
      .find((node) => node.includes("Scope:"));
    if (!scope) missing.push(`${name}: no "Scope:" line`);
    else if (!/educational|defensive/i.test(scope)) {
      missing.push(`${name}: scope line does not name educational or defensive use — ${scope}`);
    }
  }
  assert.deepEqual(missing, [], `figure scope problems:\n  ${missing.join("\n  ")}`);
});
