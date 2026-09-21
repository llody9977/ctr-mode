// Verifies the browser crypto and attack logic against real AES — including the
// NIST SP 800-38A AES-128-CTR test vectors and RFC 3686 test vectors.
// Run: `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  aesCtrEncrypt, aesCtrDecrypt, aesCtrKeystream,
  fromHex, toHex, utf8, utf8Decode,
  xorBytes, randomKey, makeCounterBlock,
} from "../docs/js/crypto.mjs";
import {
  ProfileService, flipCiphertextSubstring,
  twoTimePadXor, knownPlaintextRecover, cribDrag,
  DocumentEditorService, recoverPlaintextViaEditOracle,
  simulateCounterRollover,
  gcmTokenRoundtrip, encryptThenMacTokenRoundtrip, compareTamperDetection,
} from "../docs/js/attacks.mjs";

test("AES-128-CTR encrypt matches NIST SP 800-38A F.5.1 test vectors", async () => {
  const key = fromHex("2b7e151628aed2a6abf7158809cf4f3c");
  const pt = fromHex(
    "6bc1bee22e409f96e93d7e117393172a" + "ae2d8a571e03ac9c9eb76fac45af8e51" +
    "30c81c46a35ce411e5fbc1191a0a52ef" + "f69f2445df4f9b17ad2b417be66c3710"
  );
  const counter = fromHex("f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff");
  const want =
    "874d6191b620e3261bef6864990db6ce" + "9806f66b7970fdff8617187bb9fffdff" +
    "5ae4df3edbd5d35e5b4f09020db03eab" + "1e031dda2fbe03d1792170a0f3009cee";

  const { ciphertext: ct } = await aesCtrEncrypt(key, pt, counter, 128);
  assert.equal(toHex(ct), want);
});

test("AES-128-CTR decrypt matches NIST SP 800-38A F.5.2 test vectors", async () => {
  const key = fromHex("2b7e151628aed2a6abf7158809cf4f3c");
  const ct = fromHex(
    "874d6191b620e3261bef6864990db6ce" + "9806f66b7970fdff8617187bb9fffdff" +
    "5ae4df3edbd5d35e5b4f09020db03eab" + "1e031dda2fbe03d1792170a0f3009cee"
  );
  const counter = fromHex("f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff");
  const want =
    "6bc1bee22e409f96e93d7e117393172a" + "ae2d8a571e03ac9c9eb76fac45af8e51" +
    "30c81c46a35ce411e5fbc1191a0a52ef" + "f69f2445df4f9b17ad2b417be66c3710";

  const pt = await aesCtrDecrypt(key, ct, counter, 128);
  assert.equal(toHex(pt), want);
});

test("AES-128-CTR matches RFC 3686 Test Vector #1 (16 octets)", async () => {
  // RFC 3686 §6. The counter block is nonce(4) || IV(8) || block counter(4),
  // and the block counter starts at 1 — hence counterLength = 32 here, not 64.
  const key = fromHex("ae6852f8121067cc4bf7a5765577f39e");
  const counter = fromHex("00000030" + "0000000000000000" + "00000001");
  const pt = utf8("Single block msg");
  assert.equal(toHex(pt), "53696e676c6520626c6f636b206d7367", "RFC 3686 plaintext octets");

  const { ciphertext: ct } = await aesCtrEncrypt(key, pt, counter, 32);
  assert.equal(toHex(ct), "e4095d4fb7a7b3792d6175a3261311b8");

  // The RFC also publishes the keystream, which lets us check the claim the whole
  // repo rests on — that encrypting zeros under (key, counter) yields S itself.
  const keystream = await aesCtrKeystream(key, 16, counter, 32);
  assert.equal(toHex(keystream), "b7603328dbc2931b410e16c8067e62df");
});

test("AES-128-CTR matches RFC 3686 Test Vector #2 (32 octets, spans two counter blocks)", async () => {
  const key = fromHex("7e24067817fae0d743d6ce1f32539163");
  const counter = fromHex("006cb6db" + "c0543b59da48d90b" + "00000001");
  const pt = fromHex("000102030405060708090a0b0c0d0e0f" + "101112131415161718191a1b1c1d1e1f");
  const want = "5104a106168a72d9790d41ee8edad388" + "eb2e1efc46da57c8fce630df9141be28";

  const { ciphertext: ct } = await aesCtrEncrypt(key, pt, counter, 32);
  assert.equal(toHex(ct), want);

  // Round-trips, and the two published keystream blocks concatenate as expected.
  assert.equal(toHex(await aesCtrDecrypt(key, ct, counter, 32)), toHex(pt));
  const keystream = await aesCtrKeystream(key, 32, counter, 32);
  assert.equal(
    toHex(keystream),
    "5105a305128f74de71044be582d7dd87" + "fb3f0cef52cf41dfe4ff2ac48d5ca037"
  );
});

