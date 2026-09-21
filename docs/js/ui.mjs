import {
  toHex, utf8, utf8Decode, BLOCK_SIZE, randomKey, makeCounterBlock, aesCtrEncrypt,
} from "./crypto.mjs";
import {
  ProfileService, flipCiphertextSubstring,
  twoTimePadXor, knownPlaintextRecover, cribDrag,
  DocumentEditorService, recoverPlaintextViaEditOracle,
  simulateCounterRollover,
  compareTamperDetection,
} from "./attacks.mjs";
import { raw, html } from "./html.mjs";

const $ = (id) => document.getElementById(id);

function verdict(el, kind, markup) {
  el.className = `verdict show ${kind}`;
  el.innerHTML = markup;
}

// ===========================================================================
// Vector 1: Precision Bit-Flipping
// ===========================================================================
const profileService = new ProfileService();
let lastIssuedToken = null;
let lastIssuedPlaintext = null;
// The account the held token was actually issued for, as distinct from whatever
// the input currently shows. Same rule as Vectors 2 and 3: the demonstration must
// report on the account the reader is looking at, not one they have since edited away.
let issuedEmail = null;

function currentEmail() {
  return $("v1-email").value.trim() || "alice@example.com";
}

async function issueNormalToken() {
  const email = currentEmail();
  issuedEmail = email;
  lastIssuedPlaintext = `email=${email.replace(/[&=;]/g, "_")}&uid=1000&role=user`;
  lastIssuedToken = await profileService.issueToken(email);
  const role = await profileService.roleForToken(lastIssuedToken);

  $("v1-out").innerHTML = html`<div class="diff-box">` +
    html`<strong>Issued Plaintext:</strong> <code>${lastIssuedPlaintext}</code><br>` +
    html`<strong style="margin-top:6px;display:inline-block">Ciphertext (AES-CTR):</strong> <code>${toHex(lastIssuedToken)}</code><br>` +
    html`<strong style="margin-top:6px;display:inline-block">Server verified role:</strong> <span class="clean">${role}</span>` +
    html`</div>`;

  verdict($("v1-verdict"), "good", html`Standard token issued. Server decrypted and verified role = <strong>${role}</strong>.`);
}

async function runBitFlip() {
  // Re-issue when the account has changed, so the forged token belongs to the
  // address on screen rather than to a previously issued one.
  if (!lastIssuedToken || issuedEmail !== currentEmail()) {
    await issueNormalToken();
  }
  const targetRole = $("v1-role").value; // "root" or "admn" — both 4 bytes
  const oldSub = "user";
  // Both option values are already 4 bytes, matching "user" — CTR bit-flipping
  // cannot change length, so the target must be the same size as what it replaces.
  const newSub = targetRole === "admn" ? "admn" : "root";

  // Anchored on the role field: "user" can also occur in the attacker-supplied
  // email (user@example.com), and an unanchored search would flip that instead.
  const { tampered, offset, delta } = flipCiphertextSubstring(lastIssuedToken, lastIssuedPlaintext, oldSub, newSub, "role=");
  const forgedRole = await profileService.roleForToken(tampered);
  const fullPlaintext = await profileService.fullPlaintextForToken(tampered);
  const forged = forgedRole === newSub;

  const tamperedHex = toHex(tampered);
  const hexStart = offset * 2;
  const hexLen = oldSub.length * 2;

  const highlightedCt =
    html`${tamperedHex.slice(0, hexStart)}` +
    html`<span class="flip">${tamperedHex.slice(hexStart, hexStart + hexLen)}</span>` +
    html`${tamperedHex.slice(hexStart + hexLen)}`;

  $("v1-out").innerHTML = html`<div class="diff-box">` +
    html`<strong>Tampered Ciphertext (Delta injected at byte ${offset}):</strong><br><code>${raw(highlightedCt)}</code><br>` +
    html`<strong style="margin-top:6px;display:inline-block">Injected XOR Delta (hex):</strong> <code>${toHex(delta)}</code> ("${oldSub}" ⊕ "${newSub}")<br>` +
    html`<strong style="margin-top:6px;display:inline-block">Server Decrypted Plaintext:</strong> <code>${fullPlaintext}</code><br>` +
    html`<strong style="margin-top:6px;display:inline-block">Server Accepted Role:</strong> <span class="${forged ? "flip" : "clean"}">${forgedRole}</span>` +
    html`</div>`;

  // Derived from what the server actually returned, never asserted in advance.
  verdict($("v1-verdict"), forged ? "bad" : "good",
    forged
      ? html`<strong>Privilege Escalation Succeeded!</strong> Flipping ${delta.length} ciphertext bytes modified the decrypted role to <strong>${forgedRole}</strong> with zero decryption errors and zero corruption of surrounding bytes.`
      : html`<strong>No escalation.</strong> The server still reports role = <strong>${forgedRole}</strong>, so this tamper did not forge the target field.`
  );
}

