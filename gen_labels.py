#!/usr/bin/env python3
"""Generate perfume label SVGs and convert to PNGs."""

import subprocess
import os

PERFUMES = [
    ("Acqua Profonda", "Marine  \u00b7  Bergamot  \u00b7  Cypress", "Inspired by Acqua di Gio Profondo"),
    ("Fiamma", "Red Apple  \u00b7  Tonka  \u00b7  Sage", "Inspired by Eros Flame"),
    ("Fluidit\u00e9 Douce", "Juniper  \u00b7  Musk  \u00b7  Vanilla", "Inspired by Gentle Fluidity"),
    ("Rouge Cristal", "Saffron  \u00b7  Cedar  \u00b7  Ambergris", "Inspired by Baccarat Rouge 540"),
    ("212\u00b0", "Citrus  \u00b7  Florals  \u00b7  Sandalwood", "Inspired by Carolina Herrera 212"),
    ("Corail Solaire", "Hibiscus  \u00b7  Pomegranate  \u00b7  Cedar", "Inspired by Bulgari Omnia Coral"),
    ("Cristalline", "Lotus  \u00b7  Bamboo  \u00b7  White Tea", "Inspired by Bulgari Omnia Crystalline"),
    ("Sauvage Homme", "Bergamot  \u00b7  Pepper  \u00b7  Ambroxan", "Inspired by Dior Sauvage"),
    ("Azzurro Mare", "Lemon  \u00b7  Cedar  \u00b7  Musk", "Inspired by Dolce &amp; Gabbana Light Blue"),
    ("\u00c9clat Florale", "Lilac  \u00b7  Peach  \u00b7  White Musk", "Inspired by Lanvin \u00c9clat d\u2019Arp\u00e8ge"),
    ("Merveille Bleue", "Salt  \u00b7  Minerals  \u00b7  Driftwood", "Inspired by Herm\u00e8s Eau des Merveilles Bleue"),
    ("L\u2019Unico", "Peach  \u00b7  Vanilla  \u00b7  Amber", "Inspired by Dolce &amp; Gabbana The One"),
    ("Acqua Classica", "Seawater  \u00b7  Jasmine  \u00b7  Rosemary", "Inspired by Acqua di Gio"),
    ("Blanc Frais", "Grapefruit  \u00b7  Cardamom  \u00b7  Cedar", "Inspired by Lacoste White"),
    ("Nectarine Bloom", "Nectarine  \u00b7  Peony  \u00b7  Honey", "Inspired by Jo Malone Nectarine"),
    ("Delina Rose", "Lychee  \u00b7  Rhubarb  \u00b7  Turkish Rose", "Inspired by Parfums de Marly Delina"),
    ("R\u00eaverie", "Black Tea  \u00b7  Ginger  \u00b7  Cinnamon", "Inspired by LV Imagination"),
    ("Noir Intense", "Ginger  \u00b7  Lavender  \u00b7  Vetiver", "Inspired by YSL Y Intense"),
    ("Symphonie Dor\u00e9e", "Grapefruit  \u00b7  Ginger  \u00b7  Bergamot", "Inspired by LV Symphony"),
    ("Voile Blanc", "Bergamot  \u00b7  Orange Blossom  \u00b7  Musk", "Inspired by Parfums de Marly Valaya"),
    ("Paradosso", "Pear  \u00b7  Jasmine  \u00b7  Vanilla Bourbon", "Inspired by Prada Paradoxe"),
    ("Bleu Noble", "Grapefruit  \u00b7  Incense  \u00b7  Cedar", "Inspired by Bleu de Chanel"),
]

W, H = 640, 100
SCALLOP_R = 4
PAD = 0

