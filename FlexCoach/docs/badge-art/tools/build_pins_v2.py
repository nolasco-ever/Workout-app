"""
Build the FlexCoach badges as 3D enamel pins from the Badge Builder's
design config, with shapely + trimesh (no Blender needed for geometry).

  python build_pins_v2.py <design-config.json> <out_dir>

One .glb per tier: plate, border, enamel panels (base / tone1 / tone2 /
second colour), metal line-work (segments, panel cut, rings), scallops,
stones (bezel + cut gem), and ten mark groups (metal fill + graphite
channel). Every mesh carries a material named by role, with the flat
colour from the palette, so Blender and the app can swap them by name.
Units: badge width 1, Y up, front +Z (converted on export), centred.
"""
import json, math, os, re, sys
import numpy as np
from shapely.geometry import LineString, Polygon, MultiPolygon, Point, box
from shapely.affinity import scale as sscale, translate as stranslate, rotate as srotate
from shapely.ops import unary_union
from svgpathtools import parse_path
import trimesh
from trimesh.visual.material import PBRMaterial

CFG = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
PAL = CFG['palette']

FAMILIES = ['workouts', 'streak', 'volume', 'records', 'cycles', 'perfect_cycles', 'early_bird', 'night_owl', 'buddies', 'plan_uses']
LADDER = {'workouts': 8, 'streak': 7, 'volume': 7, 'records': 6, 'cycles': 5, 'perfect_cycles': 4, 'early_bird': 4, 'night_owl': 4, 'buddies': 4, 'plan_uses': 5}
FACE = 0.92   # thinner metal border: 4% of the width
STONES_DEFAULT = {'medallion': 16, 'hex': 12, 'shield': 14}
MARK_FIT = {'medallion': (1.0, 0.0), 'hex': (1.0, 0.0), 'shield': (0.9, -3.0)}

# Heights, in badge units (badge = 1 wide; the 2D work is in the 100 box and scaled at the end)
# Real relief: the metal stands 3% of the badge width above the enamel, the mark a little more, the stones higher still.
# Thin pin: a 1.8% plate, enamel just above it, lines a touch proud of the enamel, marks a little more, stones highest.
Z = dict(plate=(0.0, 0.016), enamel=(0.016, 0.023), line=(0.016, 0.034), border=(0.016, 0.036), scallop=0.030,
         mark_metal=(0.016, 0.046), mark_channel=(0.016, 0.038), bezel=(0.016, 0.040), gem_base=0.034, gem_top=0.058)
DOME = float(os.environ.get('DOME', '0.0'))    # flat; the dome is abandoned
PILLOW_LAYERS = 14
VIVID = float(os.environ.get('VIVID', '1.3'))   # saturation gain on every chromatic colour (neutrals untouched)
LOGO_BARS = [(217, 164, 200, 696, 64), (449, 236, 176, 552, 56), (657, 312, 150, 400, 48)]   # the app icon's three bars in its 1024 box
LOGO_SIZE = 30   # tallest bar, badge units
LOGO_CY = 42     # logo sits high on the back; the unlock date is engraved beneath it
DATE_Y = 66; DATE_CAP = 6.5   # baseline-ish centre and cap height of the engraved date, badge units
DATE_SAMPLE = os.environ.get('DATE', '12 OCT 2026')
ETCH = 0.0045    # engraving depth into the back of the plate
STEP = 0.35

# ---------------------------------------------------------------- 2D helpers
def path_poly(d, closed=True):
    p = parse_path(d); pts = []
    for seg in p:
        n = max(2, int(seg.length() / STEP))
        pts += [(seg.point(i / n).real, seg.point(i / n).imag) for i in range(n)]
    return Polygon(pts) if closed else LineString(pts)

def path_line(d):
    p = parse_path(d); pts = []
    for seg in p:
        n = max(2, int(seg.length() / STEP))
        pts += [(seg.point(i / n).real, seg.point(i / n).imag) for i in range(n + 1)]
    return LineString(pts)

OUTLINES = {
    'medallion': Point(50, 50).buffer(46, quad_segs=48),
    'hex': Polygon([(50, 3), (91, 26.5), (91, 73.5), (50, 97), (9, 73.5), (9, 26.5)]),
    'shield': path_poly('M50 3 L90 16 V50 C90 73 72 90 50 97 C28 90 10 73 10 50 V16 Z'),
}
def about_centre(g, k): return sscale(g, k, k, origin=(50, 50))

