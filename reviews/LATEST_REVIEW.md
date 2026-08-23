# Fresh review record: ctr-mode documentation, demonstrations, and figures

> Lives at `reviews/LATEST_REVIEW.md` and is overwritten by each new review — this file always holds the
> most recent one. Earlier records are in git, not in this folder:
> `git log -p --follow reviews/LATEST_REVIEW.md` for the full series,
> `git show <commit>:reviews/LATEST_REVIEW.md` for one in full.

## Status and baseline

- Status: Complete with findings — 11 required findings and 5 optional items raised, all remediated in an authorized pass afterwards
- Review mode: Fresh review, followed by one authorized remediation phase
- Review date: 2026-08-23
- Reviewer: doc-review standard, applied to the frozen commit below
- Branch: `fix/html-escaping-by-default`
- Commit: `ade436e488b6c1e7b5d53f07fa2582fe011f5ddb`
- Worktree: Clean at review time, and unchanged for the whole review
- Review state ID: `9771642a1ef695c6409145ab23fa1d4edb6d8458b15948f9c028537025c38788`
  (scoped content fingerprint `ebad0a00735d738b8bbda940a1cfd46ff65c1cc4f6417ce356742166984d30df`, 41 files)
- State-capture command: `python3 scripts/capture_review_state.py`
- Baseline changed during review: No. Every finding below was reached against `ade436e`. Remediation
  followed as a separate authorized phase and is described under **Remediation**. A post-remediation
  fingerprint is deliberately not pinned here — writing this record changes the state it would describe,
  so any value quoted would be stale on arrival. Re-capture after committing.

The previous record covered `2845624`. Three commits landed after it, most recently `ade436e`
(escape-by-default HTML construction), which no record covered.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `docs/index.html` | Documentation and UI shell | `styles.css`, `js/ui.mjs`, `diagrams/*.svg` | Yes |
| `docs/styles.css` | Stylesheet | `docs/index.html` | Yes |
| `docs/js/crypto.mjs` | Cryptographic primitives | `attacks.mjs`, `test/attacks.test.mjs` | Yes |
| `docs/js/attacks.mjs` | Attack vectors and defensive controls | `ui.mjs`, `test/attacks.test.mjs` | Yes |
| `docs/js/ui.mjs` | UI wiring and verdict rendering | `docs/index.html` | Yes |
| `docs/js/html.mjs` | Escape-by-default HTML construction (new in `ade436e`) | `ui.mjs`, `test/html.test.mjs` | Yes |
| `docs/diagrams/generate_diagrams.py` | Diagram generator | the six committed `.svg` files | Yes |
| `docs/diagrams/*.svg` (6) | Figures | `docs/index.html`, `README.md` | Yes — each also loaded standalone, light and dark |
| `test/attacks.test.mjs`, `test/html.test.mjs` | Test suites | `docs/js/*` | Yes |
| `README.md` | Repository landing page | repository root | Yes |
| `package.json` | Package metadata and scripts | repository root | Yes |
| `eslint.config.mjs` | Static analysis configuration | `docs/js/`, `test/` | Yes |
| `DISCLAIMER.md`, `SECURITY.md`, `CONTRIBUTING.md` | Scope, reporting, contribution policy | repository root | Yes |
| `.github/workflows/*.yml`, `.pre-commit-config.yaml` | CI, deployment, secret gates | repository | Yes |
| `reviews/CONTENT_DECISIONS.yml` | Durable decision register | `scripts/verify_content_decisions.py` | Yes |

Out-of-scope boundaries and reason: general cryptography outside CTR / GCM / Encrypt-then-MAC behaviour;
`node_modules/`; the MEGA and Hongjun Wu papers were confirmed to resolve but not re-read from source,
resting instead on CD-0004 and CD-0005.

## Review passes