test("Encrypting all-zeros under CTR extracts raw keystream S", async () => {
  const key = randomKey();
  const counter = makeCounterBlock();
  const msg = utf8("Confidential payload under AES-CTR");

  const { ciphertext: ct } = await aesCtrEncrypt(key, msg, counter);
  const keystream = await aesCtrKeystream(key, msg.length, counter);

  const manualXor = xorBytes(msg, keystream);
  assert.equal(toHex(manualXor), toHex(ct));
});

test("crypto helpers reject malformed keys, counters, nonces, and hexadecimal input", async () => {
  assert.throws(() => fromHex("abc"), /even number/);
  assert.throws(() => fromHex("zz"), /hexadecimal/);
  assert.throws(() => makeCounterBlock(new Uint8Array(7)), /nonce must be 8 bytes/);
  await assert.rejects(
    () => aesCtrEncrypt(new Uint8Array(15), utf8("test"), new Uint8Array(16)),
    /AES key must be 16, 24, 32 bytes/
  );
  await assert.rejects(
    () => aesCtrEncrypt(randomKey(), utf8("test"), new Uint8Array(15)),
    /counter block must be 16 bytes/
  );
  await assert.rejects(
    () => aesCtrEncrypt(randomKey(), utf8("test"), new Uint8Array(16), 0),
    /counter length must be an integer from 1 to 128 bits/
  );
});

test("Vector 1 — Precision bit-flipping forges admin role with zero errors", async () => {
  const service = new ProfileService();
  const email = "alice@example.com";
  const token = await service.issueToken(email);

  assert.equal(await service.roleForToken(token), "user");

  const fullPlaintext = `email=${email}&uid=1000&role=user`;
  const { tampered } = flipCiphertextSubstring(token, fullPlaintext, "user", "root");

  assert.equal(await service.roleForToken(tampered), "root");
  assert.equal(await service.fullPlaintextForToken(tampered), `email=${email}&uid=1000&role=root`);
});

test("Vector 1 — the flip is anchored to the role field, not the first match", async () => {
  // Regression: the target substring was located with a plain indexOf, so an
  // account whose email contains "user" captured the flip. The email was rewritten
  // to "root@example.com", role stayed "user", and the demo still reported a
  // successful privilege escalation.
  const service = new ProfileService();
  const email = "user@example.com";
  const token = await service.issueToken(email);
  const fullPlaintext = `email=${email}&uid=1000&role=user`;

  const { tampered, offset } = flipCiphertextSubstring(token, fullPlaintext, "user", "root", "role=");

  assert.equal(offset, fullPlaintext.lastIndexOf("user"), "must target the role value, not the email");
  assert.equal(await service.roleForToken(tampered), "root");
  assert.equal(await service.fullPlaintextForToken(tampered), `email=${email}&uid=1000&role=root`);
});

test("Vector 1 — an ambiguous target fails loudly instead of flipping the wrong bytes", async () => {
  const service = new ProfileService();
  const token = await service.issueToken("user@example.com");
  const fullPlaintext = "email=user@example.com&uid=1000&role=user";

  // Unanchored and ambiguous: refuse rather than guess.
  assert.throws(() => flipCiphertextSubstring(token, fullPlaintext, "user", "root"), /ambiguous/);
  // A missing or misplaced anchor is also an error, never a silent fallback.
  assert.throws(() => flipCiphertextSubstring(token, fullPlaintext, "user", "root", "group="), /anchor "group=" not found/);
  assert.throws(() => flipCiphertextSubstring(token, fullPlaintext, "root", "user", "role="), /expected "root" immediately after/);
  // Unanchored still works where the target genuinely is unique.
  const unique = "email=alice@example.com&uid=1000&role=user";
  assert.doesNotThrow(() => flipCiphertextSubstring(token, unique, "user", "root"));
});