def outline_points(poly, n, k):
    ring = about_centre(poly, k).exterior
    return [ring.interpolate(ring.length * i / n) for i in range(n)]

def hexrgb(h):
    h = h.lstrip('#'); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
def mix(h, t, target): a = hexrgb(h); b = hexrgb(target); return '#' + ''.join(f'{int(round((a[i] + (b[i] - a[i]) * t) * 255)):02x}' for i in range(3))
lighten = lambda h, t: mix(h, t, '#FFFFFF'); darken = lambda h, t: mix(h, t, '#000000')
import colorsys
def vivid(h, gain=VIVID):
    """Cartoon colour: push saturation hard, lift value a touch; greys, blacks and whites stay as they are."""
    r, g, b = hexrgb(h); hh, ss, vv = colorsys.rgb_to_hsv(r, g, b)
    if ss < 0.15: return h
    ss = min(1.0, ss * gain); vv = min(1.0, vv * (1 + 0.15 * (gain - 1)))
    return '#' + ''.join(f'{int(round(c * 255)):02x}' for c in colorsys.hsv_to_rgb(hh, ss, vv))
PAL = {k: vivid(v) for k, v in PAL.items()}
PAL['ruby'] = '#e8142e'   # a true red: the palette's ruby leans pink once saturated
PAL['gold'] = '#f7c62a'   # keep gold yellow so it stays apart from the orange tier
print('vivid palette', {k: v for k, v in PAL.items()})
FONT_PATH = os.environ.get('FONT', '/Users/evernolasco/Documents/GitHub/FlexCoachApp/FlexCoach/FlexCoach/assets/fonts/Sora-SemiBold.ttf')
def date_poly(text, y=DATE_Y, cap=DATE_CAP, cx=50, mirror=True, tracking=0.08):
    """The unlock date as engraved letters: glyph outlines from the app's display font, centred, mirrored to read from the back."""
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from svgpathtools import parse_path
    from shapely import affinity
    font = TTFont(FONT_PATH); glyphs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    cap_h = getattr(font['OS/2'], 'sCapHeight', 0) or upm * 0.7
    x = 0.0; letters = []
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None: continue
        g = glyphs[gname]; pen = SVGPathPen(glyphs); g.draw(pen); d = pen.getCommands()
        if d:
            contours = []
            for sub in parse_path(d).continuous_subpaths():
                pts = []
                for seg in sub:
                    n = 1 if seg.__class__.__name__ == 'Line' else 8
                    pts += [(seg.point(i / n).real, seg.point(i / n).imag) for i in range(n)]
                if len(pts) >= 3:
                    c = Polygon(pts).buffer(0)
                    if not c.is_empty: contours.append(c)
            glyph = None
            for c in contours: glyph = c if glyph is None else glyph.symmetric_difference(c)
            if glyph is not None and not glyph.is_empty: letters.append(affinity.translate(glyph, x, 0))
        x += g.width + tracking * upm
    width = x - tracking * upm
    p = unary_union(letters)
    k = cap / cap_h
    p = affinity.scale(p, xfact=k, yfact=-k, origin=(0, 0))          # font units -> badge units, y down
    p = affinity.translate(p, -width * k / 2, cap / 2)                 # centre on the origin, cap-height centred on y=0
    if mirror: p = affinity.scale(p, xfact=-1, yfact=1, origin=(0, 0))
    return affinity.translate(p, cx, y)
def logo_poly(size=LOGO_SIZE, cx=50, cy=LOGO_CY, mirror=True):
    """The app icon's bars, centred, scaled so the tallest bar is `size`; mirrored so it reads correctly from the back."""
    from shapely import affinity
    from shapely.geometry import box
    k = size / 696.0; bars = []
    for x, y, w, h, rx in LOGO_BARS:
        X0, Y0, W, H, R = (x - 512) * k, (y - 512) * k, w * k, h * k, rx * k
        r = box(X0 + R, Y0, X0 + W - R, Y0 + H).union(box(X0, Y0 + R, X0 + W, Y0 + H - R))
        for px, py in [(X0 + R, Y0 + R), (X0 + W - R, Y0 + R), (X0 + R, Y0 + H - R), (X0 + W - R, Y0 + H - R)]:
            r = r.union(Point(px, py).buffer(R, quad_segs=12))
        bars.append(r)
    p = unary_union(bars)
    if mirror: p = affinity.scale(p, xfact=-1, yfact=1, origin=(0, 0))
    return affinity.translate(p, cx, cy)