def scalloped_path(w, h, r, pad):
    """Full label path with scalloped left and right edges, straight top and bottom."""
    inner_h = h - 2 * pad
    d = 2 * r
    n = int(inner_h // d)
    leftover = inner_h - n * d
    start_y = pad + leftover / 2
    end_y = h - pad - leftover / 2

    parts = []
    # top-left corner
    parts.append(f"M {pad},{pad}")
    # top edge (straight)
    parts.append(f"L {w - pad},{pad}")
    # right edge - scallops going down
    parts.append(f"L {w - pad},{start_y}")
    for i in range(n):
        parts.append(f"a {r},{r} 0 0,0 0,{d}")
    parts.append(f"L {w - pad},{h - pad}")
    # bottom edge (straight)
    parts.append(f"L {pad},{h - pad}")
    # left edge - scallops going up
    parts.append(f"L {pad},{end_y}")
    for i in range(n):
        parts.append(f"a {r},{r} 0 0,0 0,{-d}")
    parts.append(f"L {pad},{pad}")
    parts.append("Z")
    return " ".join(parts)

def scalloped_contour(w, h, r, pad):
    """Outline-only version for inner decorative border."""
    inner_h = h - 2 * pad
    d = 2 * r
    n = int(inner_h // d)
    leftover = inner_h - n * d
    start_y = pad + leftover / 2
    end_y = h - pad - leftover / 2

    parts = []
    parts.append(f"M {pad},{pad}")
    parts.append(f"L {w - pad},{pad}")
    parts.append(f"L {w - pad},{start_y}")
    for i in range(n):
        parts.append(f"a {r},{r} 0 0,0 0,{d}")
    parts.append(f"L {w - pad},{h - pad}")
    parts.append(f"L {pad},{h - pad}")
    parts.append(f"L {pad},{end_y}")
    for i in range(n):
        parts.append(f"a {r},{r} 0 0,0 0,{-d}")
    parts.append(f"L {pad},{pad}")
    parts.append("Z")
    return " ".join(parts)

svg_head_raw = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdfbf7"/>
      <stop offset="100%" stop-color="#f5f0e4"/>
    </linearGradient>
  </defs>

  <!-- scalloped die-cut shape -->
  <path d="{SCALLOP}" fill="url(#bg)" stroke="#d4c9a8" stroke-width="1"/>

  <!-- inner decorative border -->
  <path d="{INNER}" fill="none" stroke="#e0d6c0" stroke-width="0.4"/>

  <!-- === LEFT SIDE === -->
  <!-- logo mark -->
  <g transform="translate(24,10) scale(0.9)">
    <path d="M6 32 L6 4 L26 32 L26 4" stroke="#4a3f35" stroke-width="1.3" stroke-linejoin="round" fill="none"/>
    <circle cx="38" cy="28" r="3" stroke="#c8a45c" stroke-width="1" fill="none"/>
  </g>

  <!-- brand -->
  <text x="62" y="21" font-family="Georgia,serif" font-size="7" fill="#4a3f35" letter-spacing="2.5">NOTE.D</text>
  <text x="62" y="31" font-family="Georgia,serif" font-size="5" fill="#a09078" font-style="italic">handcrafted in the philippines</text>

  <!-- perfume name -->
  <text x="40" y="62" font-family="Georgia,serif" font-size="18" fill="#4a3f35" font-style="italic" letter-spacing="1">$$name$$</text>

  <!-- left dotted frame - horizontal only -->
  <line x1="28" y1="46" x2="315" y2="46" stroke="#2a2a2a" stroke-width="0.4" opacity="0.35" stroke-dasharray="3 4"/>
  <line x1="28" y1="82" x2="315" y2="82" stroke="#2a2a2a" stroke-width="0.4" opacity="0.35" stroke-dasharray="3 4"/>

  <!-- footer -->
  <text x="40" y="95" font-family="Georgia,serif" font-size="5" fill="#bfb098">Note.d  \u00b7  eau de parfum</text>

  <!-- small ornament -->
  <text x="330" y="55" font-family="Georgia,serif" font-size="7" fill="#d4c9a8" opacity="0.5">\u2766</text>

  <!-- === RIGHT SIDE === -->
  <!-- right content box -->
  <rect x="{RBX}" y="22" width="{RBW}" height="72" rx="2" stroke="#2a2a2a" stroke-width="0.4" fill="none" opacity="0.35" stroke-dasharray="3 4"/>

  <!-- notes -->
  <text x="{R}" y="40" font-family="Georgia,serif" font-size="6.5" fill="#6b5c4a" letter-spacing="0.4">$$notes$$</text>

  <!-- inspired by -->
  <text x="{R}" y="54" font-family="Georgia,serif" font-size="6" fill="#a09078" font-style="italic">$$inspired$$</text>

  <!-- website + volume -->
  <text x="{R}" y="72" font-family="Georgia,serif" font-size="5" fill="#a09078">fb.com/notedph</text>
  <text x="{R}" y="83" font-family="Georgia,serif" font-size="5" fill="#a09078">10mL \u00b7 30mL</text>

  <!-- small ornament -->
  <text x="610" y="62" font-family="Georgia,serif" font-size="6" fill="#d4c9a8" opacity="0.4">\u2766</text>
</svg>'''

R = 380
RBX = 370
RBW = 250
INNER_PAD = 4

SVG_HEAD = svg_head_raw.format(
    W=W, H=H,
    SCALLOP=scalloped_path(W, H, SCALLOP_R, PAD),
    INNER=scalloped_contour(W, H, SCALLOP_R - 1, INNER_PAD),
    R=R, RBX=RBX, RBW=RBW,
)

OUT_DIR = "/home/riegojere/Projects/aura-ghibli/labels"
os.makedirs(OUT_DIR, exist_ok=True)

for name, notes, inspired in PERFUMES:
    safe = name.lower().replace(" ", "-").replace("\u00e9", "e").replace("\u00e8", "e").replace("\u00ea", "e").replace("\u00eb", "e").replace("\u00f4", "o").replace("\u00b0", "")
    safe = safe.replace("'", "").replace("\u2019", "")
    svg_path = os.path.join(OUT_DIR, f"{safe}.svg")
    png_path = os.path.join(OUT_DIR, f"{safe}.png")

    svg = SVG_HEAD.replace("$$name$$", name).replace("$$notes$$", notes).replace("$$inspired$$", inspired)
    with open(svg_path, "w") as f:
        f.write(svg)

    subprocess.run(["rsvg-convert", "-w", str(W), "-h", str(H), svg_path, "-o", png_path], check=True)
    print(f"  {name} -> {safe}.png")

print(f"\nDone! {len(PERFUMES)} labels in {OUT_DIR}/")