// ===========================================================================
// Vector 2: Two-Time Pad & Crib Dragging
// ===========================================================================
let currentXorStream = null;
let ct1Global = null;
let ct2Global = null;
// What was actually encrypted, as distinct from what the inputs currently show.
// The attacker's "known plaintext" is the message that was sent, not whatever the
// box was edited to afterwards; conflating the two recovers garbage while the
// demonstration reports a successful recovery.
let encryptedP1 = null;
let encryptedP2 = null;

function twoTimePadIsStale() {
  return encryptedP1 !== $("v2-p1").value || encryptedP2 !== $("v2-p2").value;
}

function markTwoTimePadStale() {
  if (!currentXorStream) return;
  $("v2-stale").textContent = twoTimePadIsStale()
    ? "Inputs edited since encryption — press “Encrypt both” to encrypt these messages."
    : "";
}

async function runTwoTimePadEncrypt() {
  const p1Str = $("v2-p1").value;
  const p2Str = $("v2-p2").value;
  const key = randomKey();
  const counter = makeCounterBlock();

  const { ciphertext: c1 } = await aesCtrEncrypt(key, utf8(p1Str), counter);
  const { ciphertext: c2 } = await aesCtrEncrypt(key, utf8(p2Str), counter);

  ct1Global = c1;
  ct2Global = c2;
  encryptedP1 = p1Str;
  encryptedP2 = p2Str;
  $("v2-stale").textContent = "";
  currentXorStream = twoTimePadXor(c1, c2);

  $("v2-xor-hex").textContent = toHex(currentXorStream);
  $("v2-crib-offset").max = Math.max(0, currentXorStream.length - 1);
  $("v2-crib-offset").value = 0;
  updateCribView();

  verdict($("v2-verdict"), "bad",
    html`<strong>Keystream S has cancelled out!</strong> <code>C₁ ⊕ C₂ = P₁ ⊕ P₂</code>. The shared key has zero influence on this XOR stream.`
  );
}

function updateCribView() {
  if (!currentXorStream) return;
  const cribStr = $("v2-crib-input").value;
  const offset = parseInt($("v2-crib-offset").value, 10) || 0;
  $("v2-offset-val").textContent = offset;

  // Bound-check in BYTES, not JS characters: cribDrag re-encodes the crib as UTF-8,
  // so a multi-byte crib ("café") is longer than its .length suggests and would
  // otherwise pass this guard and then throw inside cribDrag.
  const cribBytes = utf8(cribStr).length;
  if (cribBytes === 0 || offset + cribBytes > currentXorStream.length) {
    $("v2-crib-result").textContent = "[Crib length exceeds remaining XOR stream length at this offset]";
    return;
  }

  const res = cribDrag(currentXorStream, cribStr, offset);
  $("v2-crib-result").innerHTML =
    html`Candidate plaintext under crib at offset ${offset}: <strong>"${res.candidateText}"</strong>` +
    html`<br><span class="muted">Printable: <code>${res.printableText}</code></span>`;
}

function runKnownPlaintextRecover() {
  if (!currentXorStream) return;
  // The known plaintext is the message that was encrypted, not the current input.
  const recovered = utf8Decode(knownPlaintextRecover(ct1Global, ct2Global, utf8(encryptedP1)));
  $("v2-recovered-p2").textContent = recovered;

  const exact = recovered === encryptedP2;
  verdict($("v2-verdict"), exact ? "bad" : "good",
    exact
      ? html`<strong>Full Message 2 Recovered:</strong> Using known plaintext P₁, Message 2 was computed instantly as <code>P₂ = (C₁ ⊕ C₂) ⊕ P₁</code> without any brute-force or key search.`
      : html`<strong>Partial recovery.</strong> Only the ${recovered.length} bytes covered by the known P₁ were recovered; the rest of Message 2 stays hidden because the XOR stream beyond that offset has no known plaintext to cancel against.`
  );
  markTwoTimePadStale();
}

// ===========================================================================
// Vector 3: Random-Access Edit Oracle
// ===========================================================================
let documentService = null;
// The text the oracle actually holds. The textarea is an input to encryption, not
// a view of server state: editing it after initialisation would otherwise leave the
// box showing one document while the attack recovers another.
let storedDocument = null;

