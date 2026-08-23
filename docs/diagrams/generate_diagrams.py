"""Generate the four hand-authored theme-aware diagrams embedded in docs/index.html.

The SVGs are theme-aware: theme-dependent colors (card/panel backgrounds, ink and
muted text, neutral fills, arrows) are CSS variables with a `prefers-color-scheme:
dark` override, so a single committed SVG renders correctly in both GitHub themes
when embedded as an image. Semantic colors (navy, red=leak/danger, green=safe,
purple, amber, blue) stay fixed — they read on either background.

Run: `python3 docs/diagrams/generate_diagrams.py` (writes the .svg files beside it).
"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)

SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

# Sentinels routed to CSS classes (theme-aware)
INK, MUTED, NEU_F, NEU_S = "@ink", "@muted", "@neuf", "@neus"
ARROW = "@arw"

# Fixed semantic colors (read on both light and dark themes)
NAVY = "#1f3a5f"
RED, GREEN, PURPLE, AMBER, GRAY, BLUE = "#dc2626", "#16a34a", "#6d28d9", "#b45309", "#64748b", "#2563eb"

STYLE = (
    '<style>'
    ':root{--card:#ffffff;--panel:#f8fafc;--border:#e2e8f0;--ink:#0f172a;--muted:#475569;'
    '--neuf:#f1f5f9;--neus:#cbd5e1;--arw:#94a3b8}'
    '@media (prefers-color-scheme:dark){:root{--card:#0d1117;--panel:#161b22;--border:#30363d;'
    '--ink:#e6edf3;--muted:#9aa4b2;--neuf:#1c2330;--neus:#3d444d;--arw:#6e7681}}'
    '.cardb{fill:var(--card);stroke:var(--border)}.card{fill:var(--card)}'
    '.panel{fill:var(--panel);stroke:var(--border)}'
    '.neu{fill:var(--neuf);stroke:var(--neus)}.cellA{fill:var(--neuf);stroke:var(--neus)}'
    '.xor{fill:var(--card);stroke:var(--muted)}'
    '.ink{fill:var(--ink)}.muted{fill:var(--muted)}'
    '.arw{stroke:var(--arw)}.arwhead{fill:var(--arw)}'
    '</style>'
)

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def _fillattr(color):
    return {INK: 'class="ink"', MUTED: 'class="muted"'}.get(color, f'fill="{color}"')

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
    n = len(label.split("\n"))
    cx, cy = x + w / 2, y + h / 2
    first = cy - (n - 1) * lh / 2 + size / 3
    if fill == NEU_F and stroke == NEU_S:
        rect = f'<rect class="neu" x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" stroke-width="{sw}"/>'
    else:
        rect = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
    return rect + text(cx, first, label, size=size, fill=tc, mono=mono, weight=weight, lh=lh)

def arrow(x1, y1, x2, y2, dashed=False, color=ARROW, sw=2):
    da = ' stroke-dasharray="6 5"' if dashed else ''
    st = 'class="arw"' if color == ARROW else f'stroke="{color}"'
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" {st} stroke-width="{sw}"{da} marker-end="url(#arw)"/>'

def path(d, dashed=False, color=ARROW, sw=2):
    da = ' stroke-dasharray="6 5"' if dashed else ''
    st = 'class="arw"' if color == ARROW else f'stroke="{color}"'
    return f'<path d="{d}" fill="none" {st} stroke-width="{sw}"{da} marker-end="url(#arw)"/>'

def alabel(x, y, s, size=11, fill=MUTED):
    w = len(s) * size * 0.56 + 10
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
    return head + body + '</svg>'

W = 900

def panel(x, y, w, h):
    return f'<rect class="panel" x="{x}" y="{y}" width="{w}" height="{h}" rx="10" stroke-width="1.5"/>'

# ---------------- Diagram 1: Comparison of CTR, CBC, and GCM ----------------
def d1():
    b = []
    b.append(text(W / 2, 80, "How block ciphers transform into stream or authenticated modes", size=13, fill=MUTED))

    def moderow(y0, name, mechanism, security_prop, tagcolor, tagtext):
        o = [panel(24, y0, W - 48, 100)]
        o.append(f'<rect x="44" y="{y0 + 16}" width="130" height="28" rx="14" fill="{NAVY}"/>')
        o.append(text(44 + 65, y0 + 34, name, size=12.5, fill="#fff", weight="700"))
        o.append(text(44, y0 + 64, mechanism, size=11.5, fill=MUTED, anchor="start", lh=15))
        ow, oh = 220, 68
        ox = W - 48 - ow - 20
        o.append(box(ox, y0 + 16, ow, oh, security_prop, fill=NEU_F, stroke=tagcolor, tc=INK, size=11.5, lh=14))
        o.append(text(ox + ow / 2, y0 + 74, tagtext, size=11, fill=tagcolor, weight="700"))
        return "".join(o)

    b.append(moderow(
        100, "AES-CTR",
        "Encrypts (Nonce ‖ counter) to produce keystream S.\nCiphertext is C = P ⊕ S. No padding needed.",
        "Malleable: C[i] ⊕ Δ = P[i] ⊕ Δ\nReused Nonce ⇒ C₁ ⊕ C₂ = P₁ ⊕ P₂\n",
        RED, "⚠ Unauthenticated: Vulnerable"
    ))
    b.append(moderow(
        212, "AES-CBC",
        "XORs each plaintext block with previous ciphertext.\nFirst block XORs random IV. Requires padding.",
        "Cascading error propagation;\nNo AEAD tag (Padding Oracle risk)\n",
        AMBER, "⚠ Unauthenticated (needs MAC)"
    ))
    b.append(moderow(
        324, "AES-GCM",
        "CTR keystream encryption + GMAC authentication tag\ncomputed over ciphertext and associated data.",
        "AEAD: 1-bit tamper rejects ciphertext\nbefore decryption completes\n",
        GREEN, "✔ Authenticated: IND-CCA2 Secure"
    ))
    return svg(W, 446, "AES-CTR vs AES-CBC vs AES-GCM", "".join(b),
               subtitle="CTR turns a block cipher into a stream cipher — but requires external authentication")

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
        b.append(f'<rect class="neu" x="{x}" y="{vy}" width="{w}" height="{vh}" rx="9" stroke-width="1.5"/>')
        b.append(f'<rect x="{x}" y="{vy}" width="6" height="{vh}" rx="3" fill="{ac}"/>')
        cx = x + w / 2
        b.append(text(cx, vy + 22, vt, size=13, fill=INK, weight="700"))
        b.append(text(cx, vy + 40, desc, size=11, fill=INK))
        b.append(text(cx, vy + 56, mode, size=10.5, fill=MUTED, weight="500"))

    r1c = r1[0] + r1[2] / 2
    r2c = r2[0] + r2[2] / 2
    r3c = r3[0] + r3[2] / 2

    # Vector 1 connects to R1 & R3
    b.append(arrow(r1c, r1[1] + r1[3], vs[0][0] + vs[0][1] / 2, vy - 2))
    b.append(path(f"M {r3c} {r3[1] + r3[3]} C {r3c} {r3[1] + r3[3] + 25}, {vs[0][0] + vs[0][1] / 2 + 50} {vy - 25}, {vs[0][0] + vs[0][1] / 2 + 20} {vy - 2}", dashed=True))

    # Vector 2 connects to R2
    b.append(arrow(r2c, r2[1] + r2[3], vs[1][0] + vs[1][1] / 2, vy - 2))

    # Vector 3 connects to R1, R2, R3
    b.append(arrow(r2c, r2[1] + r2[3], vs[2][0] + vs[2][1] / 2, vy - 2))

    # Vector 4 connects to R2
    b.append(arrow(r2c, r2[1] + r2[3], vs[3][0] + vs[3][1] / 2, vy - 2))

    b.append(text(W / 2, 380, "Scope: educational analysis of CTR mode failure modes; demonstrations execute locally in the browser/Node test suite.",
                  size=10.5, fill=MUTED))
    return svg(W, 396, "Three Root Causes and Four Attack Vectors", "".join(b),
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
    b.append(box(50, 194, 250, 36, "C_tampered = C ⊕ Δ", fill="#fee2e2", stroke=RED, tc="#991b1b", mono=True, size=12))
    b.append(arrow(310, 212, 380, 212, color=RED))
    b.append(alabel(345, 204, "zero error propagation", fill=RED))
    b.append(box(390, 194, 450, 36, "Only the 4 target bytes are modified; surrounding bytes remain valid", fill="#fee2e2", stroke=RED, tc="#991b1b", size=11.5))

    b.append(text(50, 264, "Step 3: Server decrypts tampered ciphertext without verifying MAC", size=12.5, fill=INK, weight="700", anchor="start"))
    b.append(box(50, 278, 250, 36, "P' = C_tampered ⊕ S", fill=NEU_F, stroke=NEU_S, tc=INK, mono=True, size=12))
    b.append(text(320, 300, "=", size=18, fill=MUTED, weight="700"))
    b.append(box(350, 278, 490, 36, "P' = \"email=alice&role=root\"   (Privilege Escalation Verified!)", fill="#dcfce7", stroke=GREEN, tc="#15803d", mono=True, size=12, weight="700"))

    b.append(text(W / 2, 405, "Scope: ProfileService in attacks.mjs is a local in-memory simulation for defensive education.", size=10.5, fill=MUTED))
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

    b.append(text(W / 2, 422, "Scope: demonstration of the two-time pad break in attacks.mjs and test/attacks.test.mjs.", size=10.5, fill=MUTED))
    return svg(W, 436, "Vector 2 — Two-Time Pad Keystream Reuse", "".join(b),
               subtitle="reusing a nonce destroys confidentiality by collapsing ciphertexts into plaintext XOR")

for name, fn in [("modes-ctr-gcm-cbc", d1), ("taxonomy", d2), ("vector1-bit-flipping", d3), ("vector2-two-time-pad", d4)]:
    (OUT / f"{name}.svg").write_text(fn() + "\n")
    print("wrote", name + ".svg")
