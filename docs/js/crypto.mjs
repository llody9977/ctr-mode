// AES and cryptographic helpers for CTR mode weakness demonstrations.
//
// Web Crypto API (crypto.subtle) natively supports AES-CTR, AES-CBC, AES-GCM, and HMAC.
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

// ---- byte / string helpers ----
export const toHex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
export const fromHex = (s) => new Uint8Array(s.match(/../g)?.map((h) => parseInt(h, 16)) ?? []);
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

export function splitBlocks(data, blockSize = BLOCK_SIZE) {
  const out = [];
  for (let i = 0; i < data.length; i += blockSize) {
    out.push(data.slice(i, i + blockSize));
  }
  return out;
}

export function blockAt(data, index, blockSize = BLOCK_SIZE) {
  return data.slice(index * blockSize, (index + 1) * blockSize);
}

export function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function xorBytes(a, b) {
  const len = Math.min(a.length, b.length);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = a[i] ^ b[i];
  return out;
}

export function randomBytes(len) {
  return globalThis.crypto.getRandomValues(new Uint8Array(len));
}

export function randomKey(bytes = 16) {
  return randomBytes(bytes);
}

// Generate standard 16-byte initial counter block: 8-byte random nonce + 8 zero counter bytes
export function makeCounterBlock(nonce8 = null) {
  const block = new Uint8Array(BLOCK_SIZE);
  if (nonce8) {
    block.set(nonce8.slice(0, 8), 0);
  } else {
    block.set(randomBytes(8), 0);
  }
  return block;
}

// ---- AES-CTR (unauthenticated stream mode) ----
export async function aesCtrEncrypt(keyBytes, plaintext, counterBlock = null, counterLength = 64) {
  const counter = counterBlock ?? makeCounterBlock();
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-CTR" }, false, ["encrypt"]);
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-CTR", counter, length: counterLength }, k, plaintext));
  return { counterBlock: counter, ciphertext: ct };
}

export async function aesCtrDecrypt(keyBytes, ciphertext, counterBlock, counterLength = 64) {
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

// ---- AES-CBC (for comparison with chaining mode) ----
export async function aesCbcEncrypt(keyBytes, plaintext, iv = null) {
  iv = iv ?? randomBytes(BLOCK_SIZE);
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]);
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-CBC", iv }, k, plaintext));
  return { iv, ciphertext: ct };
}

// ---- AES-GCM (Defensive AEAD standard) ----
export async function aesGcmEncrypt(keyBytes, plaintext, nonce = null) {
  nonce = nonce ?? randomBytes(12); // standard 96-bit nonce
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, plaintext));
  return { nonce, ciphertext: ct }; // includes 16-byte authentication tag
}

export async function aesGcmDecrypt(keyBytes, nonce, ciphertextWithTag) {
  const k = await subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  return new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv: nonce }, k, ciphertextWithTag));
}

// ---- Encrypt-then-MAC (AES-CTR + HMAC-SHA256) ----
export async function encryptThenMacEncrypt(encKeyBytes, macKeyBytes, plaintext, counterBlock = null, counterLength = 64) {
  const { counterBlock: counter, ciphertext } = await aesCtrEncrypt(encKeyBytes, plaintext, counterBlock, counterLength);
  const macData = concat(counter, ciphertext);
  const macKey = await subtle.importKey("raw", macKeyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await subtle.sign("HMAC", macKey, macData));
  const payload = concat(counter, ciphertext, mac);
  return { counterBlock: counter, ciphertext, mac, payload };
}

export async function encryptThenMacDecrypt(encKeyBytes, macKeyBytes, payload, counterLength = 64) {
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
