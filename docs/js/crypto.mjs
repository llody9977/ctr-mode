// AES and cryptographic helpers for CTR mode weakness demonstrations.
//
// Web Crypto API (crypto.subtle) natively supports AES-CTR, AES-GCM, and HMAC.
// In CTR mode, a counter block sequence is encrypted with AES to produce a keystream,
// which is then XORed with the plaintext: C = P XOR E_K(T).
//
// CTR mode is evaluated here alongside AES-GCM (AEAD) and Encrypt-then-MAC (AES-CTR + HMAC)
// to demonstrate why raw, unauthenticated CTR mode is vulnerable to bit-flipping,
// keystream reuse, and oracle extraction.
//
// Educational & defensive use only.

const subtle = globalThis.crypto.subtle;
export const BLOCK_SIZE = 16;

function requireBytes(name, value, allowedLengths = null) {
  if (!(value instanceof Uint8Array)) {
    throw new TypeError(`${name} must be a Uint8Array`);
  }
  if (allowedLengths && !allowedLengths.includes(value.length)) {
    throw new RangeError(`${name} must be ${allowedLengths.join(", ")} bytes; received ${value.length}`);
  }
}

function requireCounter(counter, counterLength) {
  requireBytes("counter block", counter, [BLOCK_SIZE]);
  if (!Number.isInteger(counterLength) || counterLength < 1 || counterLength > 128) {
    throw new RangeError("counter length must be an integer from 1 to 128 bits");
  }
}

// ---- byte / string helpers ----
export const toHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
export function fromHex(s) {
  if (typeof s !== "string" || s.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(s)) {
    throw new TypeError("hex input must contain an even number of hexadecimal characters");
  }
  return new Uint8Array(s.match(/../g)?.map((h) => parseInt(h, 16)) ?? []);
}
export const utf8 = (s) => new TextEncoder().encode(s);
export const utf8Decode = (b) => new TextDecoder().decode(b);
// latin1: 1 char <-> 1 byte for exact binary string representations
export const latin1Encode = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
export const latin1Decode = (b) => String.fromCharCode(...new Uint8Array(b));

export function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrays) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

export function xorBytes(a, b) {
  const len = Math.min(a.length, b.length);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = a[i] ^ b[i];
  return out;
}

export function randomBytes(len) {
  if (!Number.isInteger(len) || len < 0 || len > 65_536) {
    throw new RangeError("random byte length must be an integer from 0 to 65536");
  }
  return globalThis.crypto.getRandomValues(new Uint8Array(len));
}

export function randomKey(bytes = 16) {
  return randomBytes(bytes);
}

// Generate standard 16-byte initial counter block: 8-byte random nonce + 8 zero counter bytes
export function makeCounterBlock(nonce8 = null) {
  const block = new Uint8Array(BLOCK_SIZE);
  if (nonce8) {
    requireBytes("nonce", nonce8, [8]);
    block.set(nonce8, 0);
  } else {
    block.set(randomBytes(8), 0);
  }
  return block;
}

// ---- AES-CTR (unauthenticated stream mode) ----
export async function aesCtrEncrypt(keyBytes, plaintext, counterBlock = null, counterLength = 64) {
  const counter = counterBlock ?? makeCounterBlock();
  requireBytes("AES key", keyBytes, [16, 24, 32]);
  requireBytes("plaintext", plaintext);
  requireCounter(counter, counterLength);
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-CTR" }, false, ["encrypt"]);
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-CTR", counter, length: counterLength }, k, plaintext));
  return { counterBlock: new Uint8Array(counter), ciphertext: ct };
}

export async function aesCtrDecrypt(keyBytes, ciphertext, counterBlock, counterLength = 64) {
  requireBytes("AES key", keyBytes, [16, 24, 32]);
  requireBytes("ciphertext", ciphertext);
  requireCounter(counterBlock, counterLength);
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-CTR" }, false, ["decrypt"]);
  const pt = new Uint8Array(await subtle.decrypt({ name: "AES-CTR", counter: counterBlock, length: counterLength }, k, ciphertext));
  return pt;
}

// Keystream generator: encrypting all-zeros under (key, counter) extracts the raw keystream S
export async function aesCtrKeystream(keyBytes, length, counterBlock, counterLength = 64) {
  const zeros = new Uint8Array(length);
  const { ciphertext } = await aesCtrEncrypt(keyBytes, zeros, counterBlock, counterLength);
  return ciphertext;
}

// ---- AES-GCM (Defensive AEAD standard) ----
export async function aesGcmEncrypt(keyBytes, plaintext, nonce = null) {
  nonce = nonce ?? randomBytes(12); // standard 96-bit nonce
  requireBytes("AES key", keyBytes, [16, 24, 32]);
  requireBytes("plaintext", plaintext);
  requireBytes("GCM nonce", nonce, [12]);
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, plaintext));
  return { nonce, ciphertext: ct }; // includes 16-byte authentication tag
}

export async function aesGcmDecrypt(keyBytes, nonce, ciphertextWithTag) {
  requireBytes("AES key", keyBytes, [16, 24, 32]);
  requireBytes("GCM nonce", nonce, [12]);
  requireBytes("ciphertext and tag", ciphertextWithTag);
  if (ciphertextWithTag.length < 16) throw new RangeError("GCM input is shorter than its 16-byte tag");
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: nonce }, k, ciphertextWithTag));
}

// ---- Encrypt-then-MAC (AES-CTR + HMAC-SHA256) ----
export async function encryptThenMacEncrypt(encKeyBytes, macKeyBytes, plaintext, counterBlock = null, counterLength = 64) {
  requireBytes("HMAC key", macKeyBytes, [32]);
  const { counterBlock: counter, ciphertext } = await aesCtrEncrypt(encKeyBytes, plaintext, counterBlock, counterLength);
  const macData = concat(counter, ciphertext);
  const macKey = await subtle.importKey("raw", macKeyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await subtle.sign("HMAC", macKey, macData));
  const payload = concat(counter, ciphertext, mac);
  return { counterBlock: counter, ciphertext, mac, payload };
}

export async function encryptThenMacDecrypt(encKeyBytes, macKeyBytes, payload, counterLength = 64) {
  requireBytes("AES key", encKeyBytes, [16, 24, 32]);
  requireBytes("HMAC key", macKeyBytes, [32]);
  requireBytes("payload", payload);
  if (payload.length < BLOCK_SIZE + 32) throw new Error("payload too short for Encrypt-then-MAC (missing counter or HMAC tag)");
  const counter = payload.slice(0, BLOCK_SIZE);
  const ciphertext = payload.slice(BLOCK_SIZE, payload.length - 32);
  const tag = payload.slice(payload.length - 32);

  const macData = concat(counter, ciphertext);
  const macKey = await subtle.importKey("raw", macKeyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const valid = await subtle.verify("HMAC", macKey, tag, macData);
  if (!valid) throw new Error("MAC verification failed: message has been tampered with or corrupted");

  return aesCtrDecrypt(encKeyBytes, ciphertext, counter, counterLength);
}
