"""Generate the hand-authored diagrams embedded in docs/index.html.

The set is defined by `DIAGRAMS` at the bottom of this file — deliberately not
restated as a count here, because a hardcoded number silently goes stale the
next time a figure is added or removed.

The SVGs use the same light editorial palette as the Secret Exposure site so the
figures remain visually consistent when embedded in the article or detached into
another document. Semantic colors still distinguish danger, safety, and emphasis.

Run: `python3 docs/diagrams/generate_diagrams.py` (writes the .svg files beside it).
"""
import pathlib
import re

OUT = pathlib.Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)

SANS = "Arial, Helvetica, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

# Sentinels routed to the shared editorial palette.
INK, MUTED, NEU_F, NEU_S = "@ink", "@muted", "@neuf", "@neus"
ARROW = "@arw"

# Fixed semantic colors for danger, safety, and emphasis.
NAVY = "#006da0"
RED, GREEN, PURPLE, AMBER, GRAY, BLUE = "#b42318", "#087c83", "#6d28d9", "#9a5b00", "#64748b", "#006da0"

STYLE = (
    '<style>'
    ':root{--card:#ffffff;--panel:#f0f8fb;--border:#d3e4eb;--ink:#142f40;--muted:#486371;'
    '--neuf:#f0f8fb;--neus:#b9d3de;--arw:#7f9aa6}'
    '.cardb{fill:var(--card);stroke:var(--border)}.card{fill:var(--card)}'
    '.panel{fill:var(--panel);stroke:var(--border)}'
    '.fneu{fill:var(--neuf)}.sneu{stroke:var(--neus)}'
    '.ink{fill:var(--ink)}.muted{fill:var(--muted)}'
    '.arw{stroke:var(--arw)}.arwhead{fill:var(--arw)}'
    '</style>'
)

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# A theme sentinel resolves to a CSS class, never to a literal attribute value.
# The distinction matters because `fill="@neuf"` is not a valid SVG paint: browsers
# discard the invalid value and fall back to the initial one, black. That failure
# can look deliberate in isolation while making the article figure unreadable.
# Per-property classes, rather than one combined class, so a neutral fill composes
# with a semantic stroke — the exact case that previously fell through to a literal.
FILL_CLASS = {INK: "ink", MUTED: "muted", NEU_F: "fneu"}
STROKE_CLASS = {NEU_S: "sneu", ARROW: "arw"}

def _paint(fill=None, stroke=None, extra_classes=()):
    """Build the paint attributes for a shape, mapping sentinels to CSS classes.

    Raises on an unmapped sentinel rather than emitting it, so a new theme colour
    cannot silently reach the output as an invalid attribute value.
    """
    classes, attrs = list(extra_classes), []
    for value, table, prop in ((fill, FILL_CLASS, "fill"), (stroke, STROKE_CLASS, "stroke")):
        if value is None:
            continue
        if value in table:
            classes.append(table[value])
        elif str(value).startswith("@"):
            raise ValueError(f"unmapped theme sentinel {value!r} used as {prop}")
        else:
            attrs.append(f'{prop}="{value}"')
    if classes:
        attrs.insert(0, f'class="{" ".join(classes)}"')
    return " ".join(attrs)

def _fillattr(color):
    return _paint(fill=color)

def guard_sentinels(name, markup):
    """Fail generation if any theme sentinel survived into the output.

    The layout guards in box() and alabel() catch geometry the eye would catch;
    this catches a colour fault that renders as plausible in one theme only, which
    no XML, link, or checksum check can see.
    """
    leaked = sorted(set(re.findall(r'"(@[a-z]+)"', markup)))
    if leaked:
        raise ValueError(f"{name}: theme sentinels reached the output as literal values: {leaked}")
    return markup