| Pass | Complete | Evidence or notes |
| --- | --- | --- |
| Factual and technical correctness | Yes | Every standards quote re-extracted from the published PDFs and compared verbatim. All correct. |
| Evidence, authority, version, date, jurisdiction, and applicability | Yes | 19 page links and 10 register URLs fetched. One register URL returned 404 (F-9). §8.2.2 confirmed as the RBG-based construction; §8.3's cap correctly scoped to it. |
| Adversarial wording, assumptions, attacker state, and counterexamples | Yes | Demonstrations driven with adversarial inputs, not defaults: an email containing "user", the second counter width, edited inputs after encryption. Four false claims surfaced this way (F-2, F-3, F-4). |
| Terminology, taxonomy, and conceptual boundaries | Yes | AEAD never expanded anywhere (F-6); IND-CPA introduced undefined; "approved KDF" used at normative strength with no source (F-7). |
| Cross-format consistency | Yes | `package.json` still carried the framing CD-0008 superseded (F-5); README omitted `html.mjs` (F-11); three figures lacked captions the prior record claimed they had (F-10). |
| Cross-page consistency, prerequisites, sequence, and duplication | Yes | README, page, DISCLAIMER and diagrams reconciled on framing, Vector 3 mechanism and Vector 4 scope. Consistent apart from F-5 and F-11. |
| Topic completeness | Yes | Matrix below. No required knowledge gap; the defects were in rendering and demonstration integrity, not coverage. |
| Mechanical, link, generator, executable, and rendered-output validation | Yes | Table below. Generator provenance established by re-execution; rendering checked in **both** themes, which is what exposed F-1. |
| Durable content-decision reconciliation | Yes | CD-0001…CD-0009 dispositioned below after independent claim review. None reversed. |
| Residual exhaustion | Yes | After F-1 was found in one figure, all six were swept for the same sentinel class (two more hit) and the generator was read for every other emission path. After F-3, every verdict site was audited, which produced F-4. |
| Argument integrity | Yes | Thesis extracted and tested; comparison set, demonstration sufficiency and dangling claims checked separately. See below. |

### Argument integrity

**Thesis, in one sentence:** *AES-CTR is a NIST-approved confidentiality mode that makes no integrity
guarantee, so the correct response is not to abandon it but to authenticate the ciphertext — with an
AEAD, or with Encrypt-then-MAC.*

Supported at that strength and scope by the page's own sources, all re-verified verbatim.

- **Comparison-set test** — passes. Three rows, all options the reader can select, one axis. CD-0009 holds.
- **Demonstration sufficiency** — the defensive comparison passes (identical forgery, three outcomes).
  Vectors 1 and 4 **failed**: for the inputs in F-2 and F-3 they did not show the contrast they claimed.
- **Dangling-claim test** — truncation, splicing and replay are each developed. "Approved KDF" and
  IND-CPA were introduced and never developed (F-6, F-7).
- **Structure test** — passes; section order matches the reader's decision path.

## Material-claim ledger

