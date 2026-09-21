// The four CTR attack vectors and defensive controls.
//
// Educational & defensive security research.
// All oracles and services here run locally in-process against self-contained
// demonstration data — no network requests and no third-party systems are involved.

import {
  BLOCK_SIZE, aesCtrEncrypt, aesCtrDecrypt, aesGcmEncrypt, aesGcmDecrypt,
  encryptThenMacEncrypt, encryptThenMacDecrypt,
  randomKey, makeCounterBlock, xorBytes,
  toHex, utf8, utf8Decode, latin1Encode, latin1Decode,
} from "./crypto.mjs";

// ===========================================================================
// Vector 1 — Stream Cipher Malleability / Precision Bit-Flipping
// Cryptopals Set 4 Challenge 26.
//
// CTR encryption is C = P XOR S. Because there is zero error propagation,
// modifying ciphertext byte C[i] by XORing delta predictably modifies the
// decrypted plaintext byte P[i] by the exact same delta:
// (C[i] XOR delta) XOR S[i] = (P[i] XOR S[i] XOR delta) XOR S[i] = P[i] XOR delta.
// ===========================================================================

export class ProfileService {
  constructor(key = randomKey()) {
    this.key = key;
    this.fixedCounter = makeCounterBlock();
  }

  // Issue encrypted session token: email=SANITIZED&uid=1000&role=user
  // Sanitizes ';' and '=' to prevent simple parameter injection at token creation
  async issueToken(email) {
    const sanitized = String(email).replace(/[&=;]/g, "_");
    const profile = `email=${sanitized}&uid=1000&role=user`;
    const { ciphertext } = await aesCtrEncrypt(this.key, latin1Encode(profile), this.fixedCounter);
    return ciphertext;
  }

  // Parse token and extract role from decrypted plaintext
  async roleForToken(token) {
    let plaintextBytes;
    try {
      plaintextBytes = await aesCtrDecrypt(this.key, token, this.fixedCounter);
    } catch {
      return null;
    }
    const plaintext = latin1Decode(plaintextBytes);
    const params = new URLSearchParams(plaintext);
    return params.get("role") ?? null;
  }

  async fullPlaintextForToken(token) {
    try {
      const plaintextBytes = await aesCtrDecrypt(this.key, token, this.fixedCounter);
      return latin1Decode(plaintextBytes);
    } catch {
      return null;
    }
  }
}

// Flip target substring in ciphertext without knowing the key.
//
// `anchor` names the field the target belongs to (e.g. "role="), and the target
// must sit immediately after it. Without an anchor the target must be unique in
// the plaintext, because part of that plaintext is attacker-supplied: an account
// like user@example.com puts "user" in the email as well as the role, and an
// unanchored first-occurrence search silently flips the email instead — producing
// a tampered token whose role never changed while the demonstration reports a
// successful escalation. Ambiguity therefore fails loudly rather than guessing.
export function flipCiphertextSubstring(ciphertext, fullKnownPlaintext, oldSubstring, newSubstring, anchor = null) {
  if (oldSubstring.length !== newSubstring.length) {
    throw new Error("old and new substrings must be equal length for in-place bit flipping");
  }

  let offset;
  if (anchor === null) {
    offset = fullKnownPlaintext.indexOf(oldSubstring);
    if (offset === -1) {
      throw new Error(`substring "${oldSubstring}" not found in expected plaintext`);
    }
    if (fullKnownPlaintext.indexOf(oldSubstring, offset + 1) !== -1) {
      throw new Error(`substring "${oldSubstring}" is ambiguous in the plaintext — pass an anchor to name the target field`);
    }
  } else {
    const anchorAt = fullKnownPlaintext.indexOf(anchor);
    if (anchorAt === -1) {
      throw new Error(`anchor "${anchor}" not found in expected plaintext`);
    }
    offset = anchorAt + anchor.length;
    if (fullKnownPlaintext.slice(offset, offset + oldSubstring.length) !== oldSubstring) {
      throw new Error(`expected "${oldSubstring}" immediately after anchor "${anchor}"`);
    }
  }
  const tampered = new Uint8Array(ciphertext);
  const oldBytes = latin1Encode(oldSubstring);
  const newBytes = latin1Encode(newSubstring);
  for (let i = 0; i < oldBytes.length; i++) {
    tampered[offset + i] ^= oldBytes[i] ^ newBytes[i];
  }
  return { tampered, offset, delta: xorBytes(oldBytes, newBytes) };
}