def text(x, y, s, size=13, fill=INK, anchor="middle", weight="400", mono=False, lh=15):
    font = MONO if mono else SANS
    lines = s.split("\n")
    parts = [f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" {_fillattr(fill)} '
             f'text-anchor="{anchor}" font-weight="{weight}">']
    for i, ln in enumerate(lines):
        parts.append(f'<tspan x="{x}" dy="{0 if i == 0 else lh}">{esc(ln)}</tspan>')
    parts.append('</text>')
    return "".join(parts)

def box(x, y, w, h, label, fill=NEU_F, stroke=NEU_S, tc=INK, mono=False, rx=9, size=13, weight="600", lh=15, sw=1.5):
    lines = label.split("\n")
    n = len(lines)
    # A rect does not clip its text: an over-long line or an extra line silently
    # renders outside the box and over whatever sits next to it, which no XML or
    # link check can see. Fail generation instead of shipping an unreadable figure.
    # The mono face runs wider per character than the sans face, so measure with
    # the right ratio — otherwise the guard under-protects exactly the mono boxes
    # most likely to overflow.
    widest = max((len(ln) for ln in lines), default=0) * size * (0.6 if mono else 0.5)
    if widest > w - 4:
        raise ValueError(f"box text {label.splitlines()[0]!r} needs ~{widest:.0f}px, box is {w}px")
    if n * lh > h:
        raise ValueError(f"box text {label.splitlines()[0]!r} needs {n} lines ({n * lh}px), box is {h}px")
    cx, cy = x + w / 2, y + h / 2
    first = cy - (n - 1) * lh / 2 + size / 3
    rect = (f'<rect {_paint(fill, stroke)} x="{x}" y="{y}" width="{w}" height="{h}" '
            f'rx="{rx}" stroke-width="{sw}"/>')
    return rect + text(cx, first, label, size=size, fill=tc, mono=mono, weight=weight, lh=lh)

def arrow(x1, y1, x2, y2, dashed=False, color=ARROW, sw=2):
    da = ' stroke-dasharray="6 5"' if dashed else ''
    st = 'class="arw"' if color == ARROW else f'stroke="{color}"'
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {st} stroke-width="{sw}"{da} marker-end="url(#arw)"/>'

def path(d, dashed=False, color=ARROW, sw=2):
    da = ' stroke-dasharray="6 5"' if dashed else ''
    st = 'class="arw"' if color == ARROW else f'stroke="{color}"'
    return f'<path d="{d}" fill="none" {st} stroke-width="{sw}"{da} marker-end="url(#arw)"/>'

def alabel(x, y, s, size=11, fill=MUTED, max_width=None):
    """Connector label on an opaque card.

    `max_width` is the gap the label has to live in. Without it a long string
    silently renders wider than the space between its neighbours and is then
    overpainted by whatever is drawn next, which is invisible to every
    structural check — so shrink the type until it actually fits.
    """
    def width(sz):
        return len(s) * sz * 0.56 + 10
    w = width(size)
    if max_width is not None:
        while w > max_width and size > 8:
            size -= 0.5
            w = width(size)
        if w > max_width:
            raise ValueError(f"alabel {s!r} needs {w:.1f}px but only {max_width}px is free")
    return (f'<rect class="card" x="{x - w / 2}" y="{y - size + 2}" width="{w}" height="{size + 6}" rx="4" opacity="0.95"/>'
            + text(x, y + 3, s, size=size, fill=fill, weight="500"))

def svg(w, h, title, body, subtitle=None):
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="{SANS}">'
            + STYLE
            + '<defs><marker id="arw" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">'
            + '<path d="M0,0 L8,3 L0,6 z" class="arwhead"/></marker></defs>'
            + f'<rect class="cardb" x="1" y="1" width="{w - 2}" height="{h - 2}" rx="14" stroke-width="2"/>'
            + text(w / 2, 32, title, size=17, fill=INK, weight="700"))
    if subtitle:
        head += text(w / 2, 52, subtitle, size=12, fill=MUTED)
    return guard_sentinels(title, head + body + '</svg>')