# ---------------------------------------------------------------- marks (same drawings as the builder, with fill hints)
def star(cx, cy, r):
    pts = []
    for i in range(8):
        a = -math.pi / 2 + i * math.pi / 4; rr = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts
def rrect(x, y, w, h, rx):
    return box(x, y, x + w, y + h).buffer(rx, join_style='round').buffer(-rx, join_style='round') if rx else box(x, y, x + w, y + h)
# each element: (geometry, kind) kind: 'closed' (stroke + fillable), 'open' (stroke only), 'hollow' (closed outline, never filled)
MARKS = {
    'workouts': [(path_line('M38 50 H62'), 'open'), (rrect(31, 36, 7, 28, 2), 'closed'), (rrect(27, 41, 4, 18, 1.5), 'closed'), (rrect(62, 36, 7, 28, 2), 'closed'), (rrect(69, 41, 4, 18, 1.5), 'closed')],
    'streak': [(path_poly('M50 27 C56 37 66 43 66 56 A16 16 0 0 1 34 56 C34 48 39 44 42 38 C45 41 47 44 47 47 C51 43 50 35 50 27 Z'), 'closed')],
    'volume': [(path_poly('M28 39 H72 L69 48 H58 L59 62 H66 V70 H34 V62 H41 L42 48 H31 Z'), 'closed'), (path_line('M31 44 H69'), 'open')],
    'records': [(path_poly('M38 29 H62 V42 A12 12 0 0 1 38 42 Z'), 'closed'), (path_line('M38 33 H31 A7 7 0 0 0 38 44'), 'open'), (path_line('M62 33 H69 A7 7 0 0 1 62 44'), 'open'), (path_line('M50 54 V61'), 'open'), (path_line('M41 66 H59'), 'open'), (path_line('M37 71 H63'), 'open')],
    'cycles': [(path_line('M32 45 A19 19 0 0 1 65 38'), 'open'), (path_line('M65 29 V38 H56'), 'open'), (path_line('M68 55 A19 19 0 0 1 35 62'), 'open'), (path_line('M35 71 V62 H44'), 'open')],
    'perfect_cycles': [(Point(50, 50).buffer(23, quad_segs=32), 'hollow'), (Polygon([(50, 36), (54, 45), (63.5, 46), (56.5, 52.5), (58.5, 62), (50, 57), (41.5, 62), (43.5, 52.5), (36.5, 46), (46, 45)]), 'closed')],
    'early_bird': [(path_line('M28 62 H72'), 'open'), (path_poly('M38 62 A12 12 0 0 1 62 62 Z'), 'closed'), (path_line('M50 36 V42'), 'open'), (path_line('M34 42 L38.5 46.5'), 'open'), (path_line('M66 42 L61.5 46.5'), 'open'), (path_line('M28 54 H34'), 'open'), (path_line('M66 54 H72'), 'open'), (path_line('M40 70 H60'), 'open')],
    'night_owl': [(srotate(path_poly('M60.6 33.2 A21 21 0 1 0 60.6 66.8 A17 17 0 1 1 60.6 33.2 Z'), -30, origin=(50, 50)), 'closed'), (Polygon(star(64.5, 37, 7)), 'closed')],
    'buddies': [(Point(50, 42).buffer(7.5, quad_segs=24), 'closed'), (path_poly('M34 70 C34 58 41 54 50 54 C59 54 66 58 66 70 Z'), 'closed'), (Point(34, 44).buffer(5.5, quad_segs=20), 'closed'), (Point(66, 44).buffer(5.5, quad_segs=20), 'closed'), (path_line('M28 62 C28 58 29.5 55 32 54.5'), 'open'), (path_line('M72 62 C72 58 70.5 55 68 54.5'), 'open')],
    'plan_uses': [(Point(50, 50).buffer(6, quad_segs=20), 'closed'), (Point(30, 36).buffer(4.5, quad_segs=16), 'closed'), (Point(30, 64).buffer(4.5, quad_segs=16), 'closed'), (Point(70, 36).buffer(4.5, quad_segs=16), 'closed'), (Point(70, 64).buffer(4.5, quad_segs=16), 'closed'), (path_line('M45 47 L34 39'), 'open'), (path_line('M45 53 L34 61'), 'open'), (path_line('M55 47 L66 39'), 'open'), (path_line('M55 53 L66 61'), 'open')],
}