// ===========================================================================
// Vector 2 — Keystream Reuse / Two-Time Pad & Crib-Dragging
// Cryptopals Set 3 Challenges 19 & 20.
//
// If two messages are encrypted under the same (Key, Nonce):
// C1 = P1 XOR S,  C2 = P2 XOR S  ==>  C1 XOR C2 = P1 XOR P2.
// The keystream S cancels out completely, exposing the XOR sum of plaintexts.
// ===========================================================================

export function twoTimePadXor(c1, c2) {
  return xorBytes(c1, c2);
}

// Recover P2 given C1, C2 and known P1 fragment
export function knownPlaintextRecover(c1, c2, knownP1Bytes, offset = 0) {
  const xorStream = twoTimePadXor(c1, c2);
  const availableLen = Math.min(knownP1Bytes.length, xorStream.length - offset);
  if (availableLen <= 0) return new Uint8Array(0);
  const recoveredP2 = new Uint8Array(availableLen);
  for (let i = 0; i < availableLen; i++) {
    recoveredP2[i] = xorStream[offset + i] ^ knownP1Bytes[i];
  }
  return recoveredP2;
}

// Drag a candidate word (crib) across the XOR stream at a given offset
export function cribDrag(xorStream, cribString, offset) {
  const cribBytes = utf8(cribString);
  if (offset < 0 || offset + cribBytes.length > xorStream.length) {
    throw new Error("crib drag offset out of bounds");
  }
  const result = new Uint8Array(cribBytes.length);
  for (let i = 0; i < cribBytes.length; i++) {
    result[i] = xorStream[offset + i] ^ cribBytes[i];
  }
  return {
    offset,
    crib: cribString,
    candidateBytes: result,
    candidateText: utf8Decode(result),
    printableText: [...result].map((x) => (x >= 32 && x < 127 ? String.fromCharCode(x) : "·")).join(""),
  };
}

// ===========================================================================
// Vector 3 — Random-Access Read/Write Keystream Extraction (Chosen-Ciphertext)
// Cryptopals Set 4 Challenge 25.
//
// Systems exposing random access seek/edit APIs (e.g. disk encryption blocks,
// document editor endpoints) let an attacker ask for the stored content to be
// replaced with all-zero PLAINTEXT. The server re-encrypts under the same key and
// counter, so the ciphertext it returns is 0x00 XOR S = S — the keystream itself.
// ===========================================================================

export class DocumentEditorService {
  constructor(initialPlaintext = "CONFIDENTIAL: Project Manhattan coordinates 40.7128N, 74.0060W. Budget: $14.2M.", key = randomKey()) {
    this.key = key;
    this.counter = makeCounterBlock();
    this.plaintext = utf8(initialPlaintext);
    this.ciphertext = null;
  }

  async init() {
    const { ciphertext } = await aesCtrEncrypt(this.key, this.plaintext, this.counter);
    this.ciphertext = ciphertext;
    return this.ciphertext;
  }

  getCiphertext() {
    return new Uint8Array(this.ciphertext);
  }

  // API endpoint: edit(ciphertext, offset, newPlaintextBytes)
  // Decrypts ciphertext, overwrites plaintext at offset, re-encrypts under same key+counter
  async edit(ciphertext, offset, newPlaintextBytes) {
    const pt = await aesCtrDecrypt(this.key, ciphertext, this.counter);
    const updatedPt = new Uint8Array(Math.max(pt.length, offset + newPlaintextBytes.length));
    updatedPt.set(pt, 0);
    updatedPt.set(newPlaintextBytes, offset);
    const { ciphertext: newCt } = await aesCtrEncrypt(this.key, updatedPt, this.counter);
    return newCt;
  }
}

// Single-pass full plaintext recovery via edit oracle
export async function recoverPlaintextViaEditOracle(editorService) {
  const originalCt = editorService.getCiphertext();
  // Submit all-zero plaintext; the re-encrypted result is 0x00 XOR S = S
  const zeroBytes = new Uint8Array(originalCt.length);
  const rawKeystream = await editorService.edit(originalCt, 0, zeroBytes);
  // Original plaintext is C XOR S
  const recoveredPlaintextBytes = xorBytes(originalCt, rawKeystream);
  return {
    rawKeystream,
    recoveredBytes: recoveredPlaintextBytes,
    recoveredText: utf8Decode(recoveredPlaintextBytes),
  };
}

// ===========================================================================
// Vector 4 — Counter Rollover & Duplicate Keystream Generation
//
// If counter field length L is small (e.g. 16 bits) or if a large stream is
// processed without rekeying, counter value wraps modulo 2^L, reproducing
// identical keystream blocks within the same stream or session.
// ===========================================================================