async function initDocOracle() {
  storedDocument = $("v3-doc-text").value;
  documentService = new DocumentEditorService(storedDocument);
  const ct = await documentService.init();

  $("v3-orig-ct").textContent = toHex(ct);
  $("v3-keystream").textContent = "[Awaiting extraction]";
  $("v3-recovered-text").textContent = "[Awaiting keystream extraction]";
  $("v3-verdict").className = "verdict";
}

async function runDocExtraction() {
  // Re-encrypt whenever the document has been edited, so the recovered plaintext
  // is always the document the reader is looking at.
  if (!documentService || storedDocument !== $("v3-doc-text").value) await initDocOracle();
  const { rawKeystream, recoveredText } = await recoverPlaintextViaEditOracle(documentService);

  $("v3-keystream").textContent = toHex(rawKeystream);
  $("v3-recovered-text").innerHTML = html`<span class="flip">${recoveredText}</span>`;

  const complete = recoveredText === storedDocument;
  verdict($("v3-verdict"), complete ? "bad" : "good",
    complete
      ? html`<strong>100% of Plaintext Recovered in a Single Request!</strong> By requesting an edit with <code>0x00</code> bytes, the oracle returned <code>0x00 ⊕ S = S</code> (raw keystream). XORing with original ciphertext produced the entire secret.`
      : html`<strong>Recovery incomplete.</strong> The extracted keystream did not reproduce the stored document, so this run does not demonstrate the attack.`
  );
}

// ===========================================================================
// Vector 4: Counter Rollover Simulation
// ===========================================================================
async function runCounterRollover() {
  const bits = parseInt($("v4-bits").value, 10);
  const key = randomKey();
  const baseCounter = new Uint8Array(BLOCK_SIZE);
  // Scale the run to the counter width. A fixed block count wraps a 2-bit counter
  // but exactly fills a 3-bit one, producing eight distinct keystreams and no
  // collision at all — the opposite of what this demonstration exists to show.
  // Two full cycles, so every keystream block is visibly regenerated once.
  const numBlocks = 2 ** bits * 2;
  const { blocks, duplicates, maxCounterValue } = await simulateCounterRollover(key, baseCounter, bits, numBlocks);

  const listHtml = blocks.map((b) => {
    const isDup = duplicates.some((d) => d.duplicateBlockIndex === b.blockIndex);
    return html`<div class="blk ${isDup ? "match" : ""}">` +
           html`<div class="blk-label">Block ${b.blockIndex + 1} (Counter: ${b.counterVal})</div>` +
           html`<div class="blk-hex">${b.keystreamHex.slice(0, 16)}…</div>` +
           (isDup ? html`<div class="blk-tag">⚠ Duplicate Keystream</div>` : "") +
           html`</div>`;
  }).join("");

  $("v4-blocks-out").innerHTML = listHtml;

  // Written on both branches. Leaving the previous run's banner in place let a
  // clean sequence sit under a red "Counter Overflow Detected" verdict naming a
  // counter width the reader had not selected.
  verdict($("v4-verdict"), duplicates.length > 0 ? "bad" : "good",
    duplicates.length > 0
      ? html`<strong>Counter Overflow Detected:</strong> With a ${bits}-bit counter (max value ${maxCounterValue}), ${numBlocks} blocks exhausted the ${maxCounterValue + 1} counter states and wrapped, regenerating ${duplicates.length} identical keystream blocks. Long streams or packet counters that wrap reuse keystream and cause two-time pad vulnerability within the same session.`
      : html`<strong>No collision in this run.</strong> ${numBlocks} blocks did not exhaust the ${maxCounterValue + 1} states of a ${bits}-bit counter, so every counter block stayed distinct.`
  );
}

// ===========================================================================
// Defensive Controls — the same forgery against all three options
// ===========================================================================

// Highlight the bytes the attacker flipped, at their real position in the hex.
function markTamper(hex, byteOffset, byteLen) {
  const a = byteOffset * 2;
  const b = a + byteLen * 2;
  return html`${hex.slice(0, a)}` + html`<span class="flip">${hex.slice(a, b)}</span>` + html`${hex.slice(b)}`;
}

