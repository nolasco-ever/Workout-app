"""
Turn the agreed line marks (docs/badge-art/marks/*.svg) into solid meshes
for Spline: each stroke becomes a ribbon (width 3, round caps and joins)
extruded to a small thickness. Output: one .glb per mark, plus one .glb
with all ten, in badge units (badge width = 1), Y up, front facing +Z,
centred on the badge centre.
"""
import math, re, sys, os
import numpy as np
from shapely.geometry import LineString, Polygon, Point
from shapely.ops import unary_union
from svgpathtools import parse_path
import trimesh

SRC = sys.argv[1]
OUT = sys.argv[2]
STROKE = 3.0           # svg units (badge = 100)
THICK = 2.0            # extrusion, svg units
STEP = 0.35            # sampling step along paths, svg units
os.makedirs(OUT, exist_ok=True)

def rot(pts, deg, cx, cy):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in pts]

def sample_path(d):
    path = parse_path(d)
    out = []
    for seg in path:
        n = max(2, int(seg.length() / STEP))
        pts = [seg.point(i / n) for i in range(n + 1)]
        pts = [(p.real, p.imag) for p in pts]
        if out and abs(out[-1][0] - pts[0][0]) < 1e-6 and abs(out[-1][1] - pts[0][1]) < 1e-6:
            pts = pts[1:]
        out.extend(pts)
    closed = bool(re.search(r'[Zz]\s*$', d.strip()))
    return out, closed

def circle_pts(cx, cy, r):
    return [(cx + r * math.cos(t), cy + r * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 96)]

def rect_pts(x, y, w, h, rx):
    rx = min(rx, w / 2, h / 2)
    d = f"M{x+rx} {y} H{x+w-rx} A{rx} {rx} 0 0 1 {x+w} {y+rx} V{y+h-rx} A{rx} {rx} 0 0 1 {x+w-rx} {y+h} H{x+rx} A{rx} {rx} 0 0 1 {x} {y+h-rx} V{y+rx} A{rx} {rx} 0 0 1 {x+rx} {y} Z"
    return sample_path(d)[0]

def parse_transform(t):
    m = re.match(r'rotate\(\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\)', t or '')
    return (float(m.group(1)), float(m.group(2)), float(m.group(3))) if m else None

def strokes_from_svg(svg):
    """Yield point lists for every path/circle/rect, with group/element rotations applied."""
    body = open(svg).read()
    group_rot = None
    gm = re.search(r'<g[^>]*transform="([^"]+)"', body)
    # the outer <g> only carries stroke style; an inner <g transform=...> rotates the whole mark
    inner = re.findall(r'<g transform="([^"]+)">(.*?)</g>', body, re.S)
    chunks = []
    if inner:
        for t, content in inner:
            chunks.append((parse_transform(t), content))
        rest = re.sub(r'<g transform="[^"]+">.*?</g>', '', body, flags=re.S)
        chunks.append((None, rest))
    else:
        chunks.append((None, body))
    for grot, content in chunks:
        for m in re.finditer(r'<path d="([^"]+)"(?:\s+transform="([^"]+)")?', content):
            pts, closed = sample_path(m.group(1))
            r = parse_transform(m.group(2))
            if r: pts = rot(pts, *r)
            if grot: pts = rot(pts, *grot)
            yield pts, closed
        for m in re.finditer(r'<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"', content):
            pts = circle_pts(float(m.group(1)), float(m.group(2)), float(m.group(3)))
            if grot: pts = rot(pts, *grot)
            yield pts, True
        for m in re.finditer(r'<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"(?: rx="([-\d.]+)")?', content):
            pts = rect_pts(float(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4)), float(m.group(5) or 0))
            if grot: pts = rot(pts, *grot)
            yield pts, True

def mark_polygon(svg):
    ribbons = []
    for pts, closed in strokes_from_svg(svg):
        if closed and pts[0] != pts[-1]:
            pts = pts + [pts[0]]
        line = LineString(pts)
        ribbons.append(line.buffer(STROKE / 2, cap_style='round', join_style='round', quad_segs=12))
    return unary_union(ribbons)

def to_mesh(poly):
    polys = list(poly.geoms) if poly.geom_type == 'MultiPolygon' else [poly]
    meshes = []
    for p in polys:
        p = p.simplify(0.02)
        meshes.append(trimesh.creation.extrude_polygon(p, THICK))
    m = trimesh.util.concatenate(meshes)
    # svg: x right, y down, badge centre (50,50). Badge units: width 1, Y up, front +Z.
    v = m.vertices.copy()
    x = (v[:, 0] - 50) / 100.0
    y = -(v[:, 1] - 50) / 100.0
    z = v[:, 2] / 100.0
    m.vertices = np.column_stack([x, y, z])
    m.fix_normals()
    return m

names = ['workouts', 'streak', 'volume', 'records', 'cycles', 'perfect_cycles', 'early_bird', 'night_owl', 'buddies', 'plan_uses']
scene = trimesh.Scene()
for n in names:
    poly = mark_polygon(os.path.join(SRC, f'{n}.svg'))
    mesh = to_mesh(poly)
    mesh.metadata['name'] = f'mark_{n}'
    mesh.export(os.path.join(OUT, f'mark_{n}.glb'))
    scene.add_geometry(mesh, node_name=f'mark_{n}', geom_name=f'mark_{n}')
    print(f'{n:15s} tris={len(mesh.faces):5d} watertight={mesh.is_watertight} size={os.path.getsize(os.path.join(OUT, f"mark_{n}.glb"))//1024}KB')
scene.export(os.path.join(OUT, 'marks_all.glb'))
print('all:', os.path.getsize(os.path.join(OUT, 'marks_all.glb')) // 1024, 'KB')
