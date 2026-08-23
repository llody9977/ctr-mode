// Executes the two defensive code samples published in docs/index.html.
//
// The samples are guidance, not illustration — readers copy them. Testing the
// repository's own crypto.mjs proves nothing about the snippets on the page: the
// two are deliberately different (the samples use the 96/32 counter split meant
// for production, crypto.mjs uses a 64/64 helper), so an edit to the HTML can
// break the published code while every other test stays green.
//
// The samples are extracted from the page itself rather than duplicated here, so
// this file cannot drift from what a reader actually copies.
//
// Run: `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PAGE = fileURLToPath(new URL("../docs/index.html", import.meta.url));

// `concat` is referenced by the Encrypt-then-MAC sample; the page says so and
// points at docs/js/crypto.mjs for it. Supplied here so the samples run as a unit.
const PRELUDE = `
function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrays) { out.set(a, o); o += a.length; }
  return out;
}
`;

function unescapeHtml(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

async function loadSamples() {
  const page = await readFile(PAGE, "utf8");
  const blocks = [...page.matchAll(/<pre><code>(.*?)<\/code><\/pre>/gs)].map((m) => unescapeHtml(m[1]));
  assert.equal(blocks.length, 2, "expected exactly the two published defensive samples");

  const exported = ["seal", "unseal", "sealEtM", "openEtM"];
  const source = `${PRELUDE}\n${blocks.join("\n")}\nexport { ${exported.join(", ")} };`;
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

const utf8 = (s) => new TextEncoder().encode(s);
const utf8Decode = (b) => new TextDecoder().decode(b);
const randomKey = (n = 32) => crypto.getRandomValues(new Uint8Array(n));

test("published samples parse and export the functions the page documents", async () => {
  const m = await loadSamples();
  for (const name of ["seal", "unseal", "sealEtM", "openEtM"]) {
    assert.equal(typeof m[name], "function", `${name} must be defined by the published sample`);
  }
});

test("Option A sample — AES-GCM round-trips and rejects a 1-bit tamper", async () => {
  const { seal, unseal } = await loadSamples();
  const key = randomKey(32);
  const aad = utf8("v1|msg-42");
  const message = utf8("transfer 500 to account 100");

  const { nonce, ciphertext } = await seal(key, message, aad);
  assert.equal(nonce.length, 12, "the sample must use a 96-bit nonce");
  assert.equal(ciphertext.length, message.length + 16, "ciphertext must carry the 128-bit tag");
  assert.equal(utf8Decode(await unseal(key, nonce, ciphertext, aad)), utf8Decode(message));

  const tampered = new Uint8Array(ciphertext);
  tampered[0] ^= 1;
  await assert.rejects(() => unseal(key, nonce, tampered, aad), "a flipped bit must fail the tag");
});

test("Option A sample — AES-GCM rejects mismatched associated data", async () => {
  const { seal, unseal } = await loadSamples();
  const key = randomKey(32);
  const { nonce, ciphertext } = await seal(key, utf8("balance 100"), utf8("recipient=alice"));
  // AAD is authenticated but not encrypted: swapping it must fail, which is what
  // makes it the right place for a message number or recipient identifier.
  await assert.rejects(() => unseal(key, nonce, ciphertext, utf8("recipient=mallory")));
});

test("Option B sample — Encrypt-then-MAC round-trips and rejects a 1-bit tamper", async () => {
  const { sealEtM, openEtM } = await loadSamples();
  const encKey = randomKey(16);
  const macKey = randomKey(32);
  const message = utf8("email=alice@example.com&uid=1000&role=user");

  const payload = await sealEtM(encKey, macKey, message);
  assert.equal(payload.length, 16 + message.length + 32, "payload is counter ‖ ciphertext ‖ tag");
  assert.equal(utf8Decode(await openEtM(encKey, macKey, payload)), utf8Decode(message));

  // Flip a bit inside the ciphertext, past the 16-byte counter block.
  const tampered = new Uint8Array(payload);
  tampered[16] ^= 1;
  await assert.rejects(() => openEtM(encKey, macKey, tampered), /authentication failed/);
});

test("Option B sample — the tag covers the counter block, not just the ciphertext", async () => {
  const { sealEtM, openEtM } = await loadSamples();
  const encKey = randomKey(16);
  const macKey = randomKey(32);
  const payload = await sealEtM(encKey, macKey, utf8("role=user"));

  // Rule 2 on the page: a tag over the ciphertext alone would leave the counter
  // block attacker-controlled. Swapping a counter byte must fail the tag.
  const swapped = new Uint8Array(payload);
  swapped[0] ^= 0xff;
  await assert.rejects(() => openEtM(encKey, macKey, swapped), /authentication failed/);
});

test("Option B sample — truncation is rejected, and a short payload fails closed", async () => {
  const { sealEtM, openEtM } = await loadSamples();
  const encKey = randomKey(16);
  const macKey = randomKey(32);
  const payload = await sealEtM(encKey, macKey, utf8('{"user":"alice","admin":false}'));

  // CTR needs no padding, so a truncated ciphertext is still well-formed. Only the
  // tag rejects it — this is the failure the page's "Truncation" bullet describes.
  await assert.rejects(() => openEtM(encKey, macKey, payload.slice(0, payload.length - 8)));
  await assert.rejects(() => openEtM(encKey, macKey, payload.slice(0, 40)), /payload too short/);
});

test("Option B sample — independent keys: the MAC key cannot decrypt", async () => {
  const { sealEtM, openEtM } = await loadSamples();
  const encKey = randomKey(16);
  const macKey = randomKey(32);
  const payload = await sealEtM(encKey, macKey, utf8("role=user"));

  // Rule 1: the composition result assumes the two keys are independently chosen.
  // A wrong MAC key must fail before any decryption is attempted.
  await assert.rejects(() => openEtM(encKey, randomKey(32), payload), /authentication failed/);
});
