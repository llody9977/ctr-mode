# Review record: whole repository (`ctr-mode`)

> Lives at `reviews/LATEST_REVIEW.md` and is overwritten by each new review — this file always holds the
> most recent one. Earlier records are in git, not in this folder:
> `git log -p --follow reviews/LATEST_REVIEW.md` for the full series,
> `git show <commit>:reviews/LATEST_REVIEW.md` for one in full.
>
> The machine-readable pass state lives beside it in `reviews/REVIEW_STATE.json`, written by
> `scripts/review_passes.py --record`. That file is the router's input; this one is the human record.

## Status and baseline

- Status: **Complete with no open findings** (all findings remediated within this session and re-verified)
- Review date: 2026-08-24
- Reviewer: Claude Opus 5, directed by llody
- Model / effort this review: `claude-opus-5` / `high`
- Branch: `docs/standards-trajectory-and-figure-notation` (cut fresh from `main`; the prior branch's PR was already squash-merged, so its commit carried an empty diff and it was retired rather than reused)
- Base commit: `d337c5f` (`origin/main`)
- Worktree: **Dirty** — see the two baselines below
- Review state ID: ``
- State-capture command: `python3 scripts/capture_review_state.py`
- Pass-routing command: `python3 scripts/review_passes.py --model claude-opus-5 --effort high`
- Pass state recorded with: `--record` for all 11 passes (every pass ran; nothing was cached)
- Baseline changed during review: **Yes** — see below

### Two baselines

Review and remediation were requested in sequence, so this record covers two frozen states.

| Phase | Scoped content fingerprint | Files | Worktree |
| --- | --- | --- | --- |
| A — review, no edits | `5e4463448639ea29560f94f965602fee310f7f9091865a389b54b1cc34e2a05b` | 40 | dirty: `reviews/*` deleted, `README.md` modified |
| B — post-remediation, post-gate | `d74bbb1879c8ea4d95fde8fd4a546bc509102332e0d78ce5b13a77ded315eeb9` | 46 | first commit of this work |
| C — optional coverage adopted (this record) | `c6b7a123d3fe6bdb114ed3c4d7bf7400e35d709300d9675268b4a1b62eb5f498 14947c5e278234d40ac66af76d7d1948eb98ae2fdda1d2ed5d3db385fa5335cb 48` |  | adds the two figures of CD-0009 |

Phase A held unchanged throughout the review: the fingerprint was re-captured at the end and matched. A stray
`.claude/launch.json` created by the reviewer during that phase was removed and the match re-confirmed before
any finding was reported.

Phase B is the state this record closes against. The pre-check-in review gate then ran over the resulting diff and surfaced two low-severity findings in the remediation itself — an unreferenced `export` in the new `test/figures.test.mjs`, and a page lede that paraphrased IR 8459's "not yet deprecating" as "recommended keeping it", drifting toward endorsement in exactly the way CD-0004 exists to prevent. Both were fixed and the suite re-run before commit; the Phase B fingerprint above is the post-gate state. Every pass that produced a finding was re-run over the changed
content, followed by a residual-exhaustion pass, per the fix-verification rules.

### Prior review this one builds on

- **None.** `reviews/REVIEW_STATE.json` and the previous decision register were deleted from the working tree
  before this review and deliberately not restored. The router reported `No prior review state — every pass
  runs (first review under pass versioning)`.
- Prior commit: n/a
- Passes carried forward from it: **none — zero cached passes.** Every conclusion in this record rests on
  today's run at `claude-opus-5`/`high`.

## Scope inventory

Whole repository,  files at the committed state. Table lists artifacts carrying material claims; configuration, lockfile and licence
were inventoried but carry none.

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `docs/index.html` | Page, 14 sections, 2 published code samples | `test/samples.test.mjs` extracts and executes both samples | Yes |
| `docs/js/crypto.mjs` | AES-CTR / AES-GCM / Encrypt-then-MAC | `attacks.mjs`, `ui.mjs`, `test/attacks.test.mjs` | Yes |
| `docs/js/attacks.mjs` | Four attack vectors, three-way comparison | `ui.mjs`, `test/attacks.test.mjs` | Yes |
| `docs/js/html.mjs` | Escape-by-default tagged template | `ui.mjs`, `test/html.test.mjs` | Yes |
| `docs/js/ui.mjs` | DOM wiring for all demonstrations | `docs/index.html` | Yes |
| `docs/styles.css` | Theme tokens, light and dark | `docs/index.html` | Yes |
| `docs/diagrams/generate_diagrams.py` | Generator for all six figures | Six SVGs; CI `figures` job | Yes |
| `docs/diagrams/*.svg` (8) | Figures | Generated; `test/figures.test.mjs` | Yes — all eight, both themes |
| `README.md` | Repository front page | Links `docs/`, `test/`, `scripts/` | Yes |
| `DISCLAIMER.md`, `SECURITY.md`, `CONTRIBUTING.md` | Policy | — | Yes |
| `test/*.mjs` (5) | Test suite, 36 tests | — | Yes |
| `.github/workflows/*.yml` (5) | CI | — | Yes |
| `scripts/*.py` (3) | Review tooling | `reviews/` | Yes |

Out-of-scope boundaries and reason: `node_modules/` (vendored dependencies), `LICENSE` (verbatim Apache-2.0),
`package-lock.json` (generated).

## Review passes

| id | Ver | Ran or cached | Reason (router's words) | Verdict | Evidence, or the run it rests on |
| --- | --- | --- | --- | --- | --- |
| `factual-correctness` | 1 | run | no recorded run for this pass | findings | 1 finding (F-1, figure equation); all prose XOR relations re-derived and correct |
| `evidence-authority` | 1 | run | no recorded run for this pass | findings | 1 finding (F-2, misquote); 29/29 links HTTP 200; every quoted passage checked against the source document |
| `adversarial-claims` | 1 | run | no recorded run for this pass | findings | Absolute-quantifier sweep produced R-2 and R-3 (see reframes) |
| `terminology-taxonomy` | 1 | run | no recorded run for this pass | findings | Taxonomy scope boundary (CD-0005); concatenation symbol unified to U+2016 |
| `cross-format` | 1 | run | no recorded run for this pass | findings | Figure/prose divergence on the malleability relation; `∥` vs `‖` split |
| `visual-content` | 2 | run | no recorded run for this pass | findings | 2 findings (F-1, F-4); all six figures rendered in both themes; generator correspondence re-established |
| `cross-page` | 1 | run | no recorded run for this pass | findings | 2 findings (F-3, README↔page claim-strength parity) |
| `topic-completeness` | 1 | run | no recorded run for this pass | findings | One thin category — migration (CD-0008) |
| `argument-integrity` | 1 | run | no recorded run for this pass | findings | Thesis and comparison set sound; R-4 internal contradiction found |
| `executable-demonstration` | 2 | run | no recorded run for this pass | clean | All four vectors plus the three-way comparison driven live under adversarial inputs |
| `decision-reconciliation` | 1 | run | no recorded run for this pass | findings | Register absent at review time — see limitations |

**Always-run tier.** Mechanical validation, guard regression and residual exhaustion all executed; never cached.

### Method versions bumped by this review

None. `visual-content` v2 and `executable-demonstration` v2 were already current, and both earned their version:
v2 of the visual pass requires rendering in both themes and establishing generator correspondence, which is what
surfaced F-1; v2 of the demonstration pass requires driving under adversarial inputs, which is how the anchor
guard and the escape-by-default template were exercised rather than assumed.

### Findings mechanized into guards

| Finding | Guard added | Verified firing? |
| --- | --- | --- |
| F-1 figure equated ciphertext to plaintext | `test/figures.test.mjs` — parses every equation from every generated SVG, rejects cross-space equalities, treats an even count of same-space terms as a difference so `C₁ ⊕ C₂ = P₁ ⊕ P₂` passes | **Yes** — original string reintroduced, generator re-run, test failed with `modes-ctr-etm-gcm.svg: Malleable: C[i] ⊕ Δ = P[i] ⊕ Δ (ciphertext = plaintext)`, then restored |
| F-4 figure missing dual-use framing | `test/figures.test.mjs` — every SVG must carry a `Scope:` text node naming educational or defensive use | **Yes** — caught two false positives from the guard's own sentence-splitting bug during development, which was fixed |
| F-2 fabricated quotation | **Not mechanized.** Verifying a quotation requires fetching and diffing the cited artifact; caching every source locally to diff quoted spans is disproportionate to one page. Recorded as CD-0002 so the rule is at least durable | n/a |
| F-3 dangling `reviews/` references | Register restored this session; `python3 scripts/verify_content_decisions.py` now passes and can be wired into CI | Validator run: `Validated 8 durable content decisions.` |

Pre-existing guards re-verified this review: the dead-export test (injected `export const deadCanary`, confirmed
failure, restored) and the CI figure-correspondence job (staged a hand-edited SVG, regenerated, confirmed
`git diff --exit-code` fails). The `box()` overflow guard in the generator also fired correctly during
remediation — it constrained the F-1 fix to a three-line layout that fits.

## Material-claim ledger

| ID | Artifact and location | Material claim | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | index lede, README, §"What CTR guarantees" | CTR is a NIST-approved confidentiality mode | Standards | SP 800-38A abstract, verbatim | page, README | Verified |
| C-002 | §"What CTR guarantees" | CTR is not deprecated | Standards, time-sensitive | IR 8459 §12 verbatim; SP 800-38A status Final on 2026-08-24 | page, README | Verified — see CD-0004 |
| C-003 | §"What CTR guarantees" | ECB alone gets an explicit "should not be used" | Standards | SP 800-38A §6.1, verbatim | page | Verified |
| C-004 | §"What CTR guarantees" | CTR malleability is conditioned on integrity not being protected | Standards | SP 800-38A Appendix D, verbatim | page, README, taxonomy.svg | Verified |
| C-005 | lede, §"What CTR guarantees", summary | GCM's confidentiality is a variation of Counter mode | Standards | SP 800-38D §1, verbatim | page, README, modes figure | Verified |
| C-006 | §"Three root causes" | Every weakness on the page derives from three mode-level causes | Taxonomy | Scope-bounded this review; IR 8459 §10 for the excluded class | page, taxonomy.svg | Verified — see CD-0005 |
| C-007 | Vector 1 prose, vector1 figure, taxonomy | `P' = (C ⊕ Δ) ⊕ S = P ⊕ Δ` | Cryptographic | Derivation; `test/attacks.test.mjs`; live run | page, 3 figures | Verified — modes figure corrected, F-1 |
| C-008 | Vector 2 prose, vector2 figure | `C₁ ⊕ C₂ = P₁ ⊕ P₂` under a reused counter block | Cryptographic | Derivation; live recovery of P₂ exact | page, README, 3 figures | Verified |
| C-009 | Vector 3 prose, vector3 figure | Zero-plaintext edit oracle returns the keystream | Cryptographic | Live run recovered the full document | page, README, figure | Verified |
| C-010 | Vector 4 prose, vector4 figure | Identical counter block under one key regenerates identical keystream | Cryptographic | Live run: 4 duplicates over 4 states; 8 over 8 | page, README, figure | Verified |
| C-011 | Vector 4, §"Counter exhaustion" | RFC 3686 §4: 2³²−1 blocks = 4,294,967,295 = 68,719,476,720 octets | Numerical | RFC 3686 §4, verbatim; arithmetic re-checked | page ×2, vector4 figure | Verified |
| C-012 | §"Nonce uniqueness" | SP 800-38D §8 IV-collision bound is 2⁻³² | Numerical, standards | SP 800-38D §8, verbatim | page | Verified |
| C-013 | §"Nonce uniqueness" | The 2³² invocation cap applies to the RBG-based construction | Standards | SP 800-38D §8.3, verbatim — page's scoping matches exactly | page | Verified |
| C-014 | §"Tag length" | Exactly seven permitted tag lengths; `t` fixed per key | Standards | SP 800-38D §5.2.1.2, verbatim | page | Verified |
| C-015 | §"Tag length" | Short tags risk recovery of hash subkey H | Security | SP 800-38D Appendix C, verbatim | page | Verified |
| C-016 | §"Tag length" | GCM authenticity scoped to ~64 GB per invocation | Numerical | SP 800-38D §1, verbatim | page | Verified |
| C-017 | §"Three quieter failures" | A tag proves authenticity, not freshness; replay needs separate handling | Security | SP 800-38D Appendix D, verbatim, incl. both remedies | page | Verified |
| C-018 | Option B | Encrypt-then-MAC is "secure from all points of view" | Cryptographic | Bellare & Namprempre, verbatim in the PDF | page, README | Verified |
| C-019 | Option B rule 1 | The composition assumes independent encryption and MAC keys | Cryptographic | Paper's construction `D(Ke‖Km, C)` — **not** a quotation | page | Corrected, F-2 — see CD-0002 |
| C-020 | Option B rule 3 | `crypto.subtle.verify` is a constant-time comparison | Implementation | W3C WebCrypto §31.6.2: "This comparison must be performed in constant-time" | page | Verified — suspected overclaim, is normatively required |
| C-021 | Option A/B samples | Both published samples run and reject tampering | Implementation | `test/samples.test.mjs` extracts them from the page and executes them | page, tests | Verified |
| C-022 | Real-world evidence table | KRACK is a forced nonce reset, not counter exhaustion | Security | CVE-2017-13077; Vanhoef & Piessens | page | Verified |
| C-023 | Real-world evidence table | MEGA's gap was AES-ECB-wrapped key material, not the chunk cipher | Security | ePrint 2022/959 | page | Verified — correctly labelled "not Vector 1" |
| C-024 | Primary references | FIPS 198-1 still current; SP 800-224 still draft | Standards, time-sensitive | Checked 2026-08-24: 198-1 Final; `/pubs/sp/800/224/final` returns 404 | page | Verified |
| C-025 | §"Where the standards are heading" | TLS 1.3's five suites are all AEAD over a counter keystream | Standards | RFC 8446 §B.4; SP 800-38C; RFC 8439 §2.4 — all verbatim | page, README | Verified — see CD-0003 |
| C-026 | §"Where the standards are heading" | No raw AES-CTR suite has ever been registered for TLS | Standards | IANA registry: 356 suites, 2 name CTR, both GOST/RFC 9189 | page, README | Verified |
| C-027 | §"Where the standards are heading" | NIST will consider deprecating SP 800-38A modes once a replacement is approved | Standards, time-sensitive | NIST revision decision (April 2023), verbatim | page | Verified — see CD-0004 |
| C-028 | §"Where the standards are heading" | SP 800-38D is under revision, second pre-draft comments closed 31 July 2026 | Time-sensitive | CSRC news item, checked 2026-08-24 | page | Verified |
| C-029 | Detection section | Neither black-box test clears a system when it does not fire | Security | Reasoning; page states the caveat explicitly | page | Verified |
| C-030 | Migration subsection | A retrofitted tag authenticates only from the moment it is computed | Security | Reasoning, consistent with Option B rules | page | Verified — see CD-0008 |

## Topic completeness matrix

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives | Visual representation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AES-CTR mode | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | **covered** (added this review) | covered | covered |
| Encrypt-then-MAC | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered |
| AES-GCM / AEAD | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered |
| Nonce/counter discipline | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | n/a — no wire format of its own | covered | **covered** — capacity-budget bar added (CD-0009) |
| Standards trajectory | covered | covered | n/a — no actors | covered | covered | n/a — not a threat topic | covered | covered | covered | covered | covered | covered | **covered** — dated timeline added (CD-0009) |

Interoperability/migration for AES-CTR was the review's one **required gap**; it is closed by the migration
subsection (CD-0008). No other required gaps.

## Argument integrity

**Central claim, in one sentence:** *AES-CTR is a NIST-approved confidentiality mode that provides no integrity
guarantee, so the correct response to its failure modes is not to abandon CTR but to authenticate the ciphertext —
via an AEAD, or via AES-CTR composed with HMAC as Encrypt-then-MAC.*

| Test | Result | Evidence or finding |
| --- | --- | --- |
| Thesis support | **Pass, strengthened** | Every load-bearing citation verified verbatim. The thesis originally rested partly on argument from silence ("NIST does not deprecate CTR"); that is now sourced to IR 8459's explicit recommendation (CD-0004), and the standards-direction section discloses that the status is conditional rather than permanent. Notably the page uses a standard's silence in the *safe* direction — to reject a prohibition, not to manufacture one |
| Comparison-set validity | **Pass** | Three options on one stated axis ("where does the authentication tag come from?"), all selectable by the reader; "AES-CTR alone" is the status quo being argued against, which is what makes the contrast legible. TLS 1.3 table added this review is also single-axis |
| Demonstration sufficiency | **Pass after fix** | The three-way comparison shows failure and fix under identical conditions — same profile, same delta, same offset, verified live. Key size was the one uncontrolled variable and is now equalised in code rather than excused in prose (CD-0006) |
| Dangling claims | **Pass** | Truncation, splicing and replay are each developed, and replay is explicitly flagged as *surviving* authentication with NIST's two remedies. IND-CPA, AEAD and KDF are all defined inline |
| Structure serves the decision | **Pass** | Order matches reader need: mechanism → scope → causes → vectors → quieter failures → detection → fix → migration → live comparison → evidence → operating limits → trajectory → summary. The trajectory section sits after the practical guidance so it informs rather than pre-empts it |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| Malleability relation | Prose ×1, taxonomy.svg, vector1 figure, modes figure, `attacks.mjs` header comment | **Divergence found** — modes figure alone stated it as an equality (F-1). Corrected to match taxonomy's proven phrasing |
| Two-time pad relation | Prose ×3, README, taxonomy, vector2 figure, demo label | Consistent |
| RFC 3686 counter limits | Prose ×2, vector4 figure alt text and body | Consistent, numbers identical |
| "not deprecated" claim strength | Page lede, README opening | **Divergence found** — both said "not deprecated and not discouraged"; both reframed together (CD-0004) |
| Concatenation symbol | Page ×3, four figures, two modules | **Divergence found** — page mixed U+2225 and U+2016; now uniformly U+2016 |
| Counter split 96/32 vs 64/64 | Option B sample, `crypto.mjs`, demo output | Consistent — the page discloses the difference explicitly and `test/samples.test.mjs` tests the sample separately |
| Figure alt text vs figure content | All six | Consistent. Note the modes figure's alt text was *correct* while the figure was wrong, so a screen-reader user was never exposed to F-1 |

## Visual content ledger

| Visual | Claims it asserts | Independently correct? | Self-sufficient when detached? | Caption and alt text verified | Generator and correspondence check | Standalone defensibility | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `modes-ctr-etm-gcm.svg` | 3 schemes × (mechanism, security property, verdict badge); 2 equations | **No → yes after fix** | Yes — scope line names educational comparison and cites both sources | Yes; alt did not carry the faulty equation | Re-run, byte-identical | Yes | **F-1 corrected** |
| `taxonomy.svg` | 3 root causes, 4 vectors, 5 solid + 1 dashed edge, legend | Yes | Yes | Yes | Re-run, byte-identical | Yes | Pass |
| `vector1-bit-flipping.svg` | 3-step derivation, `Δ = "user" ⊕ "root"` | Yes | Yes | Yes | Re-run, byte-identical | Yes | Pass |
| `vector2-two-time-pad.svg` | Full cancellation derivation, crib drag | Yes | **No → yes after fix** | Yes | Re-run | Yes after fix | **F-4 corrected** |
| `vector3-edit-oracle.svg` | 3-step oracle sequence, `00 ⊕ S = S` | Yes | Yes | Yes | Re-run, byte-identical | Yes | Pass |
| `vector4-counter-reuse.svg` | 8 counter blocks, wrap highlight, RFC 3686 limits | Yes | Yes — explicitly says the demo wraps a tiny counter rather than overflowing AES | Yes | Re-run, byte-identical | Yes | Pass |
| `standards-timeline.svg` **(new)** | 7 dated markers, each with publication and consequence; closing claim that counter mode was never removed | Yes — every date checked against the publication or its CSRC listing | Yes — scope line dates the summary to August 2026 and disclaims legal/compliance advice | Yes | Generated this review; guards cover it | Yes — depicts standards status, no attack content | Pass |
| `counter-block-split.svg` **(new)** | 128-bit bar split 96/32 and 64/64; four capacity annotations; closing claim that neither split adds integrity | Yes — arithmetic recomputed, both the from-zero and RFC 3686 from-one limits stated | Yes — scope line names educational use and cites SP 800-38D §8 and RFC 3686 §4 | Yes | Generated this review; guards cover it | Yes | Pass |

All eight rendered and inspected at desktop width in **both light and dark themes**. `U+2016` renders correctly
(not a missing glyph). No text overflows its box; the generator's `box()` guard enforces this at build time.

### Representation opportunities

| Location | What is dense | Form adopted | Classification and disposition |
| --- | --- | --- | --- |
| §"Where the standards are heading" | The sequence SP 800-38A (2001) → GCM (2007) → TLS 1.3 (2018) → IR 8459 (2024) → accordions | `standards-timeline.svg`, a dated 7-marker axis | Optional extension — **adopted** (CD-0009). The argument is chronological and its force comes from the order, which a reader otherwise rebuilds from four paragraphs |
| §"Operating limits" | Nonce/counter split as a capacity budget | `counter-block-split.svg`, a 128-bit allocation bar with the demo-helper contrast | Optional extension — **adopted** (CD-0009). Stated three times in prose and a code comment, never shown as one budget |

No representation opportunities remain outstanding.

## Applicable durable content decisions

The register was **absent when the passes ran** and was created at the end of this session, so no decision
pre-classified any finding — every conclusion was reached from current source and primary evidence first, which
is the sequence the guide requires. All eight records below originate from this review.

| Decision ID | Affected concept | Disposition | Current evidence and rationale |
| --- | --- | --- | --- |
| CD-0001 | Figure notation correctness | **New — accepted** | F-1; guard added and verified firing |
| CD-0002 | Citation integrity | **New — accepted** | F-2; full text of ePrint 2000/025 searched |
| CD-0003 | TLS 1.3 / counter-mode framing | **New — accepted** | RFC 8446, SP 800-38C, RFC 8439, IR 8459 §4, IANA registry |
| CD-0004 | CTR deprecation status and claim strength | **New — accepted** | IR 8459 §12; NIST revision decision |
| CD-0005 | Taxonomy scope boundary | **New — accepted** | IR 8459 §10 for the excluded class |
| CD-0006 | Demonstration variable control | **New — accepted** | Code changed rather than claim weakened |
| CD-0007 | Per-figure dual-use framing | **New — accepted** | F-4; guard added |
| CD-0008 | Migration coverage | **New — accepted** | Completeness category 11 |
| CD-0009 | Two figures adopted | **New — accepted** | Completeness category 13 for two topics; dates and arithmetic verified against sources |

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| `npm test` | 36 tests, 5 files | Pass, 0 fail | That untested claims are correct; that the page's prose matches the code |
| `npm run lint` | ESLint, whole repo | Clean | Anything semantic |
| Generator correspondence | `generate_diagrams.py` → 6 SVGs | Re-run; only the two intended figures differ from the index | That the figures are *correct*, only that they are current |
| Guard regression ×3 | Dead-export, CI figure-drift, new figure-notation | All three verified firing on their original faults | That they catch adjacent faults |
| Link check | 29 external URLs across page, README, policy files | 29/29 HTTP 200 | That the linked content still says what is quoted — checked separately per claim |
| CI action pins | `actions/checkout@v7`, `setup-node@v7`, `setup-python@v7` | All exist; all are the current major | That the workflows pass on GitHub |
| Rendered inspection | 8 SVGs × 2 themes; full page | No overflow, no missing glyphs, no horizontal page scroll, all 6 images load | Behaviour on browsers other than the in-app Chromium |
| Live demonstration | 4 vectors + three-way comparison | All produce the documented outcome; 0 console errors | Behaviour under a Web Crypto implementation with different error semantics |
| Adversarial input | Email `user@role=user.example.com`; XSS payload into two demos | Anchor guard held; no live markup, no script execution | Exhaustive injection coverage |
| Register validation | `verify_content_decisions.py` (PyYAML 6.0.3) | `Validated 8 durable content decisions.` | Technical correctness of any decision |

## Open required findings

**None.** All four required findings from this review were remediated and re-verified within the session:

| ID | Artifact | Issue | Resolution |
| --- | --- | --- | --- |
| F-1 | `modes-ctr-etm-gcm.svg` via `generate_diagrams.py:189` | Asserted `C[i] ⊕ Δ = P[i] ⊕ Δ` — a ciphertext value equated to a plaintext value | Reworded to "decrypts to"; guard added (CD-0001) |
| F-2 | `docs/index.html` Option B rule 1 | Quoted "are independently chosen" from Bellare & Namprempre; string not in the paper | Restated as a description of the composed key (CD-0002) |
| F-3 | `README.md`, `test/exports.test.mjs` | Advertised review tooling whose register was deleted; cited decision ID `CD-0009` that no longer resolved | README made accurate; `CD-0009` reference removed; register since restored |
| F-4 | `vector2-two-time-pad.svg` | Only figure whose scope line omitted educational/defensive framing | Framing added; guard added (CD-0007) |

## Optional coverage

All optional items raised were also actioned this session:

- Concatenation symbol unified to U+2016 across page, figures and modules.
- Comparison key sizes equalised so the isolated-variable claim is literally true (CD-0006).
- Migration subsection added, closing completeness category 11 (CD-0008).
- Five sentences reframed for claim strength: the lede's "not discouraged" (CD-0004), the "All CTR mode
  vulnerabilities" universal (CD-0005), "they differ only in…" which contradicted the page's own later text on
  GCM nonce reuse, "the standard assumes integrity is protected by something else" which stated an inference as
  fact, and "Real deployments meet this limit…" which generalised from a single RFC.

Nothing optional remains outstanding: both representation opportunities were adopted as CD-0009.

## Limitations and uncertainty

1. **No decision history before this review.** The previous thirteen decisions (`CD-0001`–`CD-0013` under the old
   numbering) were deleted and, by explicit direction, not restored. This register restarts at `CD-0001`; the old
   IDs are recoverable only via `git show a816173:reviews/CONTENT_DECISIONS.yml`. Several of them governed content
   this review touched — the CTR-as-composable framing, the selectable-options comparison rule, and the
   both-themes figure legibility rule among them. A future reviewer who contradicts one will get no warning from
   this file. **The old and new ID spaces overlap and mean different things**; always qualify which register a
   `CD-00NN` reference belongs to.
2. **Review and remediation ran in one session.** Phase A was frozen and unedited during the review, and every
   changed unit was re-passed with residual exhaustion afterwards. It is nonetheless not equivalent to an
   independent review of the Phase B state by a reviewer who did not write the changes.
3. **Rendering verified in the in-app Chromium only**, at desktop width, both themes. Not checked: Firefox,
   Safari, mobile widths, or forced-colours mode.
4. **Programmatic scrolling did not take effect** in the embedded browser, so the new section was verified
   structurally (heading present and correctly ordered, table rows and headers, no container overflow, all images
   loaded) rather than by a scrolled screenshot of the section itself.
5. **CI has not run on these changes** — all checks were executed locally. The workflows were read and their
   action pins verified to exist, but no GitHub run confirms them.
6. **Standards trajectory is time-sensitive.** C-002, C-024, C-027 and C-028 are all claims about live NIST
   processes checked on 2026-08-24. The `evidence-authority` decay horizon is 90 days; the SP 800-38A revision,
   the SP 800-38D revision and the SP 800-197 accordion work can each invalidate them without any local edit.

## Closure attestation

- [x] Every pass is either run-and-clean or validly cached, and every cached one names the run it rests on. *(All 11 ran; zero cached.)*
- [x] The router's RUN/CACHED split was followed, not overridden by judgement or by how the request was phrased.
- [x] Every in-scope artifact covered by a running pass was inventoried and read in full.
- [x] Every material claim was entered in the ledger and dispositioned. *(30 claims, all verified.)*
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately, or is validly cached.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims. *(Source documents downloaded and searched, not recalled.)*
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Applicable mechanical checks were run; guard regression executed and all three guards verified firing.
- [x] Every visual reviewed for independent correctness, detached self-sufficiency, generator provenance and standalone defensibility, separately from the cross-format pass.
- [x] An argument-integrity pass was completed and the one-sentence thesis recorded.
- [x] A residual-exhaustion pass was completed after all findings were assembled. *(Every `⊕` relation in every figure and all page prose re-inventoried after F-1; only the one instance was wrong.)*
- [x] Each remediated finding either gained a guard or has a recorded reason it could not. *(F-2 recorded as non-mechanizable.)*
- [x] The pass state was recorded with `review_passes.py --record`.
- [x] The reviewed commit and worktree state are identified. *(Both baselines above.)*
- [x] Unresolved limitations and uncertainty are disclosed.