W = 900

def panel(x, y, w, h):
    return f'<rect class="panel" x="{x}" y="{y}" width="{w}" height="{h}" rx="10" stroke-width="1.5"/>'

# ---------------- Diagram 1: CTR alone vs CTR+HMAC vs GCM ----------------
def d1():
    b = []
    b.append(text(W / 2, 80, "The reader's three options, on one axis: where does the authentication tag come from?", size=13, fill=MUTED))

    def moderow(y0, name, mechanism, security_prop, tagcolor, tagtext):
        o = [panel(24, y0, W - 48, 100)]
        o.append(f'<rect x="44" y="{y0 + 16}" width="180" height="28" rx="14" fill="{NAVY}"/>')
        o.append(text(44 + 90, y0 + 34, name, size=12.5, fill="#fff", weight="700"))
        o.append(text(44, y0 + 64, mechanism, size=11.5, fill=MUTED, anchor="start", lh=15))
        ow, oh = 220, 52
        ox = W - 48 - ow - 20
        o.append(box(ox, y0 + 16, ow, oh, security_prop, fill=NEU_F, stroke=tagcolor, tc=INK, size=11.5, lh=14))
        o.append(text(ox + ow / 2, y0 + 84, tagtext, size=11, fill=tagcolor, weight="700"))
        return "".join(o)

    b.append(moderow(
        100, "AES-CTR alone",
        "Encrypts (Nonce ‖ counter) to produce keystream S.\nCiphertext is C = P ⊕ S. No padding needed.\nNothing authenticates C, so tampering decrypts cleanly.",
        # "C ⊕ Δ = P ⊕ Δ" would be false: the left side is a ciphertext value and
        # the right a plaintext one, and they differ by the keystream. The relation
        # holds under decryption, so say so — as taxonomy.svg already does.
        "Malleable: C[i] ⊕ Δ decrypts to\nP[i] ⊕ Δ — no error spread\nReused nonce ⇒ C₁ ⊕ C₂ = P₁ ⊕ P₂",
        RED, "⚠ Confidentiality only — needs a MAC"
    ))
    b.append(moderow(
        212, "AES-CTR + HMAC",
        "The same keystream encryption, then HMAC-SHA256 over\n(counter ‖ ciphertext) under a second, independent key.\nVerify the tag first; decrypt only if it passes.",
        "Tamper and truncation rejected\nbefore any plaintext is returned",
        GREEN, "✔ Authenticated — you compose it"
    ))
    b.append(moderow(
        324, "AES-GCM",
        "The same counter-mode keystream, plus a GHASH tag over\nciphertext and associated data, as a single primitive.\nSecurity holds only while nonces never repeat.",
        "1-bit tamper rejects ciphertext\nbefore decryption completes",
        GREEN, "✔ Authenticated — built in"
    ))
    b.append(text(W / 2, 440, "Scope: educational comparison of counter-mode options. GCM nonce limits per NIST SP 800-38D §8; Encrypt-then-MAC ordering per Bellare & Namprempre.",
                  size=10.5, fill=MUTED))
    return svg(W, 456, "AES-CTR, AES-CTR + HMAC, and AES-GCM", "".join(b),
               subtitle="all three encrypt with the same counter-mode keystream — only the authentication differs")

