import {
  toHex, utf8, utf8Decode, BLOCK_SIZE, randomKey, makeCounterBlock, aesCtrEncrypt,
} from "./crypto.mjs";
import {
  ProfileService, flipCiphertextSubstring,
  twoTimePadXor, knownPlaintextRecover, cribDrag,
  DocumentEditorService, recoverPlaintextViaEditOracle,
  simulateCounterRollover,
  gcmTokenRoundtrip, encryptThenMacTokenRoundtrip,
} from "./attacks.mjs";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
function verdict(el, kind, html) {
  el.className = `verdict show ${kind}`;
  el.innerHTML = html;
}

// ===========================================================================
// Vector 1: Precision Bit-Flipping
// ===========================================================================
const profileService = new ProfileService();
let lastIssuedToken = null;
let lastIssuedPlaintext = null;

async function issueNormalToken() {
  const email = $("v1-email").value.trim() || "alice@example.com";
  lastIssuedPlaintext = `email=${email.replace(/[&=;]/g, "_")}&uid=1000&role=user`;
  lastIssuedToken = await profileService.issueToken(email);
  const role = await profileService.roleForToken(lastIssuedToken);

  $("v1-out").innerHTML =
    `<div class="diff-box">` +
    `<strong>Issued Plaintext:</strong> <code>${esc(lastIssuedPlaintext)}</code><br>` +
    `<strong style="margin-top:6px;display:inline-block">Ciphertext (AES-CTR):</strong> <code>${toHex(lastIssuedToken)}</code><br>` +
    `<strong style="margin-top:6px;display:inline-block">Server verified role:</strong> <span class="clean">${esc(role)}</span>` +
    `</div>`;

  verdict($("v1-verdict"), "good", `Standard token issued. Server decrypted and verified role = <strong>${esc(role)}</strong>.`);
}

async function runBitFlip() {
  if (!lastIssuedToken) {
    await issueNormalToken();
  }
  const targetRole = $("v1-role").value; // "root" or "admn" — both 4 bytes
  const oldSub = "user";
  // Both option values are already 4 bytes, matching "user" — CTR bit-flipping
  // cannot change length, so the target must be the same size as what it replaces.
  const newSub = targetRole === "admn" ? "admn" : "root";

  const { tampered, offset, delta } = flipCiphertextSubstring(lastIssuedToken, lastIssuedPlaintext, oldSub, newSub);
  const forgedRole = await profileService.roleForToken(tampered);
  const fullPlaintext = await profileService.fullPlaintextForToken(tampered);

  const tamperedHex = toHex(tampered);
  const hexStart = offset * 2;
  const hexLen = oldSub.length * 2;

  const highlightedCt =
    esc(tamperedHex.slice(0, hexStart)) +
    `<span class="flip">${esc(tamperedHex.slice(hexStart, hexStart + hexLen))}</span>` +
    esc(tamperedHex.slice(hexStart + hexLen));

  $("v1-out").innerHTML =
    `<div class="diff-box">` +
    `<strong>Tampered Ciphertext (Delta injected at byte ${offset}):</strong><br><code>${highlightedCt}</code><br>` +
    `<strong style="margin-top:6px;display:inline-block">Injected XOR Delta (hex):</strong> <code>${toHex(delta)}</code> ("${oldSub}" ⊕ "${newSub}")<br>` +
    `<strong style="margin-top:6px;display:inline-block">Server Decrypted Plaintext:</strong> <code>${esc(fullPlaintext)}</code><br>` +
    `<strong style="margin-top:6px;display:inline-block">Server Accepted Role:</strong> <span class="flip">${esc(forgedRole)}</span>` +
    `</div>`;

  verdict($("v1-verdict"), "bad",
    `<strong>Privilege Escalation Succeeded!</strong> Flipping 4 ciphertext bytes modified the decrypted role to <strong>${esc(forgedRole)}</strong> with zero decryption errors and zero corruption of surrounding bytes.`
  );
}

// ===========================================================================
// Vector 2: Two-Time Pad & Crib Dragging
// ===========================================================================
let currentXorStream = null;
let ct1Global = null;
let ct2Global = null;