// The defaults must actually roll over: `numBlocks` has to exceed the 2^counterBits
// states, or the counter never wraps and no duplicate keystream is produced. A wide
// counter (say 16 bits) over a handful of blocks demonstrates the opposite of the
// point, so the defaults model a deliberately tiny 2-bit field.
// Uses 2 ** counterBits rather than 1 << counterBits: JS bitwise operands are
// coerced to *signed* 32-bit, so 1 << 31 is negative and 1 << 32 wraps to 1.
export async function simulateCounterRollover(keyBytes, initialCounterBlock, counterBits = 2, numBlocks = 8) {
  if (!Number.isInteger(counterBits) || counterBits < 1 || counterBits > 16) {
    throw new RangeError("counterBits must be an integer from 1 to 16 for this simulator");
  }
  if (!Number.isInteger(numBlocks) || numBlocks < 1) {
    throw new RangeError("numBlocks must be a positive integer");
  }
  if (!(initialCounterBlock instanceof Uint8Array) || initialCounterBlock.length !== BLOCK_SIZE) {
    throw new TypeError(`initialCounterBlock must be a ${BLOCK_SIZE}-byte Uint8Array`);
  }
  const states = 2 ** counterBits;
  const maxCounterValue = states - 1;
  // Enforced, not merely documented: a caller that widens the counter without
  // widening the run produces a clean sequence with no collision at all, which
  // demonstrates the opposite of this function's purpose. Fail rather than return
  // an empty `duplicates` array that a caller may render as a successful run.
  if (numBlocks <= states) {
    throw new Error(
      `numBlocks (${numBlocks}) must exceed the ${states} counter states for a ${counterBits}-bit field, or the counter never wraps`
    );
  }
  const blocks = [];
  const keystreamBlocks = [];
  const duplicates = [];

  for (let i = 0; i < numBlocks; i++) {
    const counterVal = i % states;
    const blockCounter = new Uint8Array(initialCounterBlock);
    // write counter value in big-endian at the end of block
    const byteOffset = BLOCK_SIZE - 2;
    blockCounter[byteOffset] = (counterVal >> 8) & 0xff;
    blockCounter[byteOffset + 1] = counterVal & 0xff;

    // Encrypt 1 block of zeros to get keystream
    const { ciphertext } = await aesCtrEncrypt(keyBytes, new Uint8Array(BLOCK_SIZE), blockCounter, 128);
    const hex = toHex(ciphertext);
    blocks.push({ blockIndex: i, counterVal, counterHex: toHex(blockCounter), keystreamHex: hex });

    const prevIdx = keystreamBlocks.indexOf(hex);
    if (prevIdx !== -1) {
      duplicates.push({ firstBlockIndex: prevIdx, duplicateBlockIndex: i, keystreamHex: hex });
    }
    keystreamBlocks.push(hex);
  }

  return { maxCounterValue, blocks, duplicates };
}

// ===========================================================================
// Defensive Controls
// 1. AES-GCM (AEAD): Nonce + GHASH-based authentication tag
// 2. Encrypt-then-MAC (AES-CTR + HMAC-SHA256): Constant-time verification before decrypt
// ===========================================================================

// Run the identical forgery against all three options so the only variable is
// what authenticates the ciphertext. Same profile, same target field, same XOR
// delta, same byte offset — only the outcome differs.
//
// All three therefore encrypt under a 256-bit key. Key size cannot change the
// outcome here — malleability is a property of the mode, not the key length —
// but leaving CTR on AES-128 while GCM ran AES-256 made "the only variable is
// the authentication" literally untrue, and a demonstration that holds all but
// one variable constant has to actually do it.
const COMPARISON_KEY_BYTES = 32;