def mark_regions(family, shape):
    """(metal, channel) polygons of the solid mark: metal = outer halo + filled interiors; channel = the graphite line inside the halo."""
    k, dy = MARK_FIT[shape]
    strokes, fills = [], []
    for g, kind in MARKS[family]:
        line = g.exterior if isinstance(g, Polygon) else g
        strokes.append(line)
        if kind == 'closed': fills.append(g)
    strokes = unary_union(strokes)
    # Sampled outlines can self-touch at a cusp (the flame's tip); buffer(0) repairs them so the fill survives the union.
    fills = unary_union([f.buffer(0) for f in fills]) if fills else Polygon()
    halo = unary_union([strokes.buffer(3.0, cap_style='round', join_style='round'), fills])
    channel = strokes.buffer(1.5, cap_style='round', join_style='round')
    metal = halo.difference(channel)
    t = lambda g: stranslate(about_centre(g, k), 0, dy)
    return t(metal), t(channel)

# ---------------------------------------------------------------- tier layout in 2D
def wedges(n_or_fan):
    fan = n_or_fan == 'fan'; n = 7 if fan else int(n_or_fan)
    cx, cy = 50, (78 if fan else 50); out = []
    for i in range(n):
        a0 = (math.pi + i * math.pi / n) if fan else (-math.pi / 2 + i * 2 * math.pi / n)
        a1 = (math.pi + (i + 1) * math.pi / n) if fan else (-math.pi / 2 + (i + 1) * 2 * math.pi / n)
        out.append((Polygon([(cx, cy), (cx + 90 * math.cos(a0), cy + 90 * math.sin(a0)), (cx + 90 * math.cos(a1), cy + 90 * math.sin(a1))]), LineString([(cx, cy), (cx + 90 * math.cos(a0), cy + 90 * math.sin(a0))])))
    return out

PANEL = {
    'chevron': (LineString([(-10, 60), (50, 70), (110, 60)]), Polygon([(-10, 60), (50, 70), (110, 60), (110, 120), (-10, 120)])),
    'low': (LineString([(-10, 66), (110, 66)]), box(-10, 66, 110, 120)),
    'half': (LineString([(-10, 50), (110, 50)]), box(-10, 50, 110, 120)),
    'diagonal': (LineString([(-10, 78), (110, 32)]), Polygon([(-10, 78), (110, 32), (110, 120), (-10, 120)])),
    'top': (LineString([(-10, 40), (50, 30), (110, 40)]), Polygon([(-10, 40), (50, 30), (110, 40), (110, -20), (-10, -20)])),
}

def layout_tier(t):
    d = t['design']; shape = t['shape']; outline = OUTLINES[shape]
    face = about_centre(outline, FACE)
    border = outline.difference(face)
    lines = []
    if d['segments'] != 'none':
        for _, l in wedges(d['segments']): lines.append(l.buffer(1.0))
    if d['panel'] != 'none': lines.append(PANEL[d['panel']][0].buffer(1.3))
    if d['inner'] in ('ring', 'band'): lines.append(about_centre(outline, 0.76).exterior.buffer(1.3))
    if d['inner'] == 'double': lines.append(about_centre(outline, 0.80).exterior.buffer(1.1)); lines.append(about_centre(outline, 0.72).exterior.buffer(0.9))
    lines = unary_union(lines).intersection(face) if lines else Polygon()
    scallops = Polygon()
    if d['bleed'] != 'none':
        n = {'medallion': 24, 'hex': 18, 'shield': 20}[shape]
        pts = outline_points(outline, n, FACE)
        scallops = unary_union([p.buffer(2.2, quad_segs=12) for p in pts]).intersection(face)
    # enamel regions by colour
    regions = {}
    base = face.difference(lines).difference(scallops)
    if d['segments'] != 'none':
        for i, (w, _) in enumerate(wedges(d['segments'])):
            key = 'tone1' if i % 2 == 0 else 'tone2'
            regions[key] = unary_union([regions.get(key, Polygon()), w.intersection(base)])
    else:
        regions['enamel'] = base
    if d['panel'] != 'none':
        pp = PANEL[d['panel']][1].intersection(base)
        for key in list(regions): regions[key] = regions[key].difference(pp)
        regions['enamel2'] = pp
    if d['inner'] == 'band':
        band = face.difference(about_centre(outline, 0.76)).difference(lines)
        for key in list(regions): regions[key] = regions[key].difference(band)
        regions['enamel2'] = unary_union([regions.get('enamel2', Polygon()), band])
    stones = []
    if t['stone'] != 'none':
        n = STONES_DEFAULT[shape] if t['count'] == 'default' else int(t['count'])
        stones = [(p.x, p.y) for p in outline_points(outline, n, 0.93)]
    return dict(shape=shape, outline=outline, face=face, border=unary_union([border, scallops]), lines=lines, regions=regions, stones=stones)