test("Vector 2 — Two-time pad keystream cancellation reveals plaintext XOR", async () => {
  const key = randomKey();
  const counter = makeCounterBlock();

  const p1 = utf8("TRANSFER $00500 TO ACCOUNT A100");
  const p2 = utf8("TRANSFER $99999 TO ACCOUNT B999");

  const { ciphertext: c1 } = await aesCtrEncrypt(key, p1, counter);
  const { ciphertext: c2 } = await aesCtrEncrypt(key, p2, counter);

  const xorCt = twoTimePadXor(c1, c2);
  const xorPt = xorBytes(p1, p2);
  assert.equal(toHex(xorCt), toHex(xorPt));

  // Known plaintext recovery
  const recoveredP2 = knownPlaintextRecover(c1, c2, p1);
  assert.equal(utf8Decode(recoveredP2), utf8Decode(p2));
});

test("Vector 2 — Crib dragging successfully recovers candidate text at target offset", async () => {
  const key = randomKey();
  const counter = makeCounterBlock();

  const p1 = utf8("The quick brown fox jumps over the lazy dog.");
  const p2 = utf8("An extraordinary meeting is planned tomorrow");

  const { ciphertext: c1 } = await aesCtrEncrypt(key, p1, counter);
  const { ciphertext: c2 } = await aesCtrEncrypt(key, p2, counter);

  const xorStream = twoTimePadXor(c1, c2);
  const dragResult = cribDrag(xorStream, "quick", 4);

  // At offset 4 in p2, the text is "xtrao"
  assert.equal(dragResult.candidateText, "xtrao");
});

test("Vector 3 — Document editor read/write oracle leaks 100% of secret plaintext", async () => {
  const secretText = "TOP SECRET: Nuclear launch facility alpha status GREEN.";
  const service = new DocumentEditorService(secretText);
  await service.init();

  const { recoveredText } = await recoverPlaintextViaEditOracle(service);
  assert.equal(recoveredText, secretText);
});

test("Vector 4 — Counter rollover produces duplicate keystream blocks across iterations", async () => {
  const key = randomKey();
  const baseCounter = new Uint8Array(16);
  // 2-bit counter: values 0, 1, 2, 3, then wraps to 0, 1...
  const { duplicates } = await simulateCounterRollover(key, baseCounter, 2, 6);

  assert.equal(duplicates.length, 2);
  assert.equal(duplicates[0].firstBlockIndex, 0);
  assert.equal(duplicates[0].duplicateBlockIndex, 4);
});

test("Vector 4 — default parameters actually roll over and collide", async () => {
  // Regression: the previous defaults (16-bit counter over 5 blocks) never wrapped,
  // so calling this with no tuning returned zero duplicates and demonstrated the
  // opposite of the point it exists to make.
  const { duplicates, maxCounterValue } = await simulateCounterRollover(randomKey(), new Uint8Array(16));
  assert.equal(maxCounterValue, 3, "2-bit counter has 4 states, max value 3");
  assert.ok(duplicates.length > 0, "defaults must produce at least one duplicate keystream block");
});

test("Vector 4 — a run too short to wrap the counter is rejected, not returned empty", async () => {
  // Regression: the UI ran a fixed 8 blocks for every counter width. A 3-bit
  // counter has exactly 8 states, so the run produced 8 distinct keystreams and
  // zero duplicates — demonstrating the opposite of the point — while the verdict
  // banner from the previous 2-bit run stayed on screen claiming a collision.
  const key = randomKey();
  const base = new Uint8Array(16);

  await assert.rejects(() => simulateCounterRollover(key, base, 3, 8), /must exceed the 8 counter states/);
  await assert.rejects(() => simulateCounterRollover(key, base, 2, 4), /must exceed the 4 counter states/);

  // The widths the UI offers, each scaled to two full cycles as the UI now does.
  for (const bits of [2, 3]) {
    const numBlocks = 2 ** bits * 2;
    const { duplicates, maxCounterValue } = await simulateCounterRollover(key, base, bits, numBlocks);
    assert.equal(maxCounterValue, 2 ** bits - 1);
    assert.equal(duplicates.length, 2 ** bits, `${bits}-bit counter must regenerate every keystream block once`);
  }
});