# ---------------- Diagram 2: Taxonomy of Root Causes & Vectors ----------------
def d2():
    b = [box(W / 2 - 80, 62, 160, 44, "AES-CTR Mode", fill=NAVY, stroke="#0d1b2a", tc="#fff", size=15, weight="700")]
    r1 = (40, 146, 260, 68)
    r2 = (320, 146, 260, 68)
    r3 = (600, 146, 260, 68)

    b.append(box(*r1, "Root cause 1 — Malleability\nBitwise XOR has zero error spread:\nC ⊕ Δ decrypts to P ⊕ Δ",
                 fill=NAVY, stroke="#0d1b2a", tc="#fff", size=11.5, lh=14))
    b.append(box(*r2, "Root cause 2 — Determinism\nSame (Key, Nonce) yields same S:\nC₁ ⊕ C₂ = P₁ ⊕ P₂ (Two-Time Pad)",
                 fill=NAVY, stroke="#0d1b2a", tc="#fff", size=11.5, lh=14))
    b.append(box(*r3, "Root cause 3 — No Integrity\nNo cryptographic MAC or tag;\nmodifications go undetected",
                 fill=NAVY, stroke="#0d1b2a", tc="#fff", size=11.5, lh=14))

    b.append(arrow(W / 2, 106, r1[0] + r1[2] / 2, r1[1] - 2))
    b.append(arrow(W / 2, 106, r2[0] + r2[2] / 2, r2[1] - 2))
    b.append(arrow(W / 2, 106, r3[0] + r3[2] / 2, r3[1] - 2))

    vy, vh = 274, 68
    vs = [
        (30, 195, "Vector 1", "Precision Bit-Flipping", "active malleability", RED),
        (245, 195, "Vector 2", "Keystream Reuse & Crib-Dragging", "two-time pad", BLUE),
        (460, 200, "Vector 3", "Random-Access Edit Oracle", "chosen-ciphertext", PURPLE),
        (680, 190, "Vector 4", "Counter Rollover / Wrapping", "keystream collision", AMBER),
    ]
    for x, w, vt, desc, mode, ac in vs:
        b.append(f'<rect {_paint(NEU_F, NEU_S)} x="{x}" y="{vy}" width="{w}" height="{vh}" rx="9" stroke-width="1.5"/>')
        b.append(f'<rect x="{x}" y="{vy}" width="6" height="{vh}" rx="3" fill="{ac}"/>')
        cx = x + w / 2
        b.append(text(cx, vy + 22, vt, size=13, fill=INK, weight="700"))
        b.append(text(cx, vy + 40, desc, size=11, fill=INK))
        b.append(text(cx, vy + 56, mode, size=10.5, fill=MUTED, weight="500"))

    r1c = r1[0] + r1[2] / 2
    r2c = r2[0] + r2[2] / 2
    r3c = r3[0] + r3[2] / 2

    # Vector 1 connects to R1 (solid, primary) and R3 (dashed, contributing)
    b.append(arrow(r1c, r1[1] + r1[3], vs[0][0] + vs[0][1] / 2, vy - 2))
    b.append(path(f"M {r3c} {r3[1] + r3[3]} C {r3c} {r3[1] + r3[3] + 25}, {vs[0][0] + vs[0][1] / 2 + 50} {vy - 25}, {vs[0][0] + vs[0][1] / 2 + 20} {vy - 2}", dashed=True))

    # Vector 2 connects to R2
    b.append(arrow(r2c, r2[1] + r2[3], vs[1][0] + vs[1][1] / 2, vy - 2))

    # Vector 3 connects to R2 (the edit oracle re-encrypts under the same counter)
    b.append(arrow(r2c, r2[1] + r2[3], vs[2][0] + vs[2][1] / 2, vy - 2))

    # Vector 4 connects to R2
    b.append(arrow(r2c, r2[1] + r2[3], vs[3][0] + vs[3][1] / 2, vy - 2))

    b.append(text(W / 2, 366, "Solid arrow = primary root cause   ·   Dashed arrow = contributing root cause",
                  size=10.5, fill=MUTED, weight="500"))
    b.append(text(W / 2, 386, "Scope: educational analysis of CTR mode failure modes; demonstrations run in the browser against self-contained simulations.",
                  size=10.5, fill=MUTED))
    return svg(W, 402, "Three Root Causes and Four Attack Vectors", "".join(b),
               subtitle="every CTR mode vulnerability traces back to malleability, keystream determinism, or missing authentication")

