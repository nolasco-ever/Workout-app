"""
Build the badge models straight from the Badge Builder's SVG output, so the
3D badge is a one-to-one copy of the badge the builder draws.

  python build_pins_svg.py <svg_dir> <out_dir>

<svg_dir> holds <family>_t<tier>.svg and meta.json from jsd/export.js.
Every SVG element becomes a layer in paint order: what a later element covers
is cut away from the earlier one, exactly like the painter's algorithm on
screen. Fills become enamel or metal plates; strokes become metal line-work;
the mark's halo, fill and channel become the raised mark. Writes one body per
tier (body_t<tier>.glb: plate with the engraved back, border, enamel, line-work)
and one overlay per family and tier (<family>_t<tier>.glb: the mark).
"""
import json, math, os, re, sys
import xml.etree.ElementTree as ET
import numpy as np
from shapely.geometry import LineString, Polygon, MultiPolygon, Point, box
from shapely import affinity
from shapely.ops import unary_union
from svgpathtools import parse_path
import trimesh
from trimesh.visual.material import PBRMaterial
import colorsys

SVG_DIR, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
META = json.load(open(os.path.join(SVG_DIR, 'meta.json')))
FAMILIES, LADDER = META['families'], META['ladder']

# Heights in badge units (the badge is 1 wide; the drawing is in the 100 box).
Z = dict(plate=(0.0, 0.016), enamel=(0.016, 0.023), line=(0.016, 0.034), metal=(0.016, 0.036), rim=(0.016, 0.046), mark=(0.016, 0.040), channel=(0.016, 0.0355))
LAYERS = int(os.environ.get('LAYERS', '8'))
VIVID = float(os.environ.get('VIVID', '1.3'))
STEP = 0.35
LOGO_BARS = [(217, 164, 200, 696, 64), (449, 236, 176, 552, 56), (657, 312, 150, 400, 48)]
LOGO_SIZE, LOGO_CY = 30, 42
DATE_Y, DATE_CAP = 65, float(os.environ.get('DATE_CAP', '4.5'))
DATE_SAMPLE = os.environ.get('DATE', '')   # the real unlock date is added at runtime from glyph meshes; nothing is baked in
ETCH = 0.0045
FONT_PATH = os.environ.get('FONT', '/Users/evernolasco/Documents/GitHub/FlexCoachApp/FlexCoach/FlexCoach/assets/fonts/Sora-SemiBold.ttf')

# ---------------------------------------------------------------- colour
def hexrgb(h):
    h = h.lstrip('#'); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
def mix(h, t, target): a = hexrgb(h); b = hexrgb(target); return '#' + ''.join(f'{int(round((a[i] + (b[i] - a[i]) * t) * 255)):02x}' for i in range(3))
darken = lambda h, t: mix(h, t, '#000000')
def vivid(h, gain=VIVID):
    r, g, b = hexrgb(h); hh, ss, vv = colorsys.rgb_to_hsv(r, g, b)
    if ss < 0.15: return h
    ss = min(1.0, ss * gain); vv = min(1.0, vv * (1 + 0.15 * (gain - 1)))
    return '#' + ''.join(f'{int(round(c * 255)):02x}' for c in colorsys.hsv_to_rgb(hh, ss, vv))
OVERRIDES = {'#e0163f': '#e8142e', '#f3c244': '#f7c62a'}   # ruby reads pink and gold drifts amber once saturated
def shown(h):
    h = h.lower()
    return OVERRIDES.get(h, vivid(h))