| ID | Artifact and location | Material claim | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-101 | `index.html` lede, §What CTR guarantees | CTR is one of five approved SP 800-38A confidentiality modes; NIST does not advise against it | Standard | SP 800-38A abstract, quoted verbatim | README, DISCLAIMER, `package.json`, modes figure | **Corrected** — `package.json` still said "unsafe" (F-5) |
| C-102 | `index.html` §What CTR guarantees | ECB alone carries a "should not be used" caveat | Standard | SP 800-38A §6.1, quoted | page only | Verified |
| C-103 | `index.html` §What CTR guarantees | CTR malleability is conditioned on integrity "not being protected" | Standard | SP 800-38A App. D (Error Properties), quoted | modes figure, taxonomy | Verified |
| C-104 | `index.html` §Mechanism, §Vector 4 | Counter blocks must be distinct across all messages under a key | Standard | SP 800-38A §6.5, quoted | vector4 figure, `attacks.mjs` | Verified |
| C-105 | `index.html` lede, §What CTR guarantees | GCM's confidentiality is "a variation of the Counter mode of operation" | Standard | SP 800-38D §1, quoted | README, modes figure, callout | Verified |
| C-106 | `index.html` §Operating limits | GCM authenticity assurance scoped to "up to about 64 gigabytes per invocation" | Standard | SP 800-38D §1, quoted | page only | Verified |
| C-107 | `index.html` §Tag length | Exactly seven permitted tag lengths; one fixed value per key | Standard | SP 800-38D §5.2.1.2, both sentences quoted | page only | Verified |
| C-108 | `index.html` §Tag length | Short tags may let the attack "produce the hash subkey, H, after which the authentication assurance is completely lost" | Standard | SP 800-38D **App. C**, quoted verbatim; attribution confirmed against App. B | page only | Verified — correctly attributed |
| C-109 | `index.html` §Nonce uniqueness | The ≤2⁻³² bound is §8; the 2³² invocation cap is §8.3 and applies to the RBG-based construction of §8.2.2 | Standard | SP 800-38D §8, §8.3, §8.2.2, all quoted | page only | Verified — including that the cap plus a ≥96-bit nonce is what makes §8's bound hold |
| C-110 | `index.html` §Quieter failures | GCM "does not inherently prevent … replaying"; remedies are duplicate-IV monitoring or a sequence number / time stamp in the AAD | Standard | SP 800-38D App. D, quoted | page only | Verified |
| C-111 | `index.html` §Vector 4, §Counter exhaustion, vector4 figure | RFC 3686 §4 gives the block counter 32 bits, capping a packet at 2³²−1 blocks = 68,719,476,720 octets | Standard | RFC 3686 §4, quoted verbatim from the RFC text | prose ×2, figure, alt text | Verified |
| C-112 | `index.html` §Option B | Encrypt-then-MAC "is secure from all points of view, making it a good choice for a standard" | Research | Bellare & Namprempre §1.1, quoted | modes figure scope line | Verified |
| C-113 | `index.html` §Option B rule 1 | The composition assumes the keys "are independently chosen" | Research | Bellare & Namprempre §4, quoted verbatim ("We stress that these keys are independently chosen") | `crypto.mjs`, samples, tests | Verified |
| C-114 | `index.html` §Option B rule 3 | Encrypt-then-MAC verifies the tag before decrypting | Research | Bellare & Namprempre §4 ("Decrypt+verify is performed by first verifying the tag and then decrypting C") | `crypto.mjs`, sample, demo | Verified |
| C-115 | `index.html` §Option B rules 1 and 3, §Rekeying | Derive both keys from a master secret with an "approved KDF" | **Author's rule stated at normative strength, unsourced** | No citation given; NIST's approved techniques are SP 800-108 Rev. 1 | two occurrences | **Corrected** (F-7) — now cites SP 800-108 Rev. 1 |
| C-116 | `index.html` §Option A, ×9 across the page | "AEAD" as the primary recommendation | Terminology | Never expanded anywhere in the repository | README ×2, DISCLAIMER ×1 | **Corrected** (F-6) — expanded on first use |
| C-117 | `index.html` §Option B | The result holds "given an IND-CPA encryption scheme and a strongly unforgeable MAC" | Research, conditional | Bellare & Namprempre; term left undefined for the reader | page only | **Corrected** (F-6) — IND-CPA now defined and the condition attributed |
| C-118 | `index.html` evidence table | KRACK forced a nonce reset, not counter exhaustion | Research + CVE | NVD CVE-2017-13077 fetched and compared; description matches | vector mapping | Verified |
| C-119 | `index.html` §Vector 1, `attacks.mjs`, vector1 figure | Flipping ciphertext bytes forges `role=root` with zero error spread | Implementation | `flipCiphertextSubstring` driven with adversarial input | prose, figure, demo, tests | **Corrected** (F-3) — held only when the email contained no "user" |
| C-120 | `index.html` §Vector 4, `attacks.mjs`, vector4 figure | A counter too small for the traffic regenerates identical keystream | Implementation | `simulateCounterRollover` driven at both offered widths | prose, figure, demo, tests | **Corrected** (F-2) — the 3-bit option produced no collision at all |
| C-121 | `index.html` §Vector 2 demo | "Full Message 2 Recovered" | Implementation | Driven with inputs edited after encryption | demo verdict | **Corrected** (F-4) — asserted while displaying garbage |
| C-122 | `index.html` §Vector 3 demo | "100% of Plaintext Recovered in a Single Request" | Implementation | Driven with the document edited after initialisation | demo verdict | **Corrected** (F-4) — recovered a different document from the one shown |
| C-123 | `modes-ctr-etm-gcm.svg` | The three security-property boxes carrying each option's guarantee | Figure content | Rendered standalone in light and dark | figure only | **Corrected** (F-1) — unreadable black boxes in light theme |
| C-124 | `vector2-two-time-pad.svg` | `C₁ = P₁ ⊕ S` and `C₂ = P₂ ⊕ S`, the figure's two inputs | Figure content | Rendered standalone in light and dark | figure only | **Corrected** (F-1) |
| C-125 | `vector4-counter-reuse.svg` | Blocks 1–4 and their counter values, the half blocks 5–8 repeat | Figure content | Rendered standalone in light and dark | figure only | **Corrected** (F-1) |
| C-126 | `docs/js/html.mjs` | Every interpolated value is escaped unless wrapped in `raw()` | Implementation | Module read in full; all four `raw()` sites confirmed to wrap `html`-produced output; 5 tests | `ui.mjs` call sites | Verified — but unenforced by tooling (O-2) |
| C-127 | `index.html` Option A and Option B samples | Both published samples work and reject tampering | Implementation, copied by readers | Not executed by any test at review time | — | **Corrected** (O-3) — now extracted from the page and executed |