# ---------------- Diagram 3: Vector 1 Precision Bit-Flipping ----------------
def d3():
    b = []
    b.append(panel(30, 70, W - 60, 310))

    b.append(text(50, 96, "Step 1: Ciphertext is generated under server key K and initial counter T", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 110, 240, 36, "P = \"email=alice&role=user\"", fill="#fef3c7", stroke=AMBER, tc="#92400e", mono=True, size=12))
    b.append(text(310, 132, "⊕", size=18, fill=MUTED, weight="700"))
    b.append(box(330, 110, 220, 36, "S = E_K(Nonce ‖ counter)", fill="#ede9fe", stroke=PURPLE, tc="#5b21b6", mono=True, size=12))
    b.append(text(570, 132, "=", size=18, fill=MUTED, weight="700"))
    b.append(box(590, 110, 250, 36, "C = [ 4a 1b 89 ... 7c 32 ]", fill=NEU_F, stroke=NEU_S, tc=INK, mono=True, size=12))

    b.append(text(50, 180, "Step 2: Attacker flips target bits in ciphertext (Δ = \"user\" ⊕ \"root\")", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 194, 230, 36, "C_tampered = C ⊕ Δ", fill="#fee2e2", stroke=RED, tc="#991b1b", mono=True, size=12))
    b.append(arrow(290, 212, 405, 212, color=RED))
    # 280..415 is the clear span between the two boxes; the label must stay inside it.
    b.append(alabel(340, 204, "zero error spread", fill=RED, max_width=126))
    b.append(box(415, 194, 425, 36, "Only the 4 target bytes are modified; surrounding bytes remain valid", fill="#fee2e2", stroke=RED, tc="#991b1b", size=11.5))

    b.append(text(50, 264, "Step 3: Server decrypts tampered ciphertext without verifying MAC", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 278, 250, 36, "P' = C_tampered ⊕ S", fill=NEU_F, stroke=NEU_S, tc=INK, mono=True, size=12))
    b.append(text(320, 300, "=", size=18, fill=MUTED, weight="700"))
    b.append(box(350, 278, 490, 36, "P' = \"email=alice&role=root\"   (Privilege Escalation Verified!)", fill="#fee2e2", stroke=RED, tc="#991b1b", mono=True, size=12, weight="700"))

    b.append(text(W / 2, 405, "Scope: the profile service is a self-contained browser simulation for defensive education.", size=10.5, fill=MUTED))
    return svg(W, 420, "Vector 1 — Precision Bit-Flipping Mechanics", "".join(b),
               subtitle="because CTR uses bitwise XOR with zero diffusion, flipping C[i] directly flips P[i]")

# ---------------- Diagram 4: Vector 2 Two-Time Pad Keystream Reuse ----------------
def d4():
    b = []
    b.append(panel(30, 70, W - 60, 330))

    b.append(text(50, 96, "Encrypting two distinct plaintexts with the same (Key, Nonce)", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 110, 360, 34, "C₁ = P₁ ⊕ S   (\"TRANSFER $00500...\")", fill=NEU_F, stroke=BLUE, tc=INK, mono=True, size=11.5))
    b.append(box(450, 110, 390, 34, "C₂ = P₂ ⊕ S   (\"MEETING AT MIDNIGHT...\")", fill=NEU_F, stroke=BLUE, tc=INK, mono=True, size=11.5))

    b.append(text(50, 175, "Keystream Cancellation: XORing both ciphertexts removes S entirely", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 190, 790, 36, "C₁ ⊕ C₂ = (P₁ ⊕ S) ⊕ (P₂ ⊕ S) = P₁ ⊕ P₂   (Keystream S completely cancels out!)", fill="#fef3c7", stroke=AMBER, tc="#92400e", mono=True, size=12, weight="700"))

    b.append(text(50, 255, "Plaintext Recovery Options (No AES key required)", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 270, 380, 56, "Known Plaintext:\nP₂ = (C₁ ⊕ C₂) ⊕ P₁\nInstant recovery of full P₂ if P₁ is known", fill="#ede9fe", stroke=PURPLE, tc="#5b21b6", size=11.5, lh=14))
    b.append(box(460, 270, 380, 56, "Statistical Crib Dragging:\nDrag natural language words ('the', 'http')\nReadable text appears at matching offsets", fill="#ede9fe", stroke=PURPLE, tc="#5b21b6", size=11.5, lh=14))

    b.append(text(W / 2, 422, "Scope: educational browser demonstration of the two-time pad failure using synthetic messages.", size=10.5, fill=MUTED))
    return svg(W, 436, "Vector 2 — Two-Time Pad Keystream Reuse", "".join(b),
               subtitle="reusing a nonce destroys confidentiality by collapsing ciphertexts into plaintext XOR")