test("Vector 4 — simulator rejects unsupported counter fields and malformed blocks", async () => {
  const key = randomKey();
  await assert.rejects(() => simulateCounterRollover(key, new Uint8Array(16), 17, 4), /1 to 16/);
  await assert.rejects(() => simulateCounterRollover(key, new Uint8Array(15), 2, 8), /16-byte Uint8Array/);
});

test("Crib dragging is bounded in UTF-8 bytes, not JS characters", async () => {
  // Regression: the UI bound-checked crib length in JS characters while cribDrag
  // re-encodes to UTF-8, so a multi-byte crib slipped past the guard and threw.
  const xorStream = new Uint8Array(10);
  const crib = "café";            // 4 JS chars, 5 UTF-8 bytes
  assert.equal(crib.length, 4);
  assert.equal(utf8(crib).length, 5);

  // Offset 6 + 5 bytes = 11 > 10, so this is genuinely out of bounds and must throw.
  assert.throws(() => cribDrag(xorStream, crib, 6), /out of bounds/);
  // Offset 5 + 5 bytes = 10 fits exactly.
  assert.equal(cribDrag(xorStream, crib, 5).candidateBytes.length, 5);
});

test("Defensive — AES-GCM rejects 1-bit ciphertext tampering before role is read", async () => {
  const { tamperRejected, decryptedProfile } = await gcmTokenRoundtrip("bob@company.com");
  assert.equal(tamperRejected, true);
  assert.match(decryptedProfile, /role=user/);
});

test("Defensive — Encrypt-then-MAC (AES-CTR + HMAC) rejects 1-bit tampering", async () => {
  const { tamperRejected, decryptedProfile } = await encryptThenMacTokenRoundtrip("carol@secure.io");
  assert.equal(tamperRejected, true);
  assert.match(decryptedProfile, /role=user/);
});

test("Side-by-side — the identical forgery is undetected under CTR and rejected by both defenses", async () => {
  const { results, deltaHex, oldRole, newRole, profile, offset } = await compareTamperDetection("dave@example.com");
  const [ctr, etm, gcm] = results;

  // The comparison is only honest if all three received the same attack.
  assert.equal(oldRole, "user");
  assert.equal(newRole, "root");
  assert.equal(profile.slice(offset, offset + 4), "user", "offset must point at the role value");
  assert.equal(deltaHex, "071c0a06", '"user" XOR "root", byte for byte');

  // 1 — raw CTR silently accepts the forgery and hands back the forged plaintext.
  assert.equal(ctr.detected, false, "raw CTR has no tag that could fail");
  assert.equal(ctr.roleAccepted, "root", "the forged role is accepted");
  assert.match(ctr.plaintextReturned, /role=root/);
  assert.notEqual(ctr.ciphertextHex, ctr.tamperedHex);

  // The comparison's outcome must be derivable from the security property rather
  // than from a display name, so renaming a scheme cannot change what the UI concludes.
  assert.equal(ctr.authenticated, false, "raw CTR must be marked unauthenticated");
  assert.equal(etm.authenticated, true);
  assert.equal(gcm.authenticated, true);
  assert.equal(results.filter((r) => !r.authenticated && !r.detected).length, 1);
  assert.ok(results.filter((r) => r.authenticated).every((r) => r.detected), "every authenticated scheme must detect");

  // 2 and 3 — both defenses reject, and critically return NO plaintext at all.
  for (const scheme of [etm, gcm]) {
    assert.equal(scheme.detected, true, `${scheme.scheme} must detect the tamper`);
    assert.equal(scheme.plaintextReturned, null, `${scheme.scheme} must not return plaintext`);
    assert.equal(scheme.roleAccepted, null, `${scheme.scheme} must not yield a role`);
  }
});

test("Side-by-side — untampered payloads still decrypt correctly under both defenses", async () => {
  // Guards against a defense that "detects" everything, which would pass the test above.
  const { tamperRejected: gcmRejected, decryptedProfile: gcmClean } = await gcmTokenRoundtrip("erin@example.com");
  const { tamperRejected: etmRejected, decryptedProfile: etmClean } = await encryptThenMacTokenRoundtrip("erin@example.com");
  assert.equal(gcmRejected, true);
  assert.equal(etmRejected, true);
  assert.match(gcmClean, /role=user/);
  assert.match(etmClean, /role=user/);
});

test("Side-by-side — equal-length role targets are enforced", async () => {
  await assert.rejects(() => compareTamperDetection("f@example.com", "user", "administrator"), /equal length/);
});
