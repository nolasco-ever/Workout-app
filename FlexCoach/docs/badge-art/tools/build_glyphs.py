"""Glyph meshes for the date engraved on a badge's back at runtime: 0-9 and A-Z from the app's font.
   python build_glyphs.py <out_dir>  ->  <char>.glb per glyph (cap height 1, baseline at y=0, pre-mirrored to read from the back,
   extruded 0..-0.08 so it stands proud of a back face at z=0 toward -Z) and glyphs.json with advances."""
import json, os, sys
import numpy as np
from shapely.geometry import Polygon
from shapely import affinity
from shapely.ops import unary_union
import trimesh
from trimesh.visual.material import PBRMaterial
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from svgpathtools import parse_path
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
FONT = '/Users/evernolasco/Documents/GitHub/FlexCoachApp/FlexCoach/FlexCoach/assets/fonts/Sora-SemiBold.ttf'
font = TTFont(FONT); glyphs = font.getGlyphSet(); cmap = font.getBestCmap(); upm = font['head'].unitsPerEm
cap = getattr(font['OS/2'], 'sCapHeight', 0) or upm * 0.7
k = 1.0 / cap
DEPTH = 0.08
def subpaths(d):
    out = []
    for sub in parse_path(d).continuous_subpaths():
        pts = []
        for seg in sub:
            n = 1 if seg.__class__.__name__ == 'Line' else 10
            pts += [(seg.point(i / n).real, seg.point(i / n).imag) for i in range(n)]
        out.append(pts)
    return out
def tri(poly, z, up):
    out = []
    for q in (poly.geoms if hasattr(poly, 'geoms') else [poly]):
        if q.area < 1e-6: continue
        v2, f = trimesh.creation.triangulate_polygon(q)
        a, b, c = v2[f[:, 0]], v2[f[:, 1]], v2[f[:, 2]]
        signed = (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0])
        wrong = (signed < 0) if up else (signed > 0); f = f.copy(); f[wrong] = f[wrong][:, ::-1]
        out.append(trimesh.Trimesh(np.column_stack([v2, np.full(len(v2), z)]), f, process=False))
    return out
def walls(poly, z0, z1):
    from shapely.geometry.polygon import orient
    out = []
    for q in (poly.geoms if hasattr(poly, 'geoms') else [poly]):
        q = orient(q, 1.0)
        for ring in [q.exterior, *q.interiors]:
            pts = np.array(ring.coords[:-1]); n = len(pts)
            v = np.vstack([np.column_stack([pts, np.full(n, z0)]), np.column_stack([pts, np.full(n, z1)])])
            f = []
            for i in range(n):
                j = (i + 1) % n; f += [[i, j, n + j], [i, n + j, n + i]]
            out.append(trimesh.Trimesh(v, np.array(f), process=False))
    return out
meta = {'capHeight': 1.0, 'advances': {}, 'space': glyphs[cmap[ord(' ')]].width * k if ord(' ') in cmap else 0.3}
mat = PBRMaterial(name='glyph', baseColorFactor=[0.3, 0.3, 0.3, 1.0], metallicFactor=1.0, roughnessFactor=0.55)
for ch in '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    g = glyphs[cmap[ord(ch)]]; pen = SVGPathPen(glyphs); g.draw(pen); d = pen.getCommands()
    meta['advances'][ch] = g.width * k
    shape = None
    for pts in subpaths(d):
        if len(pts) < 3: continue
        c = Polygon(pts).buffer(0)
        if c.is_empty: continue
        shape = c if shape is None else shape.symmetric_difference(c)
    if shape is None or shape.is_empty: continue
    shape = affinity.scale(shape, xfact=-k, yfact=k, origin=(0, 0))          # font units -> cap height 1, mirrored to read from the back
    shape = affinity.translate(shape, g.width * k, 0)                        # mirrored glyph sits in [0, advance] again
    # z: the back face of the badge is at z=0 and faces -Z; the glyph stands proud toward -Z. Winding: the -Z face must face -Z.
    parts = tri(shape, 0.0, up=True) + walls(shape, -DEPTH, 0.0) + tri(shape, -DEPTH, up=False)
    m = trimesh.util.concatenate(parts)
    # walls were built for +Z-up winding on an interval [z0,z1] with z0<z1: that is outward already; caps: +Z cap faces +Z (hidden against the plate), -Z cap faces -Z.
    m.visual = trimesh.visual.TextureVisuals(material=mat)
    sc = trimesh.Scene(); sc.add_geometry(m, node_name='glyph', geom_name='glyph')
    sc.export(os.path.join(OUT, f'{ch}.glb'))
json.dump(meta, open(os.path.join(OUT, 'glyphs.json'), 'w'), indent=1)
print('glyphs', len(meta['advances']), 'space', round(meta['space'], 3))