export async function compareTamperDetection(email, oldRole = "user", newRole = "root") {
  if (oldRole.length !== newRole.length) {
    throw new Error("target roles must be equal length — CTR bit-flipping cannot change length");
  }
  const profile = `email=${String(email).replace(/[&=;]/g, "_")}&uid=1000&role=${oldRole}`;
  const offset = profile.indexOf(`role=${oldRole}`) + "role=".length;
  const delta = xorBytes(latin1Encode(oldRole), latin1Encode(newRole));
  const applyDelta = (bytes, at) => {
    const out = new Uint8Array(bytes);
    for (let i = 0; i < delta.length; i++) out[at + i] ^= delta[i];
    return out;
  };

  // 1 — Raw AES-CTR. Nothing authenticates the ciphertext.
  const ctrKey = randomKey(COMPARISON_KEY_BYTES);
  const ctrCounter = makeCounterBlock();
  const { ciphertext: ctrCt } = await aesCtrEncrypt(ctrKey, latin1Encode(profile), ctrCounter);
  const ctrTampered = applyDelta(ctrCt, offset);
  const ctrPlaintext = latin1Decode(await aesCtrDecrypt(ctrKey, ctrTampered, ctrCounter));
  const ctr = {
    scheme: "AES-CTR alone",
    // Whether the scheme authenticates its ciphertext at all — the one property
    // the comparison turns on. Callers must branch on this rather than on the
    // display name, which is prose and free to change.
    authenticated: false,
    tamperOffset: offset,
    ciphertextHex: toHex(ctrCt),
    tamperedHex: toHex(ctrTampered),
    detected: false,                       // no tag exists to fail
    plaintextReturned: ctrPlaintext,
    roleAccepted: new URLSearchParams(ctrPlaintext).get("role"),
  };

  // 2 — Encrypt-then-MAC. Payload is counter ‖ ciphertext ‖ tag.
  const etmEncKey = randomKey(COMPARISON_KEY_BYTES);
  const etmMacKey = randomKey(32);
  const { payload } = await encryptThenMacEncrypt(etmEncKey, etmMacKey, latin1Encode(profile));
  const etmTampered = applyDelta(payload, BLOCK_SIZE + offset);
  const etm = { scheme: "AES-CTR + HMAC-SHA256", authenticated: true, tamperOffset: BLOCK_SIZE + offset, payloadHex: toHex(payload), tamperedHex: toHex(etmTampered) };
  try {
    etm.plaintextReturned = latin1Decode(await encryptThenMacDecrypt(etmEncKey, etmMacKey, etmTampered));
    etm.detected = false;
    etm.roleAccepted = new URLSearchParams(etm.plaintextReturned).get("role");
  } catch (err) {
    etm.detected = true;                   // HMAC verification failed before decryption
    etm.plaintextReturned = null;
    etm.roleAccepted = null;
    etm.error = err.message;
  }

  // 3 — AES-GCM. Web Crypto returns ciphertext ‖ tag, so the offset is unchanged.
  const gcmKey = randomKey(COMPARISON_KEY_BYTES);
  const { nonce, ciphertext: gcmCt } = await aesGcmEncrypt(gcmKey, latin1Encode(profile));
  const gcmTampered = applyDelta(gcmCt, offset);
  const gcm = { scheme: "AES-GCM", authenticated: true, tamperOffset: offset, nonceHex: toHex(nonce), ciphertextHex: toHex(gcmCt), tamperedHex: toHex(gcmTampered) };
  try {
    gcm.plaintextReturned = latin1Decode(await aesGcmDecrypt(gcmKey, nonce, gcmTampered));
    gcm.detected = false;
    gcm.roleAccepted = new URLSearchParams(gcm.plaintextReturned).get("role");
  } catch (err) {
    gcm.detected = true;                   // GHASH tag check failed before plaintext was released
    gcm.plaintextReturned = null;
    gcm.roleAccepted = null;
    gcm.error = err.message || "authentication tag verification failed";
  }

  return { profile, offset, deltaHex: toHex(delta), oldRole, newRole, results: [ctr, etm, gcm] };
}

export async function gcmTokenRoundtrip(email, key = randomKey()) {
  const profile = `email=${String(email).replace(/[&=;]/g, "_")}&uid=1000&role=user`;
  const { nonce, ciphertext } = await aesGcmEncrypt(key, latin1Encode(profile));

  // Tamper 1 bit in ciphertext (at the role position)
  const tampered = new Uint8Array(ciphertext);
  tampered[profile.indexOf("role=user") + 5] ^= 1;

  let tamperRejected = false;
  try {
    await aesGcmDecrypt(key, nonce, tampered);
  } catch {
    tamperRejected = true;
  }

  const cleanBytes = await aesGcmDecrypt(key, nonce, ciphertext);
  return { tamperRejected, decryptedProfile: latin1Decode(cleanBytes) };
}

export async function encryptThenMacTokenRoundtrip(email, encKey = randomKey(16), macKey = randomKey(32)) {
  const profile = `email=${String(email).replace(/[&=;]/g, "_")}&uid=1000&role=user`;
  const { payload } = await encryptThenMacEncrypt(encKey, macKey, latin1Encode(profile));

  // Tamper 1 bit in ciphertext payload
  const tampered = new Uint8Array(payload);
  tampered[BLOCK_SIZE + profile.indexOf("role=user") + 5] ^= 1;

  let tamperRejected = false;
  try {
    await encryptThenMacDecrypt(encKey, macKey, tampered);
  } catch {
    tamperRejected = true;
  }

  const cleanBytes = await encryptThenMacDecrypt(encKey, macKey, payload);
  return { tamperRejected, decryptedProfile: latin1Decode(cleanBytes) };
}
