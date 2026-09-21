# Disclaimer

## Purpose

`ctr-mode` is a browser-based proof of concept showing the boundary between AES-CTR confidentiality and message integrity. Four self-contained demonstrations reproduce failures caused by missing authentication or repeated counter blocks. The comparison then applies the same tampering to AES-GCM and AES-CTR with Encrypt-then-MAC. The project does not claim that AES is broken or that CTR is deprecated.

## No warranty

This project is provided "as is", without warranty of any kind, express or implied. The authors and contributors accept no liability for any claim, damage, or other consequence arising from its use. You use it at your own risk.

## Authorized and educational use only

This repository exists for **educational and defensive security** purposes: understanding how stream cipher malleability, keystream reuse, and lack of authentication operate so they can be detected, prevented, and fixed.

Any code, proof of concept, or technique here must be used only against systems you **own** or have **explicit written authorization** to test. Do not use it against third-party, production, or shared systems, or against any account, service, or infrastructure that is not yours. Unauthorized access to computer systems is illegal in most jurisdictions, and doing so is solely your responsibility.

Every demonstration here is paired with its mitigation; the intent is to defend, not to enable an attack against anyone else.
