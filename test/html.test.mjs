// Verifies that HTML construction is safe by default.
// Run: `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, raw, html } from "../docs/js/html.mjs";

test("esc escapes angle brackets AND quotes", () => {
  assert.equal(esc("<b>&</b>"), "&lt;b&gt;&amp;&lt;/b&gt;");
  assert.equal(esc('a"b'), "a&quot;b");
  assert.equal(esc("a'b"), "a&#39;b");
  // Regression: angle-bracket-only escaping left quotes intact, which cannot
  // protect an attribute context.
  assert.ok(!esc('x" onmouseover="alert(1)').includes('"'), "no bare quote may survive");
});

test("html escapes every interpolated value by default", () => {
  const evil = '<img src=x onerror="alert(1)">';
  const out = html`<div>${evil}</div>`;
  assert.ok(!out.includes("<img"), "markup must not survive interpolation");
  assert.ok(out.includes("&lt;img"), "it must appear escaped");
  assert.equal(out, `<div>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</div>`);
});

test("html neutralises an attribute-context breakout", () => {
  // The hazard that angle-bracket-only escaping could not stop.
  const evil = 'x" onmouseover="alert(1)';
  const out = html`<div class="scheme ${evil}">hi</div>`;
  assert.ok(!/onmouseover=["']?alert/.test(out), "must not produce a live handler");
  assert.equal(out, `<div class="scheme x&quot; onmouseover=&quot;alert(1)">hi</div>`);
});

test("raw passes through markup this project built itself", () => {
  const built = html`<span class="flip">${"<script>"}</span>`;
  assert.equal(built, `<span class="flip">&lt;script&gt;</span>`);
  // Wrapped in raw() the already-escaped markup survives intact...
  assert.equal(html`<code>${raw(built)}</code>`, `<code><span class="flip">&lt;script&gt;</span></code>`);
  // ...and without raw() it is escaped again — a visible rendering bug, never a
  // security one. That is the correct direction for the failure to fall.
  assert.ok(html`<code>${built}</code>`.includes("&lt;span"));
});

test("html handles the awkward value types without opening a hole", () => {
  assert.equal(html`${null}`, "null");
  assert.equal(html`${undefined}`, "undefined");
  assert.equal(html`${0}`, "0");
  assert.equal(html`${["<a>", "<b>"]}`, "&lt;a&gt;,&lt;b&gt;");
  assert.equal(html`no interpolation`, "no interpolation");
  assert.equal(html`${1}-${2}-${3}`, "1-2-3");
});
