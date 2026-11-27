# Koren · make the stress mark easy to see. Run once: python3 tools/stress-mark.py   (needs: pip install fonttools brotli)
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# In Onest and Unbounded the combining acute (U+0301) is small and sits as low as the breve of й,
# so a stressed и (мои́) reads as й (мой). This makes the mark taller and steeper and lifts it clear
# of the breve, in every weight of the variable font. The fonts stay under the SIL Open Font License
# (neither declares a Reserved Font Name). Running it twice does nothing: it checks the mark's height first.
from pathlib import Path
from fontTools.ttLib import TTFont

FONTS = Path(__file__).resolve().parent.parent / "fonts"
# file, bottom of the mark now, how far to lift it, how much taller to make it, how far to move it left (over the vowel's middle)
JOBS = [("onest-cyrillic-wght-normal.woff2", 612, 40, 1.6, 25),
        ("unbounded-cyrillic-wght-normal.woff2", 627, 40, 1.45, 20)]

for name, y0, lift, sy, dx in JOBS:
    path = FONTS / name
    f = TTFont(path)
    glyf, gname = f["glyf"], "acutecomb"
    g = glyf[gname]
    g.recalcBounds(glyf)
    if g.yMin != y0:
        print(f"{name}: already done (mark starts at {g.yMin})")
        continue
    n = len(g.coordinates)
    g.coordinates = type(g.coordinates)([(x - dx, round(y0 + lift + (y - y0) * sy)) for x, y in g.coordinates])
    g.recalcBounds(glyf)
    # the other weights: deltas only scale, the lift is already in the default
    for tv in f["gvar"].variations.get(gname, []):
        tv.coordinates = [c if c is None or i >= n else (c[0], round(c[1] * sy)) for i, c in enumerate(tv.coordinates)]
    f.flavor = "woff2"
    f.save(path)
    print(f"{name}: mark now {g.yMin}–{g.yMax}")