# ---------------- Diagram 5: Vector 3 Edit-Oracle Keystream Extraction ----------------
def d5():
    b = [panel(30, 70, W - 60, 292)]

    b.append(text(50, 96, "Step 1: the attacker holds the ciphertext and never sees the key", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 110, 330, 34, "C = P ⊕ S", fill=NEU_F, stroke=NEU_S, tc=INK, mono=True, size=12))
    b.append(box(410, 110, 430, 34, "K and S are unknown to the attacker", fill=NEU_F, stroke=NEU_S, tc=MUTED, size=11.5))

    b.append(text(50, 178, "Step 2: the attacker asks the edit API to store all-zero PLAINTEXT", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 192, 330, 46, "edit(C, offset 0,\nnew plaintext = 00 00 … 00)", fill="#fee2e2", stroke=RED, tc="#991b1b", mono=True, size=11, lh=14))
    b.append(arrow(390, 215, 428, 215, color=RED))
    b.append(box(438, 192, 402, 46, "Server decrypts, overwrites the plaintext\nwith zeros, re-encrypts under the SAME (K, T)", fill=NEU_F, stroke=NEU_S, tc=INK, size=11, lh=14))

    b.append(text(50, 268, "Step 3: because 00 ⊕ S = S, the reply IS the keystream", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 282, 330, 34, "server returns S", fill="#fee2e2", stroke=RED, tc="#991b1b", mono=True, size=12))
    b.append(text(392, 304, "⇒", size=17, fill=MUTED, weight="700"))
    b.append(box(414, 282, 426, 34, "P = C ⊕ S — whole plaintext, one request", fill="#fee2e2", stroke=RED, tc="#991b1b", mono=True, size=11))

    b.append(text(W / 2, 386, "Scope: the document editor is a self-contained browser simulation for defensive education.", size=10.5, fill=MUTED))
    return svg(W, 400, "Vector 3 — Keystream Extraction via an Edit Oracle", "".join(b),
               subtitle="an API that re-encrypts attacker-chosen plaintext under an unchanged counter leaks the keystream")