## Topic completeness matrix

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives | Visual representation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTR mode and its integrity gap | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | **Was a required gap** — three figures illegible in light theme and all six illegible at mobile width (F-1, O-1); now covered |
| The two fixes (AEAD, Encrypt-then-MAC) | Covered — AEAD now expanded | Covered | Covered | Covered | Covered — key independence, IND-CPA condition now stated | Covered | Covered | Covered | Covered — samples now executed by tests | Covered — SP 800-108 KDF now cited | Covered | Covered | Covered |
| Operating limits and rekeying | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Covered | Not applicable — no alternative in scope | Optional extension, not taken; prose and the RFC bound are clear |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| "CTR is approved, not unsafe" (CD-0008) | title, lede, callout, README, DISCLAIMER, `package.json`, modes figure | **One survivor** — `package.json` description (F-5), now corrected |
| Encrypt-then-MAC key independence | prose rule 1, `crypto.mjs`, published sample, demo, tests | Consistent; sample now also tested (O-3) |
| RFC 3686 counter bound | Vector 4 prose, Operating-limits prose, vector4 figure, figure alt text | Consistent, all four verified against the RFC |
| Vector 1 mechanism | prose, vector1 figure, `attacks.mjs`, demo, tests | **Divergent** — demo could flip a different field from the one prose and figure describe (F-3); now consistent |
| Vector 4 mechanism | prose, vector4 figure, `attacks.mjs`, demo, `<select>` labels | **Divergent** — one offered option demonstrated nothing (F-2); now consistent |
| Repository structure | README `Structure` list vs `docs/js/` contents | **Stale** — `html.mjs` absent (F-11); now listed |
| Figure captions | `LATEST_REVIEW.md` completeness matrix vs `index.html` | **False** — record claimed six captioned, three were not (F-10); all six now captioned |

## Visual content ledger

| Visual | Claims it asserts | Independently correct? | Self-sufficient when detached? | Caption and alt text verified | Generator and correspondence check | Standalone defensibility | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `modes-ctr-etm-gcm.svg` | Three options, one axis; each option's mechanism, security property and tag source | Content correct; **not legible in light theme** | Scope line present but rendered at ~4px on mobile | Alt text verified (650 chars); caption present | Re-run: byte-identical to committed | Neutral comparison | **Corrected** — sentinel leak fixed, regenerated |
| `taxonomy.svg` | Three root causes → four vectors; solid = primary, dashed = contributing | Yes | Yes — scope line and edge legend | Alt text verified; **caption was missing** | Re-run: byte-identical | Scope line present | **Corrected** — caption added |
| `vector1-bit-flipping.svg` | Three-step bit-flip math; outcome in danger colour per CD-0007 | Yes | Yes — scope line names the local in-memory service | Alt text verified; **caption was missing** | Re-run: byte-identical | Local target named | **Corrected** — caption added |
| `vector2-two-time-pad.svg` | Keystream cancellation and two recovery paths | Content correct; **two input boxes not legible in light theme** | Scope line present | Alt text verified; **caption was missing** | Re-run: byte-identical | Scope line present | **Corrected** — sentinel leak fixed, caption added |
| `vector3-edit-oracle.svg` | Three-step edit-oracle attack; server re-encryption emits the keystream | Yes | Yes | Alt text (407 chars) and caption verified | Re-run: byte-identical | Local oracle named | Verified, unchanged |
| `vector4-counter-reuse.svg` | Eight blocks, 2-bit counter, blocks 5–8 repeat 1–4; RFC 3686 bound | Content correct; **blocks 1–4 not legible in light theme** | Scope line present | Alt text (452 chars) and caption verified | Re-run: byte-identical | Explicitly not an AES overflow | **Corrected** — sentinel leak fixed, regenerated |