def srgb_to_linear(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def material(name, color, metallic, roughness):
    return PBRMaterial(name=name, baseColorFactor=[*(srgb_to_linear(c) for c in hexrgb(color)), 1.0], metallicFactor=metallic, roughnessFactor=roughness)

# ---------------------------------------------------------------- SVG -> shapely
def affine_of(transform):
    """SVG transform list -> shapely affine 6-tuple (a, b, d, e, xoff, yoff)."""
    m = np.eye(3)
    for name, args in re.findall(r'(\w+)\(([^)]*)\)', transform or ''):
        v = [float(x) for x in re.split(r'[ ,]+', args.strip()) if x]
        t = np.eye(3)
        if name == 'translate': t[0, 2], t[1, 2] = v[0], (v[1] if len(v) > 1 else 0)
        elif name == 'scale': t[0, 0], t[1, 1] = v[0], (v[1] if len(v) > 1 else v[0])
        elif name == 'rotate':
            a = math.radians(v[0]); c, s = math.cos(a), math.sin(a)
            r = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
            if len(v) == 3:
                cx, cy = v[1], v[2]
                t = np.array([[1, 0, cx], [0, 1, cy], [0, 0, 1]]) @ r @ np.array([[1, 0, -cx], [0, 1, -cy], [0, 0, 1]])
            else: t = r
        elif name == 'matrix': t = np.array([[v[0], v[2], v[4]], [v[1], v[3], v[5]], [0, 0, 1]])
        m = m @ t
    return (m[0, 0], m[0, 1], m[1, 0], m[1, 1], m[0, 2], m[1, 2])

def compose(outer, inner):
    A = np.array([[outer[0], outer[1], outer[4]], [outer[2], outer[3], outer[5]], [0, 0, 1]])
    B = np.array([[inner[0], inner[1], inner[4]], [inner[2], inner[3], inner[5]], [0, 0, 1]])
    m = A @ B
    return (m[0, 0], m[0, 1], m[1, 0], m[1, 1], m[0, 2], m[1, 2])

IDENTITY = (1, 0, 0, 1, 0, 0)

def path_subpaths(d):
    """[(points, closed)] for every continuous subpath of an SVG path."""
    out = []
    for sub in parse_path(d).continuous_subpaths():
        pts = []
        for seg in sub:
            n = max(2, int(seg.length() / STEP)) if seg.__class__.__name__ != 'Line' else 1
            pts += [(seg.point(i / n).real, seg.point(i / n).imag) for i in range(n)]
        pts.append((sub[-1].end.real, sub[-1].end.imag))
        out.append((pts, sub.isclosed()))
    return out

def rrect(x, y, w, h, rx):
    """A rectangle with rounded corners: inset by the radius, then grow it back with round joins."""
    rx = min(rx, w / 2, h / 2)
    return box(x + rx, y + rx, x + w - rx, y + h - rx).buffer(rx, join_style='round', quad_segs=10) if rx else box(x, y, x + w, y + h)

def shape_geoms(el):
    """(fill_polygon_or_None, [stroke_linestrings]) in the element's own coordinates."""
    tag = el.tag.split('}')[-1]
    g = lambda k, d='0': float(el.get(k, d))
    if tag == 'path':
        subs = path_subpaths(el.get('d', ''))
        polys = [Polygon(p).buffer(0) for p, closed in subs if len(p) >= 3]
        fill = unary_union([q for q in polys if not q.is_empty and q.area > 0.05]) if polys else None
        lines = [LineString(p + ([p[0]] if closed and p[0] != p[-1] else [])) for p, closed in subs if len(p) >= 2]
        return (fill if fill is not None and not fill.is_empty else None), lines
    if tag == 'rect':
        r = rrect(g('x'), g('y'), g('width'), g('height'), g('rx')); return r, [LineString(r.exterior.coords)]
    if tag == 'circle':
        c = Point(g('cx'), g('cy')).buffer(g('r'), quad_segs=24); return c, [LineString(c.exterior.coords)]
    if tag == 'ellipse':
        c = affinity.scale(Point(0, 0).buffer(1, quad_segs=24), g('rx'), g('ry')); c = affinity.translate(c, g('cx'), g('cy')); return c, [LineString(c.exterior.coords)]
    return None, []

def paint(h):
    """Classify a fill or stroke value from the builder's SVG."""
    if not h or h == 'none': return None
    if h.startswith('url(#'):
        return {'-m)': 'metal', '-mk)': 'mark', '-e)': 'enamel', '-st)': 'stone'}.get(h[-3:] if h.endswith('mk)') else h[-3:], None) or ('mark' if h.endswith('-mk)') else 'metal' if h.endswith('-m)') else 'enamel' if h.endswith('-e)') else None)
    return h.lower()

def walk(el, inherited, acc):
    """Collect (kind, paint, geometry, in_mark) in paint order; strokes with low opacity are shading, not geometry."""
    tag = el.tag.split('}')[-1]
    if tag in ('defs', 'clipPath', 'linearGradient', 'radialGradient', 'stop'): return
    a = dict(inherited)
    for k in ('fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'opacity', 'clip-path'):
        if el.get(k) is not None: a[k] = el.get(k)
    a['transform'] = compose(inherited['transform'], affine_of(el.get('transform'))) if el.get('transform') else inherited['transform']
    a['in_mark'] = inherited.get('in_mark', False) or (el.get('fill') or '').endswith('-mk)') or (el.get('stroke') or '').endswith('-mk)')
    fill, lines = shape_geoms(el)
    T = a['transform']
    if fill is not None and paint(a.get('fill', '#000000')) is not None:
        acc.append(('fill', paint(a['fill']), affinity.affine_transform(fill, T), a))
    stroke = paint(a.get('stroke', 'none'))
    if lines and stroke is not None and float(a.get('stroke-opacity', '1')) >= 0.7:
        w = float(a.get('stroke-width', '1'))
        cap = {'round': 'round', 'square': 'square'}.get(a.get('stroke-linecap', 'butt'), 'flat')
        join = {'round': 'round', 'bevel': 'bevel'}.get(a.get('stroke-linejoin', 'miter'), 'mitre')
        geom = unary_union([affinity.affine_transform(l, T) for l in lines]).buffer(w / 2 * T[0] if abs(T[0] - T[3]) < 1e-6 else w / 2, cap_style=cap, join_style=join)
        acc.append(('stroke', stroke, geom, a))
    for child in el:
        walk(child, a, acc)

ATTR = re.compile(r'\s+([\w:-]+)="([^"]*)"')
def dedupe_attributes(svg_text):
    """Browsers keep the first of a repeated attribute; XML refuses the element. Match the browser."""
    def fix(m):
        seen = set(); kept = []
        for name, value in ATTR.findall(m.group(2)):
            if name in seen: continue
            seen.add(name); kept.append(f' {name}="{value}"')
        return '<' + m.group(1) + ''.join(kept) + m.group(3)
    return re.sub(r'<([\w:]+)((?:\s+[\w:-]+="[^"]*")*)(\s*/?>)', fix, svg_text)

def layers_of(svg_text, face):
    root = ET.fromstring(dedupe_attributes(svg_text))
    acc = []
    walk(root, {'transform': IDENTITY, 'fill': '#000000', 'stroke': 'none'}, acc)
    out = []
    for kind, p, geom, a in acc:
        if a.get('clip-path'): geom = geom.intersection(face)
        if geom.is_empty: continue
        out.append(dict(kind=kind, paint=p, geom=geom, in_mark=a['in_mark'], width=float(a.get('stroke-width', '1'))))
    return out

def visible(layers):
    """Painter's algorithm: each layer minus everything painted after it."""
    out = []
    for i, L in enumerate(layers):
        cover = unary_union([M['geom'] for M in layers[i + 1:]]) if i + 1 < len(layers) else None
        g = L['geom'].difference(cover) if cover is not None and not cover.is_empty else L['geom']
        if not g.is_empty and g.area > 0.02: out.append(dict(L, geom=g))
    return out

# ---------------------------------------------------------------- engraving on the back
def date_poly(text, y=DATE_Y, cap=DATE_CAP, cx=50, tracking=0.08):
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    font = TTFont(FONT_PATH); glyphs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
    cap_h = getattr(font['OS/2'], 'sCapHeight', 0) or upm * 0.7
    x = 0.0; letters = []
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None: continue
        g = glyphs[gname]; pen = SVGPathPen(glyphs); g.draw(pen); d = pen.getCommands()
        if d:
            glyph = None
            for pts, closed in path_subpaths(d):
                if len(pts) >= 3:
                    c = Polygon(pts).buffer(0)
                    if not c.is_empty: glyph = c if glyph is None else glyph.symmetric_difference(c)
            if glyph is not None and not glyph.is_empty: letters.append(affinity.translate(glyph, x, 0))
        x += g.width + tracking * upm
    width = x - tracking * upm
    p = unary_union(letters); k = cap / cap_h
    p = affinity.scale(p, xfact=k, yfact=-k, origin=(0, 0)); p = affinity.translate(p, -width * k / 2, cap / 2)
    p = affinity.scale(p, xfact=-1, yfact=1, origin=(0, 0))
    return affinity.translate(p, cx, y)

def logo_poly(size=LOGO_SIZE, cx=50, cy=LOGO_CY):
    k = size / 696.0; bars = []
    for x, y, w, h, rx in LOGO_BARS:
        X0, Y0, W, H, R = (x - 512) * k, (y - 512) * k, w * k, h * k, rx * k
        bars.append(rrect(X0, Y0, W, H, R))
    p = affinity.scale(unary_union(bars), xfact=-1, yfact=1, origin=(0, 0))
    return affinity.translate(p, cx, cy)

# ---------------------------------------------------------------- 3D
# Every face is built with a known outward winding: caps counter-clockwise seen from +Z, walls from
# counter-clockwise exteriors (holes clockwise), sloped bands facing up. No automatic normal repair,
# which guessed wrong on these open surfaces and turned whole parts inside out for a back-face-culling renderer.
from shapely.geometry.polygon import orient

def _polys(poly):
    return [orient(g, 1.0) for g in (poly.geoms if hasattr(poly, 'geoms') else [poly]) if isinstance(g, Polygon) and g.area > 0.02]

def _faces_up(v2, f, up=True):
    """Flip any triangle whose 2D winding does not match the wanted facing."""
    a, b, c = v2[f[:, 0]], v2[f[:, 1]], v2[f[:, 2]]
    signed = (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0])
    wrong = (signed < 0) if up else (signed > 0)
    f = f.copy(); f[wrong] = f[wrong][:, ::-1]
    return f

def _tri(poly, z, up=True):
    out = []
    for q in _polys(poly):
        v2, f = trimesh.creation.triangulate_polygon(q)
        out.append(trimesh.Trimesh(np.column_stack([v2, np.full(len(v2), z)]), _faces_up(v2, f, up), process=False))
    return out

def _walls(poly, z0, z1):
    out = []
    for q in _polys(poly):
        for ring in [q.exterior, *q.interiors]:
            pts = np.array(ring.coords[:-1]); n = len(pts)
            if n < 3: continue
            v = np.vstack([np.column_stack([pts, np.full(n, z0)]), np.column_stack([pts, np.full(n, z1)])])
            f = []
            for i in range(n):
                j = (i + 1) % n; f += [[i, j, n + j], [i, n + j, n + i]]
            out.append(trimesh.Trimesh(v, np.array(f), process=False))
    return out

def _band(outer, inner, z_out, z_in):
    out = []; inner_b = inner.boundary
    for q in _polys(outer.difference(inner)):
        v2, f = trimesh.creation.triangulate_polygon(q)
        z = np.array([z_in if inner_b.distance(Point(p)) < 1e-5 else z_out for p in v2])
        out.append(trimesh.Trimesh(np.column_stack([v2, z]), _faces_up(v2, f, True), process=False))
    return out

def _clean(poly):
    poly = poly.simplify(0.03)
    if not poly.is_valid: poly = poly.buffer(0)
    return poly

def extrude(poly, z0, z1):
    poly = _clean(poly)
    if poly.is_empty or not _polys(poly): return None
    Z0, Z1 = z0 * 100, z1 * 100
    return trimesh.util.concatenate(_tri(poly, Z0, up=False) + _walls(poly, Z0, Z1) + _tri(poly, Z1, up=True))

def pillow(poly, z0, z1, half_width, layers=LAYERS):
    """Extrude with a rounded top, lofted as one surface."""
    poly = _clean(poly)
    if poly.is_empty or not _polys(poly): return None
    Z0, Z1 = z0 * 100, z1 * 100
    base_h = (Z1 - Z0) * 0.45; round_h = (Z1 - Z0) - base_h
    rings = [(poly, Z0 + base_h)]
    for k in range(1, layers + 1):
        t = k / layers
        r = poly.buffer(-half_width * (1 - math.cos(t * math.pi / 2)), join_style='round').simplify(0.06)
        if r.is_empty or not _polys(r): break
        rings.append((r, Z0 + base_h + round_h * math.sin(t * math.pi / 2)))
    hard = trimesh.util.concatenate(_tri(poly, Z0, up=False) + _walls(poly, Z0, Z0 + base_h))
    loft = []
    for (ra, za), (rb, zb) in zip(rings, rings[1:]): loft += _band(ra, rb, za, zb)
    loft += _tri(rings[-1][0], rings[-1][1], up=True)
    smooth = trimesh.util.concatenate(loft); smooth.merge_vertices(digits_vertex=5)   # shared seams -> averaged normals -> a smooth curve
    return trimesh.util.concatenate([hard, smooth])

def finish(mesh, mat):
    mesh.visual = trimesh.visual.TextureVisuals(material=mat)
    v = mesh.vertices.copy()
    # Drawing space is y-down; the model is y-up. That mirror reverses every winding, so reverse them back.
    mesh.vertices = np.column_stack([(v[:, 0] - 50) / 100, -(v[:, 1] - 50) / 100, v[:, 2] / 100])
    mesh.faces = mesh.faces[:, ::-1]
    return mesh

# ---------------------------------------------------------------- per tier
def outline_poly(d): return Polygon(path_subpaths(d)[0][0]).buffer(0)

def build_tier(t):
    f0 = FAMILIES[0]
    m0 = META['badges'][f'{f0}:{t}']
    outline = outline_poly(m0['outline'])
    face = affinity.scale(outline, m0['face'], m0['face'], origin=(50, 50))
    metal_c, enamel_c = m0['metal'], m0['enamel']
    enamel2_c = m0['enamel2'] or m0['tone2']
    mats = {}
    def mat_for(role_key, color, metallic, rough):
        if role_key not in mats: mats[role_key] = material(role_key, shown(color), metallic, rough)
        return mats[role_key]
    body = []
    add = lambda name, mesh, mat: body.append((name, finish(mesh, mat))) if mesh is not None else None
    engraved = unary_union([logo_poly()] + ([date_poly(DATE_SAMPLE)] if DATE_SAMPLE else []))
    add('plate', extrude(outline.difference(engraved), *Z['plate']), mat_for('metal', metal_c, 1.0, 0.3))
    add('etch', extrude(engraved, Z['plate'][0] + ETCH, Z['plate'][0] + ETCH + 0.004), mat_for('metal_dark', darken(metal_c, 0.45), 1.0, 0.55))

    # The body is everything the builder paints before the mark; the mark is the overlay. The first family stands in for all.
    layers = layers_of(open(os.path.join(SVG_DIR, f'{f0}_t{t}.svg')).read(), face)
    body_layers = visible([L for L in layers if not L['in_mark']])
    counts = {}
    for L in body_layers:
        p, g = L['paint'], L['geom']
        if L['kind'] == 'fill':
            if p == 'metal' or p == metal_c.lower():
                rim = g.area > 400   # the border ring; everything else metal is small ornament
                mesh, mat = pillow(g, *(Z['rim'] if rim else Z['metal']), 2.4 if rim else 1.2, layers=12 if rim else LAYERS), mat_for('metal', metal_c, 1.0, 0.3)
            elif p == 'mark': mesh, mat = pillow(g, *Z['metal'], 1.2), mat_for('mark', m0['markColor'], 1.0, 0.3)
            else:
                color = {'enamel': enamel_c}.get(p, p)
                mesh, mat = extrude(g, *Z['enamel']), mat_for('enamel_' + color.lstrip('#'), color, 0.0, 0.45)
        else:
            if p in ('metal', 'mark') or p == metal_c.lower():
                mesh, mat = pillow(g, *Z['line'], min(1.0, L['width'] / 2 * 0.9)), mat_for('metal', metal_c, 1.0, 0.3)
            else:
                color = p
                mesh, mat = extrude(g, *Z['enamel']), mat_for('enamel_' + color.lstrip('#'), color, 0.0, 0.45)
        if mesh is None: continue
        key = f"{L['kind']}_{mat.name}"; counts[key] = counts.get(key, 0) + 1
        add(f'{key}_{counts[key]}', mesh, mat)
    scene = trimesh.Scene()
    for name, mesh in body: scene.add_geometry(mesh, node_name=name, geom_name=name)
    path = os.path.join(OUT, f'body_t{t}.glb'); scene.export(path)
    report = [('body', sum(len(g.faces) for g in scene.geometry.values()), os.path.getsize(path))]

    for f in FAMILIES:
        if t > LADDER[f]: continue
        m = META['badges'][f'{f}:{t}']
        layers = layers_of(open(os.path.join(SVG_DIR, f'{f}_t{t}.svg')).read(), face)
        mark_layers = visible([L for L in layers if L['in_mark']])
        metal_parts, channel_parts = [], []
        for L in mark_layers:
            if L['paint'] == 'mark': metal_parts.append(L['geom'])
            else: channel_parts.append(L['geom'])
        scene = trimesh.Scene()
        mesh = pillow(unary_union(metal_parts).intersection(face), *Z['mark'], 0.5) if metal_parts else None
        if mesh is not None: scene.add_geometry(finish(mesh, mat_for('mark', m['markColor'], 1.0, 0.3)), node_name='mark', geom_name='mark')
        mesh = extrude(unary_union(channel_parts).intersection(face), *Z['channel']) if channel_parts else None
        if mesh is not None: scene.add_geometry(finish(mesh, mat_for('enamel_' + enamel2_c.lstrip('#'), enamel2_c, 0.0, 0.45)), node_name='mark_channel', geom_name='mark_channel')
        path = os.path.join(OUT, f'{f}_t{t}.glb'); scene.export(path)
        report.append((f, sum(len(g.faces) for g in scene.geometry.values()), os.path.getsize(path)))
    print(f'tier{t} {m0["shape"]:9s} ' + ' '.join(f'{n}:{tris // 1000}k/{size // 1024}KB' for n, tris, size in report))
    return report

files = []
for t in range(1, max(LADDER.values()) + 1): files += [(n, t, tris, b) for n, tris, b in build_tier(t)]
json.dump({'families': FAMILIES, 'ladder': LADDER, 'files': [{'name': n, 'tier': t, 'tris': tris, 'bytes': b} for n, t, tris, b in files]}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('done', len(files), 'files', sum(b for *_, b in files) // 1024, 'KB total')
