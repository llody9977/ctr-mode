# Review record: ctr-mode documentation, demonstrations, figures, and review scaffolding

> Lives at `reviews/LATEST_REVIEW.md` and is overwritten by each new review — this file always holds the
> most recent one. Earlier records are in git, not in this folder:
> `git log -p --follow reviews/LATEST_REVIEW.md` for the full series,
> `git show <commit>:reviews/LATEST_REVIEW.md` for one in full.
>
> The machine-readable pass state lives beside it in `reviews/REVIEW_STATE.json`, written by
> `scripts/review_passes.py --record`. That file is the router's input; this one is the human record.

## Status and baseline

- Status: Complete with findings — 9 findings raised and all remediated in an authorized pass; no open required findings
- Review date: 2026-08-24
- Reviewer: doc-review standard, applied to the frozen state below
- Model / effort this review: `claude-opus-5` / `high`
- Branch: `fix/figure-rendering-and-demo-verdicts`
- Commit reviewed: `a91904768a4c74447ff3f48a657d50c59e73dc52`, whose tree is byte-identical to
  `origin/main` at `e3b1e12` (PR #5 squash-merged that branch). The remediation below is committed
  on `review/dead-exports-and-figure-ci`, branched from `e3b1e12`.
- Worktree at review time: **Dirty** — every finding below was reached against the frozen state, then
  remediated in an authorized pass and committed. The scoped content fingerprint, not the commit id, is
  what identifies the reviewed content. Every changed file:

  | File | Status | Why it changed |
  | --- | --- | --- |
  | `docs/index.html` | M | RBG and MAC expanded at first substantive use (F-6, F-7) |
  | `docs/js/crypto.mjs` | M | Four unreferenced exports and the superseded AES-CBC framing removed (F-3) |
  | `docs/diagrams/generate_diagrams.py` | M | Docstring no longer states a figure count (F-1) |
  | `README.md` | M | `scripts/` and `test/` descriptions brought current (F-4) |
  | `.github/workflows/ci.yml` | M | New `figures` job guarding generator-to-artifact correspondence (F-8) |
  | `reviews/CONTENT_DECISIONS.yml` | M | CD-0012 and CD-0013 added |
  | `test/exports.test.mjs` | ?? | New guard: no module exports a symbol nothing references |
  | `reviews/CONTENT_DECISION_GUIDE.md` | M | Local fork reverted to the skill asset (F-5) |
  | `reviews/REVIEW_TEMPLATE.md` | M | Re-synced to the skill asset |
  | `scripts/capture_review_state.py`, `scripts/verify_content_decisions.py` | M | Merged with the skill assets (F-5) |
  | `scripts/review_passes.py` | ?? | Router, newly added to this project |
  | `reviews/REVIEW_STATE.json` | ?? | Written by `--record` at the end of this review |

- Review state ID: `8417e2ae1ced73ac01dee7e179d92a89eb96fde3bb2d8bcfbaed4f015d99d42c`
  (scoped content fingerprint `a53d9949085616052c50a277883dd4f01ab38bb4a7ed844cc089cd0877ef691e`, 45 files)
- State-capture command: `python3 scripts/capture_review_state.py`
- Pass-routing command: `python3 scripts/review_passes.py --model claude-opus-5 --effort high`
- Pass state recorded with: `--record` naming the ten passes that ran; `evidence-authority` was cached and
  deliberately not recorded, so its decay clock was not reset.
- Baseline changed during review: **Yes, twice, and deliberately.** The review opened on a clean
  `a919047` with all eleven passes cached. Remediation of F-1 and F-8 changed `code` and `metadata`
  inputs, reopening five passes; remediation of F-3 through F-7 changed `prose` and `register` inputs,
  reopening five more. Each reopening was re-routed and the reopened passes were run in full against the
  changed state rather than carried forward. The fingerprint above is the final state, captured after the
  last edit.

The remediation is committed on `review/dead-exports-and-figure-ci`, so `REVIEW_STATE.json`'s
fingerprints now describe committed content. Its `last_review.commit` field still reads `a919047`,
the state that was reviewed — it is written by `--record` at review time and is not rewritten on
commit.

### Prior review this one builds on

- Prior review date / model / effort: 2026-08-24 / `claude-opus-5` / `high`
- Prior commit: `a919047`
- Passes carried forward from it: `evidence-authority` (v1) only. The prior record in git history covers
  the fresh review at `ade436e` plus the remediation that landed as `a919047`.

## Scope inventory

| Artifact | Type | Direct dependents or generated counterpart | Inspected |
| --- | --- | --- | --- |
| `docs/index.html` | Documentation and UI shell | `styles.css`, `js/ui.mjs`, `diagrams/*.svg` | Yes — read in full |
| `docs/styles.css` | Stylesheet | `docs/index.html` | Yes — every selector traced to a use |
| `docs/js/crypto.mjs` | Cryptographic primitives | `attacks.mjs`, tests | Yes — read in full |
| `docs/js/attacks.mjs` | Attack vectors and defensive controls | `ui.mjs`, tests | Yes — read in full |
| `docs/js/ui.mjs` | UI wiring and verdict rendering | `docs/index.html` | Yes |
| `docs/js/html.mjs` | Escape-by-default HTML construction | `ui.mjs`, `test/html.test.mjs` | Yes — read in full |
| `docs/diagrams/generate_diagrams.py` | Diagram generator | the six committed `.svg` files | Yes — read and re-executed |
| `docs/diagrams/*.svg` (6) | Figures | `docs/index.html`, `README.md` | Yes — each rendered standalone, light and dark |
| `test/*.mjs` (4) | Test suites | `docs/js/*`, `docs/index.html` | Yes |
| `README.md` | Repository landing page | repository root | Yes — read in full |
| `package.json`, `eslint.config.mjs` | Metadata, static analysis | repository root | Yes |
| `DISCLAIMER.md`, `SECURITY.md`, `CONTRIBUTING.md` | Scope, reporting, contribution policy | repository root | Yes |
| `.github/workflows/*.yml`, `.pre-commit-config.yaml` | CI, deployment, secret gates | repository | Yes |
| `reviews/CONTENT_DECISIONS.yml` | Durable decision register | `scripts/verify_content_decisions.py` | Yes — all 13 records |

Out-of-scope boundaries and reason: general cryptography outside CTR / GCM / Encrypt-then-MAC behavior;
`node_modules/`. The MEGA (ePrint 2022/959) and Hongjun Wu (ePrint 2005/007) papers resolve but were not
re-read from source this pass; those two evidence rows rest on CD-0004 and CD-0005 and on the cached
`evidence-authority` verdict.

## Review passes

Copy the router's decision verbatim. A **cached** pass is carried forward on its own recorded
evidence — it was not verified by this review, and must never be described as if it were.

| id | Ver | Ran or cached | Reason (router's words) | Verdict | Evidence, or the run it rests on |
| --- | --- | --- | --- | --- | --- |
| `factual-correctness` | 1 | run | inputs changed since the recorded run | findings | Numeric claims re-derived: 2³²−1 blocks × 16 = 68,719,476,720 octets; 96-bit nonce at 2³² messages ≈ 2⁻³³ collision; seven GCM tag lengths; five SP 800-38A modes; 16+32-byte EtM payload floor. F-1 found in the generator docstring. |
| `evidence-authority` | 1 | **cached** | inputs, method, capability and freshness all unchanged | findings | Carried forward from the run on **2026-08-24 at `claude-opus-5`/`high`**. The URL set is byte-identical (27 unique URLs), so no citation was re-fetched for authority. Link *resolution* was re-checked mechanically — see below. |
| `adversarial-claims` | 1 | run | inputs changed since the recorded run | clean | Absolutes swept: 3 × "always" (deterministic block cipher — correct), 9 × "never", 1 × "guarantees". Attacker state distinguished per vector; KRACK row says "forced nonce reset, not counter exhaustion"; MEGA row says "malicious server" and "not Vector 1". Detection section states both tests are confirmatory only. |
| `terminology-taxonomy` | 1 | run | inputs changed since the recorded run | findings | AEAD, IND-CPA, KDF, GHASH, HMAC all expanded at first substantive use. F-6 (RBG) and F-7 (MAC) found. CD-0006 holds: the only "GMAC" occurrence is the SP 800-38D document title. |
| `cross-format` | 1 | run | inputs changed since the recorded run | findings | F-3 found — `crypto.mjs` carried the AES-CBC framing CD-0009 had removed from prose and figure. `package.json` confirmed on the CD-0008 framing. Every CSS class traced to a use; no dead selectors. |
| `visual-content` | 2 | run | inputs changed since the recorded run | clean | All six rendered standalone in light and dark, and in-page at 375px and 1280px. Ledger below. |
| `cross-page` | 1 | run | inputs changed since the recorded run | findings | F-4 found — README omitted `review_passes.py` and the new test suite. Title, description, lede, footer and README reconciled against the page. |
| `topic-completeness` | 1 | run | inputs changed since the recorded run | clean | Matrix below. No required gap; nothing was removed from the page by this remediation. |
| `argument-integrity` | 1 | run | inputs changed since the recorded run | clean | Thesis and four tests below. |
| `executable-demonstration` | 2 | run | inputs changed since the recorded run | clean | All five demonstrations driven in-browser with adversarial inputs, not defaults. Results below. |
| `decision-reconciliation` | 1 | run | inputs changed since the recorded run | findings | All 13 records dispositioned below. CD-0009 was found enforced in prose and figure but not in code, which is F-3; CD-0012 and CD-0013 added. |

Always-run tier — never cached, because it is cheap, deterministic, and model-independent:

| Check | Result | What it does not prove |
| --- | --- | --- |
| Mechanical, link, generator, and rendered-output validation | 33/33 tests pass; lint clean; 6/6 SVGs regenerate byte-identical; 25/25 external URLs 200; all workflow YAML parses; page renders with zero console errors in light and dark at 375px and 1280px | That a resolving link supports the claim beside it; behavior in engines other than the one tested |
| Guard regression — every guard from a previous finding still fires | 12 guards fault-injected individually, all fire; see the guard table | That guards exist for fault classes no review has found yet |
| Residual exhaustion — only when a pass produced a finding | Ran after F-1 (swept every numeric inventory claim in the repository), F-3 (swept every export of all three published modules, then every CSS selector), F-6/F-7 (swept every acronym on the page) | That the same reasoning exhausts fault classes it was not derived from |

### Method versions bumped by this review

Each bump reopens that pass for every project on the next review. Leave empty if none.

| id | Old → new | What the old method missed |
| --- | --- | --- |
| — | — | None. F-1 and F-3 were both discoverable under the existing `cross-format` v1 definition; they were missed by depth, not by method, and one finding of each class does not justify reopening the pass for every project. Recorded here so a recurrence is read as evidence the method, not the reviewer, needs changing. |

### Findings mechanized into guards

The durable output of a review. A finding that could have been mechanized and was not will be
rediscovered by hand every time — record why.

| Finding | Guard added (and where it runs) | Verified to fire on the original fault | If not mechanized, why |
| --- | --- | --- | --- |
| F-1 figure count drifted in the generator docstring | Fault class eliminated rather than guarded — the docstring states no count and points at `DIAGRAMS` | n/a — nothing left to drift | — |
| F-8 committed SVG can drift from its generator | `figures` job in `.github/workflows/ci.yml`: regenerate, then `git diff --exit-code -- 'docs/diagrams/*.svg'` | Yes — fired on a hand-edited SVG and on a generator edit left unregenerated; passes on a clean tree | — |
| F-3 dead export carrying a superseded framing | `test/exports.test.mjs` — every export of `crypto.mjs`, `attacks.mjs`, `html.mjs` must be referenced outside its declaration | Yes — re-adding `aesCbcEncrypt` fails the suite naming the symbol | — |
| F-2 human record not reconciled with `REVIEW_STATE.json` | Not mechanized | — | The check is "does the prose record describe the same state the JSON pins", which needs judgement about what the record *means*. A structural check would pass on a record that names the right commit and says nothing true about it. |
| F-5 project scaffolding forked from the skill assets | Not mechanized in this repository | — | The comparison is against files outside the repository (`~/.claude/skills/doc-review/assets/`), which CI cannot see. Belongs in the skill's own bootstrap step. |
| F-6, F-7 acronyms unexpanded at first use | Not mechanized | — | Requires knowing which acronyms need expansion for this audience; a blanket "every capitalised token must be expanded" rule would fire on AES, CTR, GCM, XOR and NIST throughout. |

## Material-claim ledger

| ID | Artifact and location | Material claim | Classification | Primary source or verification | Repetitions checked | Result |
| --- | --- | --- | --- | --- | --- | --- |
| C-001 | `index.html` lede, README, `package.json` | CTR is one of five NIST-approved confidentiality modes and is not deprecated | Normative standard | SP 800-38A — ECB, CBC, CFB, OFB, CTR; ECB alone carries a "should not be used" | lede, §"What CTR guarantees", README, `modes-ctr-etm-gcm.svg` | Confirmed |
| C-002 | `index.html` §"What CTR guarantees" | SP 800-38A Appendix D conditions CTR malleability on integrity not being protected | Normative standard | Direct quote verified verbatim; see CD-0008 | prose, README, figure alt text | Confirmed |
| C-003 | `index.html` §"The recommended AEAD" | GCM's confidentiality is a variation of Counter mode | Normative standard | SP 800-38D §1, quoted | lede, §3, `modes-ctr-etm-gcm.svg`, callout | Confirmed |
| C-004 | `index.html` §"Nonce uniqueness" | SP 800-38D §8 bounds repeat-IV probability at 2⁻³²; §8.3 caps encryptions at 2³² for the RBG-based construction | Normative standard, scoped | See CD-0003; scoping re-verified and the construction named explicitly (F-7 fix) | prose only | Confirmed |
| C-005 | `index.html` §"Tag length" | Exactly seven permitted tag lengths; *t* is fixed per key | Normative standard | SP 800-38D §5.2.1.2, quoted | prose only | Confirmed — 128/120/112/104/96 + 64/32 = 7 |
| C-006 | `index.html` §"Counter exhaustion", `vector4-counter-reuse.svg` | RFC 3686 §4 gives a 32-bit block counter, capping a packet at 2³²−1 blocks = 68,719,476,720 octets | Normative standard | Arithmetic re-derived: 4,294,967,295 × 16 = 68,719,476,720 | prose ×2, figure body, figure alt text | Confirmed |
| C-007 | `index.html` Option B | Encrypt-then-MAC "is secure from all points of view", conditional on IND-CPA encryption and a strongly unforgeable MAC | Published research, conditional | Bellare & Namprempre ePrint 2000/025; conditionality stated explicitly on the page | prose, README, `modes-ctr-etm-gcm.svg` | Confirmed |
| C-008 | `index.html` Option B sample | 96-bit nonce keeps random-nonce collision below 2⁻³² out to ~2³² messages | Author's working figure | Birthday bound re-derived: 2⁶⁴/2⁹⁷ ≈ 2⁻³³ | code comment only | Confirmed |
| C-009 | `index.html` §"Three quieter failures" | Truncation and splicing are closed by a tag over the whole ciphertext; replay is not | Author's synthesis + normative | SP 800-38D Appendix D quoted for replay; Option B rule 3 carries truncation | prose, Option B rules, sample tests | Confirmed |
| C-010 | `crypto.mjs`, Option B sample | EtM payload floor is 16-byte counter + 32-byte HMAC-SHA256 tag | Implementation | Both the module and the published sample reject a short payload; test asserts it | `crypto.mjs`, sample, `samples.test.mjs` | Confirmed |
| C-011 | `generate_diagrams.py` docstring | The figure set is defined by `DIAGRAMS` | Implementation | `len(DIAGRAMS)` = 6, and 6 `<img>` elements load in the page | docstring, `DIAGRAMS`, page | **Was F-1** — docstring said "four"; now states no count |
| C-012 | Evidence table, 4 rows | KRACK has CVE-2017-13077; the other three have no CVE assigned | Sourcing policy | CD-0004; NVD link 200 | table only | Confirmed |
| C-013 | Vector 4 demo and figure | A 2-bit counter over 8 blocks yields 4 duplicate keystream blocks | Demonstration output | Driven in-browser: 2-bit → 8 blocks / 4 duplicates; 3-bit → 16 blocks / 8 duplicates | figure body, demo verdict, `attacks.test.mjs` | Confirmed — figure and demo agree |

## Topic completeness matrix

| Topic | Definition | Boundaries | Actors/components | Mechanism/sequence | Assumptions/dependencies | Threats/failures | Limits/residual risk | Selection/use | Operations/evidence | Recovery/lifecycle | Interoperability/migration | Unsafe alternatives | Visual representation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AES-CTR mode | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered |
| The four attack vectors | covered | covered | covered | covered | covered | covered | covered | n/a — not options to select between | covered | n/a — attacks, not deployed components | n/a | covered | covered |
| Option A — AEAD | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered |
| Option B — Encrypt-then-MAC | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered |
| Operating limits | covered | covered | covered | covered | covered | covered | covered | covered | covered | covered | n/a — no format defined here | covered | optional extension |

No required gap. The one optional extension is a figure for the nonce/counter split trade-off; the prose
and the RFC 3686 numbers carry it without one, so adding a figure would meet a quota rather than clarify.

## Argument integrity

**Central claim, in one sentence (extracted from title, lede, and summary):** AES-CTR is a NIST-approved
confidentiality mode that makes no integrity guarantee, so the correct response is to authenticate the
ciphertext — with an AEAD or with Encrypt-then-MAC — rather than to stop using CTR.

| Test | Result | Evidence or finding |
| --- | --- | --- |
| Thesis support | Passes | The claim is "CTR does not by itself provide integrity", not "CTR is unsafe", and each half is separately sourced: SP 800-38A for approval and for Appendix D's conditional malleability, SP 800-38D §1 for GCM being counter mode plus a tag. The page explicitly contrasts SP 800-38A's ECB "should not be used" with the absence of any equivalent statement about CTR — that is what keeps standards silence from being read as prohibition. |
| Comparison-set validity | Passes | Three rows — CTR alone, CTR+HMAC, GCM — all selectable for "how do I authenticate counter-mode encryption", on the single axis "where does the tag come from". CD-0009 holds. Reinforced this review: the dead `aesCbcEncrypt` that still justified the removed CBC comparison is gone (F-3, CD-0012). |
| Demonstration sufficiency | Passes | The defensive demo runs the identical forgery — same profile, same target field, same XOR delta, same byte offset — against all three options, so only authentication varies. Verified in-browser: CTR returned `role=root`, EtM and GCM both rejected before returning plaintext. |
| Dangling claims | Passes | Truncation, splicing and replay each get a developed paragraph, and replay is explicitly marked as surviving authentication. IND-CPA, AEAD, KDF, GHASH developed at first use; RBG and MAC were the two exceptions and are now expanded (F-6, F-7). |
| Structure serves the decision | Passes | Mechanism → what the standard does and does not promise → failures → detection → fixes → operating limits. Fixes precede operating limits, which is the order a reader acts in. |

## Cross-format and cross-page ledger

| Concept or claim | Representations compared | Result |
| --- | --- | --- |
| CTR framed as needing composition, not avoidance (CD-0008) | `index.html` lede + callout, README, `package.json` description, `modes-ctr-etm-gcm.svg`, footer | Consistent |
| Three root causes, four vectors (CD-0001) | `index.html` §heading + list, `taxonomy.svg` body and alt text, `attacks.mjs` header comment, README figure alt text | Consistent |
| Three selectable options on one axis (CD-0009) | `index.html` comparison + defensive demo, `modes-ctr-etm-gcm.svg`, `crypto.mjs` exports | **Was F-3** — `crypto.mjs` still shipped an AES-CBC helper "for comparison with chaining mode"; removed |
| RFC 3686 counter cap | prose ×2, `vector4-counter-reuse.svg` body, that figure's alt text | Consistent — same figures in all four |
| 2-bit counter → 4 duplicates | `vector4-counter-reuse.svg`, live demo verdict, `attacks.test.mjs` | Consistent |
| Repository structure | README `docs/`, `docs/js/`, `test/`, `reviews/`, `scripts/` bullets vs actual tree | **Was F-4** — `scripts/` omitted `review_passes.py`, `test/` omitted the new guard; both corrected |
| Escape-by-default | `html.mjs`, every `innerHTML` sink in `ui.mjs`, two eslint rules, `html.test.mjs` | Consistent — all sinks use `html`` ` or `raw()` on self-built markup |

## Visual content ledger

| Visual | Claims it asserts | Independently correct? | Self-sufficient when detached? | Caption and alt text verified | Generator and correspondence check | Standalone defensibility | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `modes-ctr-etm-gcm.svg` | Three options, one axis; CTR = confidentiality only; EtM = you compose it; GCM = built in | Yes | Yes — carries its own scope line naming SP 800-38D §8 and Bellare & Namprempre | Yes — alt text states all three outcomes at prose strength | Re-executed; byte-identical | Comparative, not an attack | Pass |
| `taxonomy.svg` | 3 root causes → 4 vectors; solid = primary, dashed = contributing | Yes — legend present and matches the edges | Yes — legend and scope line inside the figure | Yes | Re-executed; byte-identical | Names the demos as local/in-browser | Pass |
| `vector1-bit-flipping.svg` | C = P⊕S; injecting Δ injects Δ into P′; 4 bytes changed, rest valid | Yes | Yes — scope line names `ProfileService` as a local in-memory simulation | Yes | Re-executed; byte-identical | Yes — local target named in-figure | Pass |
| `vector2-two-time-pad.svg` | C₁⊕C₂ = P₁⊕P₂; two recovery paths, no AES key needed | Yes | Yes — scope line names `attacks.mjs` and the test suite | Yes | Re-executed; byte-identical | Yes | Pass |
| `vector3-edit-oracle.svg` | 3 steps; attacker supplies zero *plaintext*; reply is S; C⊕S = P | Yes — the plaintext/ciphertext distinction is correct and load-bearing | Yes — scope line names `DocumentEditorService` | Yes — alt text carries the same distinction | Re-executed; byte-identical | Yes | Pass |
| `vector4-counter-reuse.svg` | 2-bit field, 4 states, blocks 5–8 repeat 1–4; RFC 3686 32-bit counter caps a packet at 2³²−1 blocks | Yes — matches the demo and the test exactly | Yes — states that the demo wraps a tiny counter in software rather than overflowing AES | Yes — alt text carries the RFC 3686 qualifier | Re-executed; byte-identical | Yes | Pass |

All six were rendered standalone in **light and dark**, and in-page at **375px and 1280px** (the v2
method). Zero theme sentinels reach any output. At 375px each figure scrolls inside its own container at
0.756 scale while the page itself does not scroll horizontally.

### Representation opportunities

| Location | What is dense | Proposed form | Required gap or optional extension |
| --- | --- | --- | --- |
| §"Counter exhaustion and rekeying" | The nonce/counter width trade-off and the four-step rekeying discipline | A width-split diagram | Optional extension — the prose plus RFC 3686's concrete numbers is already followable; declined |

## Applicable durable content decisions

| Decision ID | Affected concept | Disposition | Current evidence and rationale |
| --- | --- | --- | --- |
| CD-0001 | Three root causes, four vectors | Reaffirmed | Intact in prose, `taxonomy.svg`, and the `attacks.mjs` header. |
| CD-0002 | "Only approved mitigations" framing | Unchanged — remains superseded by CD-0008 | Preserved as history, not rewritten. |
| CD-0003 | GCM nonce uniqueness and the 2³² ceiling | Reaffirmed and strengthened | Coverage intact. F-7's RBG expansion makes the §8.2.2 scoping legible without decoding an acronym. |
| CD-0004 | Evidence-table citation policy | Reaffirmed | Four rows unchanged; NVD link 200; three rows still correctly say "no CVE assigned". |
| CD-0005 | MEGA as a boundary case under root cause 3 | Reaffirmed | Row still states AES-CCM chunk authentication, AES-ECB key wrapping, and the malicious-server model. |
| CD-0006 | GHASH vs GMAC | Reaffirmed | The only "GMAC" on the page is inside the SP 800-38D document title. |
| CD-0007 | Never render a compromise outcome in the safe color | Reaffirmed | Vectors 1–4 verdicts render `bad`; only the defensive comparison renders `good`, and it renders `good` because both defenses actually rejected the forgery. |
| CD-0008 | CTR framed as needing composition, not avoidance | Reaffirmed | `package.json`, README, lede, callout and footer all carry it. |
| CD-0009 | Compare only selectable options | **Reopened, upheld, and extended** | Upheld in prose and figure, but the review found it had never been applied to the code: `crypto.mjs` still exported `aesCbcEncrypt` under "for comparison with chaining mode". The decision was not reversed — it was enforced where it had not been. Recorded as CD-0012. |
| CD-0010 | Figure legibility as rendered | Reaffirmed | Zero sentinels; all six rendered in both themes at both widths; figures scroll rather than shrink. |
| CD-0011 | Verdicts derived from observed results | Reaffirmed | All five demonstrations re-driven with adversarial inputs; every verdict matched what the run produced. |
| CD-0012 | No unreferenced exports in a published module | **New** | Four dead exports removed; `test/exports.test.mjs` holds the line and was proven to fire. |
| CD-0013 | No inventory counts in prose nothing regenerates | **New** | Generator docstring states no count; CI `figures` job holds generator-to-artifact correspondence. |

## Mechanical and rendered checks

| Check | Scope | Result | What this does not prove |
| --- | --- | --- | --- |
| `npm test` | whole repository | 33/33 pass (32 before, +1 new guard) | Nothing about claims the tests do not assert — F-1 and F-3 both passed the pre-existing suite |
| `npm run lint` | `docs/js/`, `test/` | Clean | Nothing about correctness; it cannot see unused *exports*, which is why F-3 needed a test |
| `python3 docs/diagrams/generate_diagrams.py` | six SVGs | All six regenerate byte-identical to the committed files | That a figure renders legibly — that is the `visual-content` pass |
| CI `figures` job (new) | `docs/diagrams/*.svg` | Passes clean; fires on a hand-edited SVG and on an unregenerated generator edit | Anything about figure content, only correspondence |
| Generator guards | `_paint`, `guard_sentinels`, `box`, `alabel` | 6 probes, all raise; valid input passes | That other classes of layout fault are caught |
| eslint `innerHTML` rules | `docs/js/` | Both fire on the exact fault; pass on tagged markup | That every markup path is covered — `verdict()` takes markup as a parameter, so the rule cannot see its call sites; all five were read instead |
| `test/exports.test.mjs` (new) | `crypto.mjs`, `attacks.mjs`, `html.mjs` | Passes; fires on re-adding `aesCbcEncrypt` | That a *referenced* export is correct or needed |
| Link check | 27 unique URLs, 25 checkable | All 200 (localhost and the SVG namespace skipped) | That a resolving link supports the claim beside it |
| Internal references | in-page anchors, local assets, README figure link | All resolve; 6/6 figures load with alt text and captions | — |
| CSS integrity | `styles.css`, all six SVGs | Every class defined is used; every class used is defined; no rule dead across all figures | — |
| Rendered validation | page + six SVGs standalone, light and dark, 375px and 1280px | Zero console errors; no page-level horizontal scroll at either width | Behavior in engines other than the one tested |
| Demonstration drive-through | all five demos, adversarial inputs | `user@example.com` forges the role with the email intact; 3-bit and 2-bit both collide and report real counts; V2 flags edited inputs and recovers the plaintext actually encrypted; V3 re-encrypts on document change; the defensive demo shows CTR accepting and both defenses rejecting | That every possible input is covered |
| `verify_content_decisions.py` | register | 13 decisions validated | Structure and references only, not technical correctness |
| Scaffolding sync | 3 scripts + 2 `reviews/` docs vs skill assets | All five identical | That the assets themselves are correct |

## Open required findings

**None.** All nine findings below were raised against the frozen state and remediated in an authorized
pass, then re-verified against the new state after re-routing.

| # | Finding | Classification | Resolution | Verified by |
| --- | --- | --- | --- | --- |
| F-1 | `generate_diagrams.py:1` docstring said it generates "four" diagrams; `DIAGRAMS` has six, all embedded | Required — factual, in-scope code | Docstring states no count and points at `DIAGRAMS`; the fault class is eliminated rather than guarded | Repository-wide sweep of every numeric inventory claim; no other count had drifted |
| F-2 | `LATEST_REVIEW.md` did not correspond to `REVIEW_STATE.json`: it pinned `ade436e`, deferred the post-remediation fingerprint with "re-capture after committing" (never done), and carried no pass-state table | Required — audit trail | This record replaces it: pass-state table with router reasons, full dirty-worktree file list, and the scoped fingerprint as the real state identifier | Cross-checked row by row against `REVIEW_STATE.json` |
| F-3 | `crypto.mjs` exported four unreferenced symbols; `aesCbcEncrypt` sat under "AES-CBC (for comparison with chaining mode)", the comparison CD-0009 had removed from the page | Required — cross-format, decision consistency | All four removed with the AES-CBC docstring mention; `test/exports.test.mjs` added | Reference counts across page, JS and tests before removal; guard proven to fire; 33/33 pass |
| F-4 | README `scripts/` bullet omitted `review_passes.py`; `test/` bullet omitted the new suite | Required — cross-page | Both bullets rewritten | Read against the actual tree |
| F-5 | `CONTENT_DECISION_GUIDE.md` was a local fork of a file the skill forbids editing locally; two scripts had drifted from the skill assets in both directions | Required — process integrity | Guide reverted to the asset. The scripts' project copies were functional supersets (YAML register parsing, initial-commit fallback), so those improvements were merged **into the skill assets** and both copies made identical | `diff` clean on all five files; both scripts re-run successfully |
| F-6 | "RBG-based construction" never expanded, yet it scopes which of SP 800-38D's two IV constructions the 2³² cap applies to | Required — terminology | Expanded to "random bit generator (RBG)-based construction" | Verified in the rendered DOM |
| F-7 | "MAC" used ~10 times in the body, expanded only inside the FIPS 198-1 title in the closing reference list | Required — terminology | Expanded at first substantive use | Verified in the rendered DOM |
| F-8 | Nothing prevented a committed SVG drifting from its generator between reviews | Required — verification economics | CI `figures` job regenerates and fails on any diff | Fault-injected in both directions |
| F-9 | The register's JSON-only parser in the skill asset would fail outright on this project's YAML register; the skill claimed the register "is JSON-compatible YAML" | Required — tooling correctness | Merged loader prefers PyYAML, falls back to json, and reports the two failure modes separately; the skill's claim and its dependency-free assertion corrected | Confirmed this register is genuine YAML and unparseable by json; both paths exercised |

## Optional coverage

One representation opportunity was assessed and declined (see the visual ledger). Nothing else outstanding.

## Limitations and uncertainty

- **`evidence-authority` was not re-derived.** It is carried forward from the 2026-08-24
  `claude-opus-5`/`high` run because the cited URL set is byte-identical. Link *resolution* was
  re-checked mechanically this review (25/25 → 200), but whether each source still supports the claim
  beside it rests on that earlier run, inside its 90-day horizon.
- The MEGA and Hongjun Wu papers resolve but were not re-read from source; those two evidence rows rest
  on CD-0004 and CD-0005.
- Rendered checks ran in one Chromium-based engine at 375px and 1280px in both themes. Other engines
  were not exercised.
- `REVIEW_STATE.json` records `a919047` as the reviewed commit. That is the state the passes ran
  against; the remediation then landed as a separate commit on `review/dead-exports-and-figure-ci`. The
  next review will re-route from current file contents regardless, so the two cannot silently diverge.
- The `verdict` field in `REVIEW_STATE.json` records what a run *found*, not what remains open; the
  router never reads it. This was ambiguous and is now documented in the skill and in the `--record`
  help. Anything deliberately left unfixed must be carried as a `rejected` record in the register.

## Closure attestation

- [x] Every pass is either run-and-clean or validly cached, and every cached one names the run it rests on.
- [x] The router's RUN/CACHED split was followed, not overridden by judgement or by how the request was phrased.
- [x] Every in-scope artifact covered by a running pass was inventoried and read in full.
- [x] Every material claim was entered in the ledger and dispositioned.
- [x] Every topic received a completeness classification for every category.
- [x] Every mandatory pass was completed separately, or is validly cached.
- [x] Current primary sources were used for standards-sensitive and time-sensitive claims, or their pass is inside its decay horizon.
- [x] Prose, metadata, diagrams, captions, alt text, examples, summaries, navigation, and generators were reconciled.
- [x] Every visual was reviewed as its own artifact for independent correctness, detached self-sufficiency, generator provenance, and standalone defensibility, separately from the cross-format pass.
- [x] Applicable mechanical and rendered checks passed or their limitations are recorded.
- [x] Applicable durable content decisions were reconciled after the independent claim review, and every reversal or supersession is justified.
- [x] The argument-integrity pass was completed and the one-sentence thesis recorded.
- [x] Residual exhaustion was completed after findings were assembled.
- [x] Every guard from a previous finding was executed and still fires.
- [x] Each remediated finding gained a guard, or the reason it could not be mechanized is recorded.
- [x] The pass state was written with `review_passes.py --record`, naming only passes that actually ran.
- [x] The baseline remained frozen, or changes and repeated passes are documented.
- [x] Required findings, optional coverage, and limitations are separated.

Closure conclusion: **Closed with no open required findings, against the content fingerprinted
`a53d9949…ef691e`, reviewed on `a919047` and committed on `review/dead-exports-and-figure-ci`.** Ten passes were run and clean or remediated-and-clean at
`claude-opus-5`/`high` on 2026-08-24; `evidence-authority` is carried forward from the earlier run the
same day at the same capability, within its 90-day horizon. This closure describes that content state
only.
