# AES-CTR provides confidentiality, not integrity

![CI](https://github.com/llody9977/ctr-mode/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/llody9977/ctr-mode/actions/workflows/codeql.yml/badge.svg)
![Secret scan](https://github.com/llody9977/ctr-mode/actions/workflows/gitleaks.yml/badge.svg)
![License](https://img.shields.io/github/license/llody9977/ctr-mode)

Counter (CTR) mode is one of the five confidentiality modes NIST approves in SP 800-38A. It turns a block cipher into a synchronous stream cipher by encrypting a sequence of counter blocks into a keystream and XORing that with the plaintext: `C = P ⊕ S`. It is **not deprecated and not discouraged** — AES-GCM's confidentiality is, in NIST's own words, "a variation of the Counter mode of operation".

What CTR does not do is protect integrity, and it was never specified to. SP 800-38A Appendix D says as much: under CTR "the decryption of any ciphertext block is vulnerable to the introduction of specific bit errors into that ciphertext block *if its integrity is not protected*". Used alone where an attacker can reach the ciphertext, flipping a ciphertext bit flips exactly the corresponding plaintext bit, and reusing a counter block under one key cancels the keystream outright (`C₁ ⊕ C₂ = P₁ ⊕ P₂`).

**The rule is not "never use CTR" — it is "authenticate the ciphertext".** This repository demonstrates what the missing tag costs, then shows the two correct fixes with runnable code.

**[▶ Open the interactive site →](https://llody9977.github.io/ctr-mode/)** — every attack below runs live in your browser against real AES.

## Run the attacks yourself, in the browser

The site turns each weakness into an interactive demonstration you can drive. The cryptography is **real AES** via the Web Crypto API, executed locally in-process — no servers and no network dependencies. (Verified against NIST SP 800-38A and RFC 3686 test vectors in the automated test suite.)

- **Vector 1 — Precision bit-flipping / privilege escalation** — flip ciphertext bits to forge a `role=root` session token from a `role=user` account with zero decryption errors and zero corruption of surrounding bytes.
- **Vector 2 — Two-time pad & crib-dragging** — encrypt two messages under the same `(Key, Nonce)` pair; watch the keystream cancel out (`C₁ ⊕ C₂ = P₁ ⊕ P₂`) and drag natural-language candidate words across the XOR stream to recover plaintexts without the key.
- **Vector 3 — Random-access read/write keystream extraction** — submit all-zero *plaintext* to an `edit(ciphertext, offset, new_text)` oracle; the server re-encrypts it under the same key and counter and hands back `0x00 ⊕ S = S` — the raw keystream — recovering 100% of a confidential document in a single request.
- **Vector 4 — Counter rollover & keystream collisions** — wrap a deliberately tiny counter field in software and watch identical counter blocks regenerate identical keystream, the invariant behind multi-time pad vulnerabilities within a single stream. (The simulator demonstrates the invariant; it does not overflow AES's own counter.)
- **The fix** — test the same token under **AES-GCM** (AEAD) and **Encrypt-then-MAC** (AES-CTR + HMAC-SHA256, under two independent keys): flip a single bit and watch the authentication tag reject the ciphertext before any plaintext or role is trusted.

Both fixes ship as copyable samples on the site:

- **Option A — use an AEAD.** AES-GCM or ChaCha20-Poly1305: confidentiality and integrity in one primitive, tag verified before any plaintext is released. Still counter-mode encryption underneath.
- **Option B — keep AES-CTR and add HMAC.** Encrypt-then-MAC, the ordering Bellare & Namprempre found "secure from all points of view": two independent keys, the tag covering the counter block *and* the ciphertext, verified in constant time before decrypting.

![AES-CTR has three root causes — stream-cipher malleability (bitwise XOR has zero error spread), keystream determinism (reusing nonces reproduces identical keystreams), and missing authentication (tampered ciphertexts decrypt without error). These drive four distinct attack vectors: precision bit-flipping, two-time pad crib-dragging, random-access edit extraction, and counter rollover collisions.](docs/diagrams/taxonomy.svg)

## Structure

- [`docs/`](docs/) — the GitHub Pages site and educational write-up: [`index.html`](docs/index.html), [`styles.css`](docs/styles.css), and theme-aware SVG [`diagrams/`](docs/diagrams/).
- [`docs/js/`](docs/js/) — the cryptographic and attack implementation: [`crypto.mjs`](docs/js/crypto.mjs) (AES-CTR, AES-GCM, Encrypt-then-MAC) and [`attacks.mjs`](docs/js/attacks.mjs) (the four attack vectors), plus [`ui.mjs`](docs/js/ui.mjs) which wires them to the interactive page.
- [`test/`](test/) — a Node test suite (`node --test`) verifying all attack vectors and defensive controls against the NIST SP 800-38A AES-128-CTR and RFC 3686 test vectors.
- [`reviews/`](reviews/) — durable content decisions ledger and review audit trail ([`CONTENT_DECISIONS.yml`](reviews/CONTENT_DECISIONS.yml), [`LATEST_REVIEW.md`](reviews/LATEST_REVIEW.md)).
- [`scripts/`](scripts/) — verification tooling ([`verify_content_decisions.py`](scripts/verify_content_decisions.py), [`capture_review_state.py`](scripts/capture_review_state.py)).

## Develop

```bash
npm install       # install eslint devDependencies (tests require zero external dependencies)
npm test          # node --test — verifies all attack vectors against real AES & NIST vectors
npm run lint      # eslint . — static analysis and linting

# preview the interactive site locally
python3 -m http.server -d docs 8000   # then open http://localhost:8000
```

Diagrams are regenerated with `python3 docs/diagrams/generate_diagrams.py`.

## Security

Found a vulnerability? Report it privately — see [`SECURITY.md`](SECURITY.md). Do not open a public issue for security reports.

## Disclaimer

For **educational and defensive** security research. Every demonstration runs entirely in your browser against a self-contained, in-page oracle — no network requests and no third-party systems. Use these techniques only against systems you own or are explicitly authorized to test. See [`DISCLAIMER.md`](DISCLAIMER.md).

## License

Licensed under **Apache-2.0** — see [`LICENSE`](LICENSE). Covers the whole repository: code, documentation, and diagrams.