# ---------------- Diagram 6: Vector 4 Counter Reuse Regenerates Keystream ----------------
def d6():
    b = [panel(30, 70, W - 60, 230)]
    b.append(text(W / 2, 96, "A 2-bit counter field has only 4 states, so block 5 reuses the counter block of block 1",
                  size=12, fill=MUTED))

    x0, bw, gap, y = 62, 88, 12, 120
    for i in range(8):
        ctr = i % 4
        dup = i >= 4
        x = x0 + i * (bw + gap)
        fill, stroke, tc = ("#fee2e2", RED, "#991b1b") if dup else (NEU_F, NEU_S, INK)
        b.append(f'<rect {_paint(fill, stroke)} x="{x}" y="{y}" width="{bw}" height="58" rx="8" stroke-width="1.5"/>')
        b.append(text(x + bw / 2, y + 20, f"T = N‖{ctr}", size=11, fill=tc, mono=True, weight="700"))
        b.append(text(x + bw / 2, y + 38, f"S{ctr}", size=12, fill=tc, mono=True, weight="700"))
        b.append(text(x + bw / 2, y + 52, f"block {i + 1}", size=9.5, fill=MUTED))

    b.append(text(W / 2, 212, "Blocks 5-8 regenerate the keystream of blocks 1-4 — every pair is a two-time pad within one stream.",
                  size=11.5, fill=RED, weight="600"))
    b.append(text(W / 2, 240, "The invariant: an identical counter block under an identical key always yields an identical keystream block.",
                  size=11.5, fill=INK))
    b.append(text(W / 2, 262, "Real systems meet this by field sizing, not by AES wrapping: RFC 3686 §4 gives the block counter 32 bits,",
                  size=11, fill=MUTED))
    b.append(text(W / 2, 278, "capping one packet at 2³² − 1 blocks (68,719,476,720 octets) before the counter would repeat under that key.",
                  size=11, fill=MUTED))

    b.append(text(W / 2, 326, "Scope: educational illustration of counter reuse; the demo wraps a tiny counter in software rather than overflowing AES.",
                  size=10.5, fill=MUTED))
    return svg(W, 340, "Vector 4 — Counter Reuse Regenerates Keystream", "".join(b),
               subtitle="a counter field too small for the traffic repeats counter blocks, and repeated counter blocks repeat keystream")

# ---------------- Diagram 7: the standards trajectory ----------------
# Prose can state that counter mode survived the move to AEAD, but the shape of
# the argument is chronological — approval, adoption inside AEAD, the AEAD-only
# cut, then a review that keeps the mode while naming what would retire it. A
# dated axis carries that in one read; three paragraphs do not.
def d7():
    b = []
    axis_y = 176
    # (date, headline, detail, colour, above?) — every date verified against the
    # publication itself or its CSRC listing, not against recollection.
    events = [
        ("Dec 2001", "SP 800-38A", "CTR approved, one of\nfive confidentiality modes", NAVY, True),
        ("Jan 2004", "RFC 3686", "AES-CTR in IPsec ESP;\n32-bit block counter", NAVY, False),
        ("Nov 2007", "SP 800-38D", "GCM = counter mode\n+ GHASH tag", BLUE, True),
        ("Aug 2018", "TLS 1.3", "AEAD only — and all five\nsuites are counter mode", GREEN, False),
        ("Apr 2023", "Revision decided", "SP 800-38A to gain\nauthentication guidance", AMBER, True),
        ("Sep 2024", "IR 8459", "“not yet deprecating” —\nno alternative standardised", AMBER, False),
        ("2025 →", "Accordions", "SP 800-197 series: the\nnamed condition to retire", GRAY, True),
    ]
    n = len(events)
    x0, x1 = 105, 795
    step = (x1 - x0) / (n - 1)

    b.append(f'<line x1="60" y1="{axis_y}" x2="840" y2="{axis_y}" class="arw" stroke-width="2" marker-end="url(#arw)"/>')

    for i, (date, head, detail, colour, above) in enumerate(events):
        cx = x0 + i * step
        bw, bh = 168, 62
        by = axis_y - 26 - bh if above else axis_y + 26
        b.append(f'<circle cx="{cx}" cy="{axis_y}" r="5" fill="{colour}"/>')
        tick_y = by + bh if above else by
        b.append(f'<line x1="{cx}" y1="{axis_y}" x2="{cx}" y2="{tick_y}" stroke="{colour}" stroke-width="1.5"/>')
        b.append(box(cx - bw / 2, by, bw, bh, detail, fill=NEU_F, stroke=colour, tc=INK, size=10.5, weight="400", lh=13))
        # Date sits on the axis side of the marker so the eye reads date then event.
        label_y = axis_y - 12 if not above else axis_y + 20
        b.append(text(cx, label_y, f"{date}  ·  {head}", size=10.5, fill=colour, weight="700"))

    b.append(text(W / 2, 352, "Counter mode was never removed — what was removed is using it without a tag. "
                              "Every step right of 2018 keeps the keystream and adds authentication.",
                  size=11, fill=INK, weight="600"))
    b.append(text(W / 2, 374, "Scope: educational summary of published NIST and IETF status as of September 2026; "
                              "dates from each publication or its CSRC listing. Not legal or compliance advice.",
                  size=10.5, fill=MUTED))
    return svg(W, 390, "How counter mode came through the move to authenticated encryption", "".join(b),
               subtitle="approval, adoption inside AEAD, the AEAD-only cut, and the condition NIST named for retiring the mode")