Provenance note: all six SVGs were regenerated in an isolated directory from the committed generator and
compared by SHA-256 **before** any edit. All six matched byte-for-byte, so correspondence was established
by re-execution, not assumed. That check passed while three figures were rendering as black boxes — exactly
why it does not substitute for opening the figure.

### Representation opportunities

| Location | What is dense | Proposed form | Required gap or optional extension |
| --- | --- | --- | --- |
| §Operating limits, rekeying discipline | Four sequential rules with a threshold relationship | Timeline or threshold diagram | Optional extension — not taken; the numbered list is clear and the RFC bound is stated numerically |
| §Quieter failures | Truncation, splicing, replay — three independent failure shapes | Three-panel comparison | Optional extension — not taken; each is two sentences and self-contained |

## Applicable durable content decisions

| Decision ID | Affected concept | Disposition | Current evidence and rationale |
| --- | --- | --- | --- |
| CD-0001 | Three root causes, four vectors | Reaffirmed | Intact in prose, taxonomy figure and code. |
| CD-0002 | "Only approved mitigations" framing | Unchanged — remains superseded by CD-0008 | Preserved as history, not rewritten. |
| CD-0003 | GCM nonce uniqueness and 2³² ceiling | Reaffirmed; record text corrected | Coverage intact under a renamed, widened section. The `approved_outcome` named a heading that no longer exists (F-8) and now describes the current location and why it moved. |
| CD-0004 | Evidence-table citation policy | Reaffirmed | KRACK CVE re-fetched from NVD and matches; the other three rows correctly say "no CVE assigned". |
| CD-0005 | MEGA as a boundary case under root cause 3 | Reaffirmed | Row still states AES-CCM* chunk authentication, AES-ECB key wrapping, and the malicious-server model. |
| CD-0006 | GHASH vs GMAC; CBC error propagation | Reaffirmed | No occurrence of "GMAC" as a name for GCM's tag. Its CBC element remains inapplicable after CD-0009. |
| CD-0007 | Never render a compromise outcome in the safe colour | Reaffirmed, and reinforced | Vector 1's outcome is still in the danger palette. F-1 was the adjacent failure: a *neutral* fill rendering as black. CD-0010 now covers colour correctness as rendered, not only as chosen. |
| CD-0008 | CTR framed as needing composition, not avoidance | Reaffirmed; one violation found and a dead source URL corrected | `package.json` still carried the superseded framing (F-5). The record's FIPS 198-1 URL returned 404 (F-9) — the page's own link was correct. |
| CD-0009 | Compare only selectable options | Reaffirmed | Three-row axis intact; no CBC row, no padding-oracle claim. |
| CD-0010 | Figure legibility as rendered | **New** | Theme sentinels never reach output as literal values; figures scroll rather than shrink below legibility. |
| CD-0011 | Verdicts derived from observed results | **New** | Every demonstration reports what it produced; ambiguous or non-demonstrating runs fail loudly. |

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| `npm test` | whole repository | 32/32 pass (22 before remediation) | Nothing about claims the tests do not assert — F-1 through F-5 all passed the pre-existing suite |
| `npm run lint` | `docs/js/`, `test/` | Clean | Nothing about correctness; the two new `innerHTML` rules were separately proven to fire on the fault they target |
| `python3 docs/diagrams/generate_diagrams.py` | six SVGs | Regenerates; two consecutive runs byte-stable; matched committed files before any edit | Correspondence and stability only — **not** that the figure renders legibly. Three did not. |
| `guard_sentinels()` / `_paint()` | generator output | Both verified to raise on the exact markup that shipped | That other classes of colour fault are caught |
| Link check | 20 page links + 10 register URLs | All 200 after F-9 | That a resolving link supports the claim beside it |
| Rendered validation | page + six SVGs standalone, **light and dark**, 375px and 1280px | Zero console errors; no page-level horizontal scroll at either width | Behaviour in engines other than the one tested |
| Sample execution | Option A and Option B, extracted from `index.html` | 7 tests: round-trip, 1-bit tamper, AAD mismatch, counter-block coverage, truncation, short payload, wrong MAC key | That the samples are appropriate for every deployment |
| `python3 scripts/verify_content_decisions.py` | register | 11 decisions validated | Structure and references only, not technical correctness |
| Demonstration drive-through | all five demos, adversarial inputs | All five report outcomes matching what they produced | That every possible input is covered |