# ---------------------------------------------------------------- 3D
def extrude(poly, z0, z1):
    polys = [g for g in (poly.geoms if hasattr(poly, 'geoms') else [poly]) if isinstance(g, Polygon) and g.area > 0.05]
    meshes = []
    for p in polys:
        p = p.simplify(0.03)
        if not p.is_valid: p = p.buffer(0)
        if p.is_empty: continue
        for q in (p.geoms if hasattr(p, 'geoms') else [p]):
            m = trimesh.creation.extrude_polygon(q, z1 - z0)
            m.apply_translation([0, 0, z0 * 100])  # heights are in badge units; the box is 100 wide
            meshes.append(m)
    if not meshes: return None
    return trimesh.util.concatenate(meshes)

def pillow(poly, z0, z1, half_width, layers=PILLOW_LAYERS):
    """Extrude with a rounded top: stacked layers that inset as they rise, following a quarter circle."""
    base_h = (z1 - z0) * 0.45; round_h = (z1 - z0) - base_h
    parts = [extrude(poly, z0, z0 + base_h)]
    for k in range(layers):
        t0, t1 = k / layers, (k + 1) / layers
        inset = half_width * (1 - math.cos(t0 * math.pi / 2))
        shrunk = poly.buffer(-inset, join_style='round')
        if shrunk.is_empty: break
        parts.append(extrude(shrunk, z0 + base_h + round_h * math.sin(t0 * math.pi / 2), z0 + base_h + round_h * math.sin(t1 * math.pi / 2)))
    parts = [m for m in parts if m is not None]
    return trimesh.util.concatenate(parts) if parts else None

def gem_mesh(cx, cy, r):
    """A cut stone: octagonal crown from base to a smaller table."""
    base_z, top_z = Z['gem_base'] * 100, Z['gem_top'] * 100
    ring = lambda k, z: [(cx + r * k * math.cos(-math.pi / 2 + math.pi / 8 + i * math.pi / 4), cy + r * k * math.sin(-math.pi / 2 + math.pi / 8 + i * math.pi / 4), z) for i in range(8)]
    outer, table = ring(1, base_z), ring(0.5, top_z)
    bottom = ring(1, base_z - 1.0)
    verts = outer + table + bottom
    faces = []
    for i in range(8):
        j = (i + 1) % 8
        faces += [[i, j, 8 + j], [i, 8 + j, 8 + i]]            # crown facets
        faces += [[16 + i, 16 + j, j], [16 + i, j, i]]         # girdle to the bottom
    for i in range(1, 7): faces.append([8, 8 + i, 8 + i + 1])  # table
    for i in range(1, 7): faces.append([16, 16 + i + 1, 16 + i])  # bottom
    m = trimesh.Trimesh(vertices=np.array(verts), faces=np.array(faces), process=True)
    m.fix_normals()
    return m