async function runTwoTimePadEncrypt() {
  const p1Str = $("v2-p1").value;
  const p2Str = $("v2-p2").value;
  const key = randomKey();
  const counter = makeCounterBlock();

  const { ciphertext: c1 } = await aesCtrEncrypt(key, utf8(p1Str), counter);
  const { ciphertext: c2 } = await aesCtrEncrypt(key, utf8(p2Str), counter);

  ct1Global = c1;
  ct2Global = c2;
  currentXorStream = twoTimePadXor(c1, c2);

  $("v2-xor-hex").textContent = toHex(currentXorStream);
  $("v2-crib-offset").max = Math.max(0, currentXorStream.length - 1);
  $("v2-crib-offset").value = 0;
  updateCribView();

  verdict($("v2-verdict"), "bad",
    `<strong>Keystream S has cancelled out!</strong> <code>C₁ ⊕ C₂ = P₁ ⊕ P₂</code>. The shared key has zero influence on this XOR stream.`
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
    `Candidate plaintext under crib at offset ${offset}: <strong>"${esc(res.candidateText)}"</strong>` +
    `<br><span class="muted">Printable: <code>${esc(res.printableText)}</code></span>`;
}

function runKnownPlaintextRecover() {
  if (!currentXorStream) return;
  const knownP1 = $("v2-p1").value;
  const recovered = knownPlaintextRecover(ct1Global, ct2Global, utf8(knownP1));
  $("v2-recovered-p2").textContent = utf8Decode(recovered);
  verdict($("v2-verdict"), "bad",
    `<strong>Full Message 2 Recovered:</strong> Using known plaintext P₁, Message 2 was computed instantly as <code>P₂ = (C₁ ⊕ C₂) ⊕ P₁</code> without any brute-force or key search.`
  );
}

// ===========================================================================
// Vector 3: Random-Access Edit Oracle
// ===========================================================================
let documentService = null;

async function initDocOracle() {
  const secretText = $("v3-doc-text").value;
  documentService = new DocumentEditorService(secretText);
  const ct = await documentService.init();

  $("v3-orig-ct").textContent = toHex(ct);
  $("v3-recovered-text").textContent = "[Awaiting keystream extraction]";
  $("v3-verdict").className = "verdict";
}

async function runDocExtraction() {
  if (!documentService) await initDocOracle();
  const { rawKeystream, recoveredText } = await recoverPlaintextViaEditOracle(documentService);

  $("v3-keystream").textContent = toHex(rawKeystream);
  $("v3-recovered-text").innerHTML = `<span class="flip">${esc(recoveredText)}</span>`;

  verdict($("v3-verdict"), "bad",
    `<strong>100% of Plaintext Recovered in a Single Request!</strong> By requesting an edit with <code>0x00</code> bytes, the oracle returned <code>0x00 ⊕ S = S</code> (raw keystream). XORing with original ciphertext produced the entire secret.`
  );
}

// ===========================================================================
// Vector 4: Counter Rollover Simulation
// ===========================================================================
async function runCounterRollover() {
  const bits = parseInt($("v4-bits").value, 10);
  const key = randomKey();
  const baseCounter = new Uint8Array(BLOCK_SIZE);
  const { blocks, duplicates } = await simulateCounterRollover(key, baseCounter, bits, 8);

  const listHtml = blocks.map((b) => {
    const isDup = duplicates.some((d) => d.duplicateBlockIndex === b.blockIndex);
    return `<div class="blk ${isDup ? "match" : ""}">` +
           `<div class="blk-label">Block ${b.blockIndex + 1} (Counter: ${b.counterVal})</div>` +
           `<div class="blk-hex">${b.keystreamHex.slice(0, 16)}…</div>` +
           (isDup ? `<div class="blk-tag">⚠ Duplicate Keystream</div>` : "") +
           `</div>`;
  }).join("");

  $("v4-blocks-out").innerHTML = listHtml;

  if (duplicates.length > 0) {
    verdict($("v4-verdict"), "bad",
      `<strong>Counter Overflow Detected:</strong> With a ${bits}-bit counter (max value ${(1 << bits) - 1}), the counter wrapped, reproducing identical keystream blocks. Long streams or packet counters that wrap reuse keystream and cause two-time pad vulnerability within the same session.`
    );
  }
}

// ===========================================================================
// Defensive Controls: AES-GCM & Encrypt-then-MAC
// ===========================================================================
async function runGcmDefense() {
  const email = $("def-email").value.trim() || "alice@example.com";
  const { tamperRejected, decryptedProfile } = await gcmTokenRoundtrip(email);

  $("def-gcm-out").innerHTML =
    `<div class="diff-box">` +
    `Clean decryption: <code>${esc(decryptedProfile)}</code><br>` +
    `Tamper result: <strong style="color:var(--green)">${tamperRejected ? "REJECTED (Authentication tag validation failed)" : "ACCEPTED"}</strong>` +
    `</div>`;

  verdict($("def-verdict"), "good",
    `<strong>AEAD Defense Verified:</strong> AES-GCM verified the 128-bit GHASH-based authentication tag before returning any plaintext. Flipping 1 bit caused decryption to abort immediately, stopping the privilege escalation attack.`
  );
}

async function runEtmDefense() {
  const email = $("def-email").value.trim() || "alice@example.com";
  const { tamperRejected, decryptedProfile } = await encryptThenMacTokenRoundtrip(email);

  $("def-etm-out").innerHTML =
    `<div class="diff-box">` +
    `Clean decryption: <code>${esc(decryptedProfile)}</code><br>` +
    `Tamper result: <strong style="color:var(--green)">${tamperRejected ? "REJECTED (HMAC verification failed)" : "ACCEPTED"}</strong>` +
    `</div>`;

  verdict($("def-verdict"), "good",
    `<strong>Encrypt-then-MAC Verified:</strong> HMAC-SHA256 authenticated the counter and ciphertext. Any tampering failed constant-time MAC verification before AES-CTR decryption was even attempted.`
  );
}

// ===========================================================================
// Event Listeners
// ===========================================================================
addEventListener("DOMContentLoaded", () => {
  // Vector 1
  $("v1-issue").addEventListener("click", issueNormalToken);
  $("v1-flip").addEventListener("click", runBitFlip);

  // Vector 2
  $("v2-encrypt").addEventListener("click", runTwoTimePadEncrypt);
  $("v2-crib-input").addEventListener("input", updateCribView);
  $("v2-crib-offset").addEventListener("input", updateCribView);
  $("v2-known-p1").addEventListener("click", runKnownPlaintextRecover);

  // Vector 3
  $("v3-init").addEventListener("click", initDocOracle);
  $("v3-extract").addEventListener("click", runDocExtraction);

  // Vector 4
  $("v4-run").addEventListener("click", runCounterRollover);

  // Defensive
  $("def-gcm").addEventListener("click", runGcmDefense);
  $("def-etm").addEventListener("click", runEtmDefense);

  // Initial runs
  issueNormalToken();
  runTwoTimePadEncrypt();
  initDocOracle();
  runCounterRollover();
});