## Open required findings

None. All eleven were remediated in the authorized pass below and re-verified.

## Remediation

| # | Finding | Resolution | Verified by |
| --- | --- | --- | --- |
| F-1 | Three SVGs emitted `@neuf`/`@neus` as literal attribute values; nine content boxes rendered as unreadable black in light theme, live on the deployed site | `box()` no longer gates the sentinel translation on both properties matching; per-property classes `.fneu`/`.sneu` let a neutral fill compose with a semantic stroke. The Vector 4 hand-written rect now calls `_paint()`. `_paint()` raises on an unmapped sentinel and `guard_sentinels()` fails generation if one survives. Dead `.neu`, `.cellA` and `.xor` rules removed. All six regenerated. | Zero sentinels in any SVG; all six rendered standalone in light and dark; both guards proven to fire |
| F-2 | Vector 4's 3-bit option ran 8 blocks against 8 states, produced no collision, and left the previous run's "Counter Overflow Detected" banner in place | Run scales to `2 ** bits * 2`. `simulateCounterRollover` throws when `numBlocks <= states`. Verdict written on both branches, naming the actual width, block count and duplicate count. | 2-bit → 8 blocks / 4 duplicates; 3-bit → 16 blocks / 8 duplicates; regression test |
| F-3 | Vector 1 flipped the first `"user"` in the plaintext, so `user@example.com` rewrote the email while the banner reported escalation | `flipCiphertextSubstring` takes an `anchor`; the target must sit immediately after it. Unanchored use now throws on an ambiguous target instead of guessing. UI anchors on `"role="`. | `user@example.com` now forges `role=root` with the email intact; regression tests for ambiguity, missing anchor and misplaced target |
| F-4 | Verdict banners asserted outcomes unconditionally (Vectors 1–4 and the defensive demo) | Every verdict derived from the observed result. Vector 2 recovers using the plaintext actually encrypted and flags edited inputs; Vector 3 re-encrypts when the document changes; the defensive verdict names the schemes that actually accepted and rejected. | All five demos re-driven with the inputs that previously produced false claims |
| F-5 | `package.json` description still read "Why AES-CTR is unsafe without authentication" | Rewritten to the CD-0008 framing | Repository-wide grep: no stale framing remains |
| F-6 | "AEAD" never expanded (9× on the page); IND-CPA undefined | AEAD expanded at first substantive use; IND-CPA defined and the conditional nature of the Bellare & Namprempre result made explicit | Read in place |
| F-7 | "approved KDF" used twice at normative strength with no source | Both cite SP 800-108 Rev. 1, added to Primary references with what it supports | URL verified 200; scope confirmed against the abstract |
| F-8 | CD-0003's `approved_outcome` named a section that no longer exists | Updated to the current heading, recording the rename and that the decision is about coverage | Register validates |
| F-9 | CD-0008 cited FIPS 198-1 at a 404 URL | Corrected to the hyphenated path the page already used, with a note | All 10 register URLs now 200 |
| F-10 | `LATEST_REVIEW.md` claimed six captioned figures (three were not), "14/14" tests, and two different link counts | Three captions added; this record replaces the stale one | 6/6 captions confirmed in the rendered DOM |
| F-11 | README structure list omitted `html.mjs` | Listed, with the test-suite description updated | Read in place |