def srgb_to_linear(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def material(name, color, metallic, roughness):
    # glTF base colour is linear; the palette is sRGB hex. Without this conversion every colour displays lighter and paler than designed.
    return PBRMaterial(name=name, baseColorFactor=[*(srgb_to_linear(c) for c in hexrgb(color)), 1.0], metallicFactor=metallic, roughnessFactor=roughness)

def finish(mesh, mat):
    mesh.visual = trimesh.visual.TextureVisuals(material=mat)
    # 100 box -> badge units, centred, y up (trimesh exports +Y up when we hand it y-up data)
    v = mesh.vertices.copy()
    # The lens: every vertex rises by the dome at its (x, y), so all parts bow together.
    r2 = ((v[:, 0] - 50) ** 2 + (v[:, 1] - 50) ** 2) / (50.0 ** 2)
    z = v[:, 2] / 100 + DOME * np.clip(1.0 - r2, 0.0, 1.0)
    mesh.vertices = np.column_stack([(v[:, 0] - 50) / 100, -(v[:, 1] - 50) / 100, z])
    mesh.fix_normals()
    return mesh

def build_tier(i, t):
    L = layout_tier(t); d = t['design']
    metal_c = PAL[t['metal']]; mark_c = metal_c if t['mark'] == 'metal' else PAL[t['mark']]
    enamel_c = PAL[t['enamel']]; enamel2_c = PAL[d['enamel2']] if d['enamel2'] != 'none' else darken(enamel_c, 0.22)
    stone_c = PAL[t['stone']] if t['stone'] != 'none' else None
    mats = {
        'metal': material('metal', metal_c, 1.0, 0.3), 'mark': material('mark', mark_c, 1.0, 0.3),
        'enamel': material('enamel', enamel_c, 0.0, 0.45), 'enamel_tone1': material('enamel_tone1', lighten(enamel_c, 0.04), 0.0, 0.45),
        'enamel_tone2': material('enamel_tone2', darken(enamel_c, 0.2), 0.0, 0.45), 'enamel2': material('enamel2', enamel2_c, 0.0, 0.45),
        'stone': material('stone', stone_c or '#FFFFFF', 0.0, 0.08),
        'metal_dark': material('metal_dark', darken(metal_c, 0.45), 1.0, 0.55),   # engraving floor: the same metal, darkened and matte
    }
    scene = trimesh.Scene()
    add = lambda name, mesh, mat: scene.add_geometry(finish(mesh, mats[mat]), node_name=name, geom_name=name) if mesh is not None else None
    engraved = unary_union([logo_poly(), date_poly(DATE_SAMPLE)])
    add('plate', extrude(L['outline'].difference(engraved), *Z['plate']), 'metal')
    add('etch', extrude(engraved.buffer(0.3), Z['plate'][0] + ETCH, Z['plate'][1]), 'metal_dark')   # engraved floor sunk into the back
    add('border', pillow(L['border'], *Z['border'], 1.8), 'metal')
    for key, poly in L['regions'].items():
        add(f'enamel_{key}', extrude(poly, *Z['enamel']), {'enamel': 'enamel', 'tone1': 'enamel_tone1', 'tone2': 'enamel_tone2', 'enamel2': 'enamel2'}[key])
    if L['stones']:
        bezels = unary_union([Point(x, y).buffer(4.0, quad_segs=16).difference(Point(x, y).buffer(3.1, quad_segs=16)) for x, y in L['stones']])
        add('bezels', pillow(bezels, *Z['bezel'], 0.45), 'metal')
        add('stones', trimesh.util.concatenate([gem_mesh(x, y, 3.1) for x, y in L['stones']]), 'stone')
    for f in FAMILIES:
        metal, channel = mark_regions(f, L['shape'])
        footprint = unary_union([metal, channel]).buffer(0.9)
        add(f'lines_{f}', pillow(L['lines'].difference(footprint), *Z['line'], 1.0), 'metal')
        add(f'mark_{f}', pillow(metal.intersection(L['face']), *Z['mark_metal'], 1.4), 'mark')
        add(f'mark_{f}_channel', extrude(channel.intersection(L['face']), *Z['mark_channel']), 'enamel2')
    path = os.path.join(OUT, f'tier{i + 1}.glb')
    scene.export(path)
    tris = sum(len(g.faces) for g in scene.geometry.values())
    print(f'tier{i + 1} {t["shape"]:9s} {t["metal"]:8s} {t["enamel"]:8s} meshes={len(scene.geometry)} tris={tris} {os.path.getsize(path) // 1024}KB')

for i, t in enumerate(CFG['tiers']):
    build_tier(i, t)
json.dump({'tiers': CFG['tiers'], 'palette': PAL, 'ladder': LADDER, 'families': FAMILIES}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('done')
