# AES-CTR provides confidentiality, not integrity

![CI](https://github.com/llody9977/ctr-mode/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/llody9977/ctr-mode/actions/workflows/codeql.yml/badge.svg)
![Secret scan](https://github.com/llody9977/ctr-mode/actions/workflows/gitleaks.yml/badge.svg)
![License](https://img.shields.io/github/license/llody9977/ctr-mode)

AES-CTR can keep data confidential while still allowing an attacker to alter the decrypted result. The problem is not a break in AES. It appears when an application uses a confidentiality mode without authenticating the ciphertext and the context needed to interpret it.

This repository provides a browser-based proof of concept for engineers and security reviewers. It demonstrates the failure with real AES through the Web Crypto API, then applies the same tampering to authenticated alternatives so the control difference can be observed directly.

**[Open the interactive proof of concept](https://llody9977.github.io/ctr-mode/)**

## What the proof of concept demonstrates

- Precision bit flipping changes a predictable field without the encryption key.
- Nonce reuse cancels the keystream and exposes relationships between plaintexts.
- An unsafe random-access edit function can disclose the full keystream.
- Counter rollover repeats counter blocks and recreates earlier keystream.
- AES-GCM and AES-CTR with Encrypt-then-MAC reject the same tampering before plaintext is trusted.

The practical decision is to use an authenticated encryption mode for new designs. Where an existing format or dependency requires AES-CTR, use independent encryption and MAC keys, authenticate the counter block and ciphertext, and verify the tag before decryption. Authentication does not remove the need to enforce nonce uniqueness, counter capacity, and rekeying limits.

## Evidence boundary

The demonstrations are self-contained browser simulations. They establish the cryptographic behavior being discussed, not the security of any external product or service. The implementation is verified against NIST SP 800-38A and RFC 3686 AES-CTR test vectors.

The site uses the same light editorial system as [Secret Exposure](https://llody9977.github.io/secret-exposure/).

## Security

Report vulnerabilities privately through the process in [`SECURITY.md`](SECURITY.md). Do not open a public issue for a security report.

## Disclaimer

This proof of concept is for educational and defensive security research. Use these techniques only on systems you own or are explicitly authorized to assess. See [`DISCLAIMER.md`](DISCLAIMER.md).

## License

Licensed under Apache-2.0. See [`LICENSE`](LICENSE).