# ---------------- Diagram 8: the counter block as a capacity budget ----------------
# The 96/32 split is stated twice in prose and once in a code comment, each time
# as a sentence. It is really an allocation: bits spent on the nonce cannot be
# spent on the counter, and each side buys a different limit. A bar shows the
# trade directly, and shows why the demo helper's 64/64 is a different budget.
def d8():
    b = []
    bar_x, bar_w = 60, 780

    def split(y, nonce_bits, ctr_bits, title, nonce_note, ctr_note, accent):
        o = [text(bar_x, y - 10, title, size=12, fill=INK, anchor="start", weight="700")]
        nw = bar_w * nonce_bits / 128
        o.append(box(bar_x, y, nw, 44, f"Nonce — {nonce_bits} bits", fill=NEU_F, stroke=accent, tc=INK, size=12, mono=True))
        o.append(box(bar_x + nw, y, bar_w - nw, 44, f"Counter — {ctr_bits} bits", fill=NEU_F, stroke=accent, tc=INK, size=12, mono=True))
        o.append(text(bar_x + nw / 2, y + 62, nonce_note, size=10.5, fill=MUTED, lh=13))
        o.append(text(bar_x + nw + (bar_w - nw) / 2, y + 62, ctr_note, size=10.5, fill=MUTED, lh=13))
        return "".join(o)

    b.append(text(W / 2, 74, "128 bits, allocated once. Bits given to the nonce are taken from the counter.",
                  size=11.5, fill=INK, weight="600"))

    b.append(split(
        104, 96, 32, "Production split — what the page's samples use, and RFC 3686's shape",
        "96 random bits keep the chance of a repeat\nbelow 2⁻³² out to about 2³² messages",
        "2³² blocks from zero = 64 GiB in one message\n(RFC 3686 starts at 1, so 2³²−1 = 68,719,476,720 octets)",
        BLUE))

    b.append(split(
        238, 64, 64, "This browser proof of concept uses a deliberately different split",
        "64 bits is too narrow for random nonces\nat scale; every demo run takes a fresh key",
        "Far more counter than any demo needs;\nthe width is not the point being taught",
        GRAY))

    b.append(text(W / 2, 356, "Neither split adds integrity. The budget governs how much one key may encrypt "
                              "before a counter block repeats — a tag is still required on top.",
                  size=11, fill=INK, weight="600"))
    b.append(text(W / 2, 378, "Scope: educational illustration of counter-block allocation; limits per NIST SP 800-38D §8 "
                              "and RFC 3686 §4. Defensive use.",
                  size=10.5, fill=MUTED))
    return svg(W, 394, "The counter block is a capacity budget", "".join(b),
               subtitle="what the nonce buys, what the counter buys, and why the demo helper splits it differently")

DIAGRAMS = [("modes-ctr-etm-gcm", d1), ("taxonomy", d2), ("vector1-bit-flipping", d3), ("vector2-two-time-pad", d4), ("vector3-edit-oracle", d5), ("vector4-counter-reuse", d6), ("standards-timeline", d7), ("counter-block-split", d8)]

# Guarded so the helpers can be imported (e.g. to unit-test the layout guards)
# without the import writing files as a side effect.
if __name__ == "__main__":
    for name, fn in DIAGRAMS:
        (OUT / f"{name}.svg").write_text(fn() + "\n")
        print("wrote", name + ".svg")