Optional items, all taken:

| # | Item | Resolution | Verified by |
| --- | --- | --- | --- |
| O-1 | Figures rendered at 0.372 scale on a 375px viewport — 11px text at ~4px | Figures scroll inside their own container with a 680px minimum, the same idiom the evidence table uses | 375px: scale 0.756, smallest text ~8.3px, figures scroll internally, page does not. 1280px unchanged at 820px |
| O-2 | Nothing enforced escape-by-default; it rested on convention | Two `no-restricted-syntax` rules reject `innerHTML` assigned from an untagged template literal, alone or concatenated | Both proven to fire on the exact fault, and to pass correctly tagged markup |
| O-3 | The published samples were untested and could drift from the page | `test/samples.test.mjs` extracts both samples from `index.html` and executes them — 7 tests | 7/7 pass |
| O-4 | `ui.mjs` used `1 << bits`, the idiom `attacks.mjs` warns against, and ignored the returned `maxCounterValue` | Uses the returned value | Lint and tests |
| O-5 | Dead `.blk.safe` CSS rule | Removed, along with the dead `.cellA` and `.xor` rules in the generator | Grep across SVGs and stylesheet |

## Optional coverage

No optional coverage remains outstanding. The two representation opportunities recorded above were
assessed and deliberately not taken: in both cases the prose is clear without a figure, and adding one
would meet a quota rather than clarify anything.

## Limitations and uncertainty

- The MEGA (ePrint 2022/959) and Hongjun Wu (ePrint 2005/007) papers were confirmed to resolve but not
  re-read from source this pass; those two evidence rows rest on CD-0004 and CD-0005.
- Rendered checks ran in one Chromium-based engine, at 375px and 1280px, in both themes. Other engines
  were not exercised. The previous record's dark-theme-only limitation is discharged; this narrower one
  replaces it.
- The published samples execute under Node's Web Crypto. They are standard Web Crypto calls and the demos
  exercise the same APIs in-browser, but the samples themselves were not run in every target engine.
- The deployed GitHub Pages site was confirmed to carry F-1 before remediation. It will not carry the fix
  until this branch merges to `main`; re-check after deployment.
- FIPS 198-1's withdrawal remains only *proposed*, and SP 800-224 remains a draft. The page states the
  position as of this review rather than asserting a settled outcome. Both need rechecking over time.
- This record describes an uncommitted post-remediation worktree. Re-capture the fingerprint after commit.
- Mechanical checks do not establish factual accuracy. Every finding in this review passed the full
  pre-existing suite: valid XML, stable checksums, exact generator correspondence, clean lint, 22 passing
  tests. Content correctness rests on the primary-source comparisons and the rendered and driven checks
  recorded above.

## Closure attestation

- [x] Every in-scope artifact was inventoried and read in full.
- [x] Every material claim was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Every visual was reviewed as its own artifact for independent correctness, detached self-sufficiency, generator provenance, and standalone defensibility, separately from the cross-format pass.
- [x] Applicable mechanical and rendered checks passed or their limitations are recorded.
- [x] Applicable durable content decisions were reconciled after the independent claim review, and every reversal or supersession is justified.
- [x] Residual exhaustion was completed after findings were assembled.
- [x] The baseline remained frozen, or changes and repeated passes are documented.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: the fresh review of `ade436e` is complete, and all eleven required findings plus five
optional items were remediated and re-verified in the authorized pass that followed. This attestation
covers the reviewed commit and the remediation of its findings; it is not a statement that content added
after this record remains correct. The single most instructive finding is F-1: three figures rendered as
unreadable black boxes for every light-theme reader, on the live site, while passing valid-XML, stable-checksum
and exact-generator-correspondence checks — because the previous review verified the figures by reading
their source and rendering them in one theme. F-2 through F-4 are the same shape in a different medium:
the demonstrations were verified by running them on their default inputs, which is the one case where a
demonstration that asserts its own success cannot be caught doing it.
