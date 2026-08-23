# Fresh review record: ctr-mode documentation and demonstration site

> Lives at `reviews/LATEST_REVIEW.md` and holds the most recent review audit record for `ctr-mode`.
> Earlier records are retrievable with `git log -p --follow reviews/LATEST_REVIEW.md`.

## Status and baseline

- Status: 18 required findings raised and remediated, plus all previously optional coverage now taken; remediation verified against a re-captured state
- Review mode: Fresh review, followed by two authorized remediation passes (the second prompted by reader feedback on the page's framing)
- Review date: 2026-08-23
- Branch: main
- Reviewed commit: `28456244fb8d5b1092362207e5e68bbab4dd3596`
- Worktree at review time: clean
- Reviewed-state fingerprint: `e957d7f443edef75cd094351f5e7cd76644839483864239f4121d0749b28147f`
- Post-remediation state: uncommitted worktree. A fingerprint is deliberately not pinned here — writing this
  record changes the repository state it would describe, so any value quoted would be stale on arrival.
  Capture one with `python3 scripts/capture_review_state.py` after the remediation is committed.
- State-capture command: `python3 scripts/capture_review_state.py`
- Baseline changed during review: No. The review completed against the clean commit; all edits were made afterwards as a separate authorized phase, and the affected checks were re-run against the new state.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `docs/index.html` | Documentation and UI shell | `docs/styles.css`, `docs/js/ui.mjs`, `docs/diagrams/*.svg` | Yes |
| `docs/styles.css` | Stylesheet | `docs/index.html` | Yes |
| `docs/js/crypto.mjs` | Cryptographic primitives | `test/attacks.test.mjs`, `docs/js/attacks.mjs` | Yes |
| `docs/js/attacks.mjs` | Attack vectors and defenses | `test/attacks.test.mjs`, `docs/js/ui.mjs` | Yes |
| `docs/js/ui.mjs` | UI wiring | `docs/index.html` | Yes |
| `docs/diagrams/generate_diagrams.py` | Diagram generator | the four committed `.svg` files | Yes |
| `docs/diagrams/*.svg` (6) | Figures | `docs/index.html`, `README.md` | Yes, each also loaded standalone |
| `test/attacks.test.mjs` | Test suite | `docs/js/crypto.mjs`, `docs/js/attacks.mjs` | Yes |
| `README.md` | Repository landing page | repository root | Yes |
| `DISCLAIMER.md`, `SECURITY.md` | Scope and reporting policy | repository root | Yes |
| `docs/styles.css` code-block rules | Sample presentation | `docs/index.html` | Yes |
| `.github/workflows/pages.yml` | Deployment of `docs/` | `docs/` | Yes |
| `reviews/CONTENT_DECISIONS.yml` | Durable decision register | `scripts/verify_content_decisions.py` | Yes |

Out-of-scope: general cryptography outside CTR/CBC/GCM mode behaviour; the deployed GitHub Pages instance (local server only); `node_modules/`.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | SP 800-38A §6.5 and Appendix D, SP 800-38D §8/§8.3 parsed from the published PDFs and quoted directly. |
| Evidence, authority, version, date, applicability | Yes | Every CVE fetched from NVD; every cited paper resolved to its primary record. Four citations failed and were corrected. |
| Adversarial wording, assumptions, attacker state | Yes | MEGA's malicious-server threat model was absent and has been stated; detection tests now carry their negative-result boundary. |
| Terminology, taxonomy, conceptual boundaries | Yes | GMAC vs GHASH and CBC's bounded two-block spread corrected against the standards' own definitions. |
| Cross-format consistency | Yes | Corrected claims swept across HTML, JS, generator, SVG, and README; two occurrences survived in code comments and were fixed. |
| Visual content, independently | Yes | Each SVG loaded standalone at its own URL as a detached artifact, separately from the prose-agreement check. |
| Cross-page consistency and duplication | Yes | README and page reconciled on Vector 3 mechanism, Vector 4 scope, and Encrypt-then-MAC key separation. |
| Topic completeness | Yes | Matrix below; two required gaps found (key separation, detection boundary) and closed. |
| Mechanical, generator, link, rendered-output validation | Yes | `node --test` 14/14, `eslint .` clean, generator idempotent and byte-stable, all 16 outbound links HTTP 200, page and demos exercised live. |
| Durable content-decision reconciliation | Yes | CD-0001…CD-0003 reaffirmed, none reversed; CD-0004…CD-0007 added. |
| Residual exhaustion | Yes | Post-fix sweep found the GMAC conflation in `attacks.mjs` and the Vector 3 imprecision in its code comments; both corrected. |

## Material-claim ledger

| ID | Location | Material claim | Source or verification | Result |
| --- | --- | --- | --- | --- |
| C-001 | `index.html` §Mechanism | CTR encrypts counter blocks to produce keystream XORed with plaintext | SP 800-38A §6.5, quoted | Verified |
| C-002 | `index.html` §Vector 1 | `C ⊕ Δ` decrypts to `P ⊕ Δ` with zero error spread | SP 800-38A App. D; `node --test` | Verified |
| C-003 | `index.html` §Vector 2 | Reusing (Key, Nonce) gives `C₁ ⊕ C₂ = P₁ ⊕ P₂` | Cryptopals Set 3; `node --test` | Verified |
| C-004 | `index.html` §Vector 3 | An edit oracle fed zero *plaintext* returns the keystream | `attacks.mjs`, live demo | **Corrected** — prose said "overwrite the ciphertext" |
| C-005 | `index.html` §Vector 4 | Counter blocks must be distinct across all messages under a key | SP 800-38A §6.5, quoted verbatim | Verified, wording tightened |
| C-006 | `index.html` §Vector 4 | RFC 3686's 32-bit block counter caps a packet at 2³²−1 blocks | RFC 3686 §4, quoted | Verified (added) |
| C-007 | `index.html` §Defenses | Encrypt-then-MAC requires independent encryption and MAC keys | `crypto.mjs` already did this; prose did not say so | **Corrected** |
| C-008 | `index.html` §Residual risk | The ≤2⁻³² bound is §8; the 2³² invocation cap is §8.3 | SP 800-38D, both sections quoted | **Corrected** — attribution had been merged into §8.3 |
| C-009 | `index.html` evidence table | KRACK / CVE-2017-13077 | NVD | Verified; vector mapping narrowed to Vector 2 |
| C-010 | `index.html` evidence table | MEGA 2022 | ePrint 2022/959 Figs. 2–3 | **Corrected** — see CD-0004, CD-0005 |
| C-011 | `index.html` evidence table | Microsoft Office RC4 keystream reuse | ePrint 2005/007 | **Corrected** — see CD-0004 |
| C-012 | `index.html` evidence table | Shadowsocks stream-cipher redirect attack | shadowsocks-org #154, Feb 2020 | **Corrected** — see CD-0004 |
| C-013 | `test/attacks.test.mjs` | SP 800-38A F.5.1/F.5.2 vectors | Published PDF, compared byte-for-byte | Verified |
| C-014 | `test/attacks.test.mjs` | RFC 3686 TV#1/TV#2 incl. keystream | RFC text, compared field by field | Verified |
| C-015 | `modes-*.svg` | AES-GCM security property | SP 800-38D §8 | **Corrected** — unqualified "IND-CCA2 Secure" now nonce-conditioned |
| C-016 | `modes-*.svg` | CBC error propagation | SP 800-38A App. D, quoted | **Corrected**, then removed — the CBC row was dropped from the comparison entirely (CD-0009), so the claim no longer appears |
| C-028 | `modes-*.svg` | "No AEAD tag (padding-oracle risk)" | Nowhere — the page raised padding oracles only here and never developed them | **Removed** — a dangling threat claim, dropped with the CBC row |
| C-017 | `index.html`, `ui.mjs`, `attacks.mjs`, generator | GCM's tag called a "GMAC tag" | SP 800-38D | **Corrected** in all four places — see CD-0006 |
| C-018 | Title, lede, README, DISCLAIMER | Framing implied CTR should not be used at all | SP 800-38A abstract: CTR is among five approved modes, with no advice against it | **Corrected** — see F-18, CD-0008 |
| C-019 | `index.html` §What CTR guarantees | SP 800-38A conditions CTR malleability on integrity "not being protected" | SP 800-38A App. D, quoted | Verified (added) |
| C-020 | `index.html` §What CTR guarantees | GCM's confidentiality is "a variation of the Counter mode of operation" | SP 800-38D §1, quoted | Verified (added) |
| C-021 | `index.html` §Fix Option B | Encrypt-then-MAC "is secure from all points of view"; keys "independently chosen"; verify before decrypting | Bellare & Namprempre ePrint 2000/025, quoted | Verified (added) |
| C-022 | `index.html` §Fix, both samples | The published GCM and Encrypt-then-MAC samples work and reject tampering | Extracted verbatim from the page and executed under Node: round-trip, 1-bit tamper, truncation, short-payload, AAD mismatch | Verified (added) |
| C-027 | `index.html` §Fix Option B | Nonce width of the published Encrypt-then-MAC sample | Birthday bound q²/2^(n+1) against SP 800-38D §8's 2⁻³² ceiling | **Corrected at check-in** — a 64-bit nonce reached the bound at ~92,000 messages against ~6.07 billion for the 96-bit sample beside it; now 96-bit nonce ‖ 32-bit counter |
| C-023 | `index.html` §Operating limits | Seven permitted GCM tag lengths; one fixed value per key; short tags risk exposing subkey H | SP 800-38D §5.2.1.2 and App. C, quoted | Verified (added) |
| C-024 | `index.html` §Operating limits | GCM authenticity assurance scoped to about 64 GB per invocation | SP 800-38D §1, quoted | Verified (added) |
| C-025 | `index.html` §Quieter failures | GCM "does not inherently prevent … replaying"; remedy is duplicate-IV monitoring or a sequence number in the AAD | SP 800-38D App. D, quoted | Verified (added) |
| C-026 | `index.html` §Primary references | FIPS 198-1 status | CSRC publication page and withdrawal notice | **Corrected** — the first URL was guessed and returned 404; status is now stated as proposed for withdrawal with SP 800-224 still in draft |
| C-029 | `index.html` §The fix, demo | The identical forgery is accepted under raw CTR and rejected by both defenses, with no plaintext returned | `compareTamperDetection` in `attacks.mjs`; three tests in `test/attacks.test.mjs`; exercised live in-browser | Verified (added) |

## Visual content ledger

| Visual | Independently correct | Self-sufficient detached | Generator provenance | Defensibility | Result |
| --- | --- | --- | --- | --- | --- |
| `modes-ctr-etm-gcm.svg` (was `modes-ctr-gcm-cbc.svg`) | Was not — two wrong claims, and an off-axis CBC row | Was not — no scope line, no caption | Re-run, byte-identical | Neutral comparison | **Rebuilt**: GCM nonce condition and scope line added; CBC row dropped and the axis rebuilt as CTR / CTR+HMAC / GCM — see CD-0009 |
| `taxonomy.svg` | Yes | Improved — dashed-edge legend added | Re-run, byte-identical | Scope line present | Verified |
| `vector1-bit-flipping.svg` | Yes | Was not — annotation overpainted and unreadable | Re-run, byte-identical | Scope line present | **Corrected**: label re-spaced, outcome recoloured to danger |
| `vector2-two-time-pad.svg` | Yes | Yes | Re-run, byte-identical | Scope line present | Verified, unchanged |
| `vector3-edit-oracle.svg` | Yes | Yes — scope line names the local in-memory oracle | Generated; layout guards pass | Educational, local target only | **New**, rendered standalone |
| `vector4-counter-reuse.svg` | Yes | Yes — carries the invariant and the RFC 3686 bound | Generated; layout guards pass | Educational illustration | **New**, rendered standalone |

## Per-topic completeness matrix

| Category | Disposition |
| --- | --- |
| 1 Definition and purpose | Covered |
| 2 Scope and conceptual boundaries | Covered |
| 3 Actors, components, assets | Covered |
| 4 Mechanism and operating sequence | Covered (Vector 3 mechanism corrected) |
| 5 Assumptions and prerequisites | Covered (Encrypt-then-MAC key separation added) |
| 6 Threats and attacker state | Covered (MEGA malicious-server model added) |
| 7 Limitations and residual risk | Covered — operating-limits section, plus truncation, splicing and replay, plus the Vector 4 simulator boundary |
| 8 Selection criteria | Covered |
| 9 Operations, observability, evidence | Covered (detection negative-result boundary added) |
| 10 Recovery, lifecycle, rekeying | Covered — RFC 3686 §4 bound plus a four-step rekeying discipline (fix the split, count per key, rekey below the bound, derive with an approved KDF) |
| 11 Interoperability and migration | Covered |
| 12 Deprecated or unsafe alternatives | Covered |
| 13 Visual representation | Covered — Vectors 3 and 4 each carry a figure; six figures total, each captioned |

## Mechanical checks executed

- `npm test` — 14/14 pass, including the NIST and RFC standard vectors.
- `npm run lint` — clean.
- `python3 docs/diagrams/generate_diagrams.py` — regenerates all four SVGs; two consecutive runs are byte-stable, and output matched the committed files before any edit, establishing provenance.
- New generator guards — `box()` rejects text too wide or too tall for its rect; `alabel()` shrinks to a caller-supplied width budget or raises. Both were verified to fire on the exact overflow that shipped.
- Link check — all 19 outbound hrefs in `docs/index.html` return HTTP 200.
- Sample execution — both published code samples run under Node against Web Crypto and reject 1-bit tampering, truncation, and AAD mismatch.
- Responsive check — at a 375px viewport the page does not scroll horizontally; code blocks and the evidence table scroll within themselves and every figure fits.
- Rendered validation — page and all four SVGs loaded in a browser; zero console errors; zero external network requests; all five demos exercised (bit-flip forges `role=root`, edit oracle recovers the full document, counter simulator produces duplicates, AES-GCM and Encrypt-then-MAC both reject tampering).
- `python3 scripts/verify_content_decisions.py` — 7 decisions validated.

These prove structural and behavioural properties. They do not establish factual accuracy: every citation error found in this review passed all of them.

## Findings — all remediated

Required corrections F-1 to F-17, by class:

1. **Citations (F-1 to F-5)** — three of four CVE identifiers resolved to unrelated vulnerabilities; the MEGA citation had a fabricated author list and a non-resolving hostname; the Microsoft Office source URL returned 404; the Shadowsocks entry had the wrong year and misstated SIP004. Table rewritten against primary sources. See CD-0004, CD-0005.
2. **Mechanism accuracy (F-6)** — Vector 3 prose described overwriting the ciphertext rather than submitting zero plaintext, contradicting its own API and implementation. Corrected in page, README, and code comments.
3. **Figures (F-7 to F-10)** — an overpainted annotation, an unqualified GCM security claim, a wrong CBC propagation claim, and a compromise outcome drawn in the safe colour. All corrected; generator now guards the two layout classes. See CD-0006, CD-0007.
4. **Guidance completeness (F-11 to F-13)** — missing MAC key separation, missing negative-result boundary on detection tests, and an unstated simulation boundary on Vector 4. All added, the last with RFC 3686's numeric bound.
5. **Standards precision (F-14 to F-16)** — GMAC/GHASH conflation in four places, §8 vs §8.3 attribution, and KRACK mis-mapped to counter rollover. All corrected.
6. **Review record (F-17)** — the prior record claimed "Complete with no open findings" with `Commit: INITIAL` and no state ID, marked all four figures self-sufficient, and had no ledger entry for any of the four evidence citations where every error sat. This record replaces it.
7. **Framing (F-18, raised by reader feedback rather than by the review)** — the project asserted that AES-CTR "is unsafe", implying it should not be used. NIST says no such thing: SP 800-38A lists CTR among five approved confidentiality modes and, unlike ECB, never advises against it; Appendix D conditions CTR malleability on integrity "not being protected"; and SP 800-38D describes GCM's confidentiality as "a variation of the Counter mode of operation", so recommending GCM as a replacement misdescribes what actually changes. The project now leads with what CTR does and does not guarantee, and presents the fix as composition — an AEAD, or AES-CTR with HMAC — each with a runnable, tested sample. Supersedes CD-0002. See CD-0008.

This finding is the most significant of the eighteen: the first review checked every claim on the page for accuracy but did not challenge the premise the page was built on. Sources were verified individually while the conclusion they were assembled into overstated them.

### Check-in gate findings (remediated before commit)

The pre-check-in review of the resulting diff surfaced four further issues in the newly added code, all fixed before the commit:

| # | Location | Issue | Resolution |
| --- | --- | --- | --- |
| 1 (high) | `docs/index.html` Option B sample | 64-bit random nonce reached the 2⁻³² collision bound at ~92,000 messages, versus ~6.07 billion for the 96-bit GCM sample offered beside it as an equal alternative, with no bound stated | Widened to a 96-bit nonce with a 32-bit counter, the RFC 3686 shape, with the margin noted inline |
| 2 (medium) | `docs/index.html` Option A sample | `async function open(...)` shadows `window.open` when pasted into a classic script or console | Renamed to `unseal()` |
| 3 (low) | `docs/index.html` `openEtM` | Missing the minimum-length guard the repository's own `crypto.mjs:134` performs | Guard added; behaviour still fails closed either way |
| 4 (low) | `docs/diagrams/generate_diagrams.py` | `box()` width guard assumed 0.5 em per character for monospace text as well as sans (~0.6 em), under-protecting the boxes most prone to overflow | Estimate is now mono-aware |

Finding 1 also required correcting a claim it invalidated: the samples and the in-page demonstrations no longer share a counter split, so the text now states that difference rather than calling them the same code paths.

### Post-review reader findings (F-19, F-20)

Reader feedback asked why the mode comparison included AES-CBC when the subject is CTR, and whether CTR against GCM and/or CTR-plus-authentication would not fit better. It would, and did not:

- CBC is not one of the two fixes the page offers, so its row could not be selected and did not inform the decision the page asks the reader to make.
- The axis was mixed: CTR against CBC contrasts two unauthenticated confidentiality modes on tamper behaviour, while GCM sits on the separate axis of authenticated versus not.
- The CBC row asserted padding-oracle risk, a threat raised nowhere else in the repository and never developed — a dangling claim that the earlier passes verified for accuracy without asking whether it belonged.

The figure is now AES-CTR alone / AES-CTR + HMAC / AES-GCM, renamed `modes-ctr-etm-gcm.svg`, with a caption stating that all three share the same counter-mode keystream and differ only in where the tag comes from — which also reinforces CD-0008's point that GCM does not replace CTR. CBC remains where it is genuinely relevant: SP 800-38A's list of five approved modes, and the padding contrast in the mechanism section. See CD-0009.

**F-20 — the defensive demonstration proved only half its point.** Reader feedback noted that the demo showed the two defenses rejecting a tamper but never showed CTR *failing* to, so the reader had to hold Vector 1 in mind and construct the comparison themselves. Worse, the two runs used independently generated tampers, so nothing tied the outcomes to a single attacker action.

The demo is now one button running the identical forgery — same profile, same target field, same XOR delta, same byte offset — against AES-CTR alone, AES-CTR + HMAC, and AES-GCM, rendering three outcome cards. Raw CTR reports the forged `role=root` it decrypted and accepted; both defenses report that nothing was returned and name the check that failed. The flipped bytes are highlighted at their true offset in each encoding, which differs by scheme (the Encrypt-then-MAC payload carries a 16-byte counter first). Backed by `compareTamperDetection` in `attacks.mjs` and three new tests, including one asserting that untampered payloads still decrypt — a defense that rejected everything would otherwise pass.

Both of these came from a reader rather than from the review passes, and all three of the reader findings are the same kind: individual claims were checked and correct, while the structure holding them was not challenged.

A regression was introduced and caught during remediation: the first fix for the GCM and CBC diagram claims pushed a third text line into the status tag below it. The rendered check caught it, the geometry was reworked to separate the property box from the tag, and the `box()` guard was added so the class cannot recur silently.

## Optional coverage — now taken

Every item previously listed as optional has been closed:

- **Truncation, splicing and replay** now have their own section, with SP 800-38D Appendix D cited for replay not being inherently prevented and for the duplicate-IV / sequence-number remedies.
- **Vectors 3 and 4 have figures** — `vector3-edit-oracle.svg` and `vector4-counter-reuse.svg`, both captioned and both self-sufficient when detached.
- **GCM tag length** is covered in the operating-limits section: the seven permitted values, one fixed length per key, and Appendix C's warning that short tags may expose the hash subkey H.
- **A rekeying discipline** now accompanies the counter-exhaustion bound.

No optional coverage remains outstanding. Further additions would extend scope rather than complete it.

## Durable decisions reconciled

| ID | Disposition |
| --- | --- |
| CD-0001 | Reaffirmed. Three root causes and four vectors intact in prose and taxonomy. |
| CD-0002 | **Superseded by CD-0008.** Its "only approved mitigations" and "mandate" wording stated an authorial recommendation at normative strength and implied CTR must be replaced. Preserved as history. |
| CD-0003 | Reaffirmed. F-15 refined the section attribution; the decision's own scoping was already accurate. |
| CD-0004 | New — citation and CVE policy for the evidence table. |
| CD-0005 | New — MEGA mapped to root cause 3, not Vector 1. |
| CD-0006 | New — GCM tag and CBC propagation described in the standards' terms. |
| CD-0007 | New — attack outcomes never rendered in the safe colour. |
| CD-0008 | New — CTR framed as a confidentiality mode needing composition, not a mode to avoid; supersedes CD-0002. |
| CD-0009 | New — the comparison is restricted to the options the reader can actually choose; CBC row dropped. CD-0006's CBC element no longer applies to current content, though its reasoning is preserved should CBC ever return. |

One decision, CD-0002, was superseded; it is preserved in the register with `status: superseded` and `superseded_by: CD-0008` rather than rewritten. No other decision was reversed.

## Known review limitations

- Whether Hongjun Wu's RC4 paper also appeared in FSE 2005 proceedings could not be confirmed; the page now cites the IACR ePrint record, which is confirmed.
- FIPS 198-1's withdrawal was still only *proposed* at the time of review, and SP 800-224 was still a draft with no final URL. Both statuses will need rechecking; the page states the position as of this review rather than asserting a settled outcome.
- The published samples were executed under Node's Web Crypto implementation. They are standard Web Crypto calls and should behave identically in browsers, but were not separately executed in every target browser engine.
- Rendered checks ran in one Chromium-based browser at desktop width in dark theme. Light theme was verified only by reading the CSS `prefers-color-scheme` blocks, not by rendering.
- The deployed GitHub Pages site was not checked; validation used a local server.
- The post-remediation state is uncommitted. This record describes a dirty worktree; re-capture after committing if a committed fingerprint is needed.
- Mechanical checks do not establish factual accuracy. Content correctness here rests on the primary-source comparisons recorded in the ledger.