function schemeCard(index, r, deltaLen) {
  const blocked = r.detected;
  const badge = blocked
    ? html`<span class="badge pass">Tampering detected</span>`
    : html`<span class="badge fail">Forgery accepted</span>`;
  const before = r.payloadHex ?? r.ciphertextHex;
  const label = r.payloadHex ? "Payload (counter ‖ ciphertext ‖ HMAC)" : "Ciphertext";

  const outcome = blocked
    ? html`<strong>Server returned:</strong> <span class="clean">nothing — ${r.error}</span><br>` +
      html`<span class="muted">The tag was checked before decryption, so no plaintext was ever produced.</span>`
    : html`<strong>Server decrypted:</strong> <code>${r.plaintextReturned}</code><br>` +
      html`<strong style="margin-top:6px;display:inline-block">Role accepted:</strong> <span class="flip">${r.roleAccepted}</span>`;

  return html`<div class="scheme ${blocked ? "pass" : "fail"}">` +
    html`<div class="scheme-head"><span class="scheme-name">${index} · ${r.scheme}</span>${raw(badge)}</div>` +
    html`<div class="diff-box">` +
      html`<strong>${label} after tampering:</strong><br>` +
      html`<code class="hexline">${raw(markTamper(r.tamperedHex, r.tamperOffset, deltaLen))}</code><br>` +
      html`<span class="muted">unchanged original: <code class="hexline">${before.slice(0, 48)}…</code></span><br>` +
      html`<div style="margin-top:8px">${raw(outcome)}</div>` +
    html`</div></div>`;
}

async function runDefenceComparison() {
  const email = $("def-email").value.trim() || "alice@example.com";
  const btn = $("def-run");
  btn.disabled = true;
  try {
    const cmp = await compareTamperDetection(email);
    const deltaLen = cmp.deltaHex.length / 2;

    $("def-attack").innerHTML = html`<div class="diff-box">` +
      html`<strong>Issued plaintext:</strong> <code>${cmp.profile}</code><br>` +
      html`<strong style="margin-top:6px;display:inline-block">Attacker's move (identical in all three):</strong> ` +
      html`XOR <code>${cmp.deltaHex}</code> into the ciphertext at byte ${cmp.offset}, ` +
      html`turning <code>role=${cmp.oldRole}</code> into <code>role=${cmp.newRole}</code>.` +
      html`</div>`;

    $("def-results").innerHTML = cmp.results.map((r, i) => schemeCard(i + 1, r, deltaLen)).join("");

    // Named from the actual outcomes rather than asserting the expected ones.
    const rejected = cmp.results.filter((r) => r.detected);
    const accepted = cmp.results.filter((r) => !r.detected);
    const names = (rs) => rs.map((r) => r.scheme).join(" and ") || "none";
    // Branch on the security property, not on the display name — a scheme rename
    // would otherwise silently flip every run to "Unexpected outcome".
    const asExpected = accepted.length === 1 && !accepted[0].authenticated && rejected.every((r) => r.authenticated);

    verdict($("def-verdict"), asExpected ? "good" : "bad",
      asExpected
        ? html`<strong>Same attack, three outcomes.</strong> Raw AES-CTR had no tag to check, so the forged ` +
          html`<code>role=${cmp.results[0].roleAccepted}</code> was decrypted and accepted. ${names(rejected)} ` +
          html`rejected the identical modification before returning any plaintext. The keystream encryption is the ` +
          html`same in all three — only the authentication differs.`
        : html`<strong>Unexpected outcome.</strong> Accepted the forgery: ${names(accepted)}. Rejected it: ${names(rejected)}.`
    );
  } finally {
    btn.disabled = false;
  }
}

// ===========================================================================
// Event Listeners
// ===========================================================================
addEventListener("DOMContentLoaded", () => {
  for (const el of document.querySelectorAll(".verdict")) {
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
  }

  // Vector 1
  $("v1-issue").addEventListener("click", issueNormalToken);
  $("v1-flip").addEventListener("click", runBitFlip);

  // Vector 2
  $("v2-encrypt").addEventListener("click", runTwoTimePadEncrypt);
  $("v2-crib-input").addEventListener("input", updateCribView);
  $("v2-crib-offset").addEventListener("input", updateCribView);
  $("v2-known-p1").addEventListener("click", runKnownPlaintextRecover);
  $("v2-p1").addEventListener("input", markTwoTimePadStale);
  $("v2-p2").addEventListener("input", markTwoTimePadStale);

  // Vector 3
  $("v3-init").addEventListener("click", initDocOracle);
  $("v3-extract").addEventListener("click", runDocExtraction);

  // Vector 4
  $("v4-run").addEventListener("click", runCounterRollover);

  // Defensive
  $("def-run").addEventListener("click", runDefenceComparison);

  // Initial runs
  issueNormalToken();
  runTwoTimePadEncrypt();
  initDocOracle();
  runCounterRollover();
  runDefenceComparison();
});
