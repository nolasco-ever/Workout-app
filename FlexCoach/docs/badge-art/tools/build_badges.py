"""
Build the FlexCoach badges in Blender, headless.

  Blender -b -P build_badges.py -- <art_dir> <out_dir> [render]

art_dir  docs/badge-art (shapes/*.svg, meshes/mark_*.glb)
out_dir  where the .glb files and preview renders go

Bodies come from the shape outlines (rim and face) as curves with extrude
and a rounded bevel. Marks are the mark meshes in relief on the face, with
rounded edges. Materials are Principled BSDF: metals and glossy gems.
Units: badge width 1, Y up, front +Z (glTF export converts from Blender's
Z-up scene).
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ART = argv[0]
OUT = argv[1]
RENDER = len(argv) > 2 and argv[2] == 'render'
ENV_MAP = argv[3] if len(argv) > 3 else None
os.makedirs(OUT, exist_ok=True)

SHAPES = ['medallion', 'hex', 'shield']
FAMILIES = ['workouts', 'streak', 'volume', 'records', 'cycles', 'perfect_cycles', 'early_bird', 'night_owl', 'buddies', 'plan_uses']
MARK_FIT = {'medallion': (1.0, 0.0), 'hex': (0.95, 0.0), 'shield': (0.86, 0.03)}  # scale, lift (badge units)

# Proportions, in badge units (badge width = 1)
RIM_H = 0.075       # rim top above the back
FACE_H = 0.055      # face top above the back
RIM_BEVEL = 0.016
FACE_BEVEL = 0.006
MARK_H = 0.012      # relief height above the face
MARK_BEVEL = 0.003

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)

# Stylised, not photoreal: broad soft highlights (higher roughness), a little less metallic, saturated colour.
BODY_MATERIALS = {
    'bronze':   dict(color='#C9762E', metallic=0.9, roughness=0.32),
    'silver':   dict(color='#B9C0CA', metallic=0.9, roughness=0.28),
    'gold':     dict(color='#F0B21A', metallic=0.9, roughness=0.28),
    'platinum': dict(color='#D9E1EA', metallic=0.9, roughness=0.26),
}
# Tier -> body material and the stones on the rim (None below tier 5).
TIERS = [
    ('bronze', None), ('silver', None), ('gold', None), ('platinum', None),
    ('platinum', 'ruby'), ('platinum', 'sapphire'), ('platinum', 'emerald'), ('platinum', 'diamond'),
]
TIER_NAMES = ['bronze', 'silver', 'gold', 'platinum', 'ruby', 'sapphire', 'emerald', 'diamond']
# Candy stones: bright, glossy, opaque.
STONES = {
    'ruby': '#D8143F', 'sapphire': '#1F56E0', 'emerald': '#12A35A', 'diamond': '#DDF3FF',
}
# One colour per family for the mark, so every badge reads at a glance.
MARK_COLORS = {
    'workouts': '#E8532B', 'streak': '#D7262A', 'volume': '#2F5C9E', 'records': '#D99400', 'cycles': '#15877A',
    'perfect_cycles': '#7E3FC9', 'early_bird': '#E9A800', 'night_owl': '#2E3FA8', 'buddies': '#D6388F', 'plan_uses': '#1E8BE0',
}
STONES_PER_SHAPE = {'medallion': 16, 'hex': 12, 'shield': 14}
STONE_R = 0.034

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def make_material(name, color, metallic, roughness, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hexrgb(color)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.05
    return m

def import_shape_curves(shape):
    """Import shapes/<shape>.svg; returns (rim_curve, face_curve) scaled to badge units, centred."""
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=os.path.join(ART, 'shapes', f'{shape}.svg'))
    new = [o for o in bpy.data.objects if o not in before]
    curves = [o for o in new if o.type == 'CURVE']
    # One object per path, or one object holding both splines: split by spline if needed.
    if len(curves) == 1 and len(curves[0].data.splines) >= 2:
        bpy.ops.object.select_all(action='DESELECT')
        curves[0].select_set(True)
        bpy.context.view_layer.objects.active = curves[0]
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.curve.select_all(action='DESELECT')
        curves[0].data.splines[0].bezier_points[0].select_control_point = True
        bpy.ops.curve.select_linked()
        bpy.ops.curve.separate()
        bpy.ops.object.mode_set(mode='OBJECT')
        curves = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
    def extent(o):
        pts = [o.matrix_world @ Vector((p.co.x, p.co.y, 0)) for sp in o.data.splines for p in sp.bezier_points]
        return (max(v.x for v in pts) - min(v.x for v in pts)) * (max(v.y for v in pts) - min(v.y for v in pts))
    curves.sort(key=extent, reverse=True)
    rim, face = curves[0], curves[1]
    rim.name, face.name = 'rim_curve', 'face_curve'
    return rim, face

def curve_to_solid(curve, height, bevel, name):
    """Extrude a closed curve into a solid with rounded top and bottom edges, as a mesh."""
    for s in curve.data.splines:
        s.use_cyclic_u = True
    curve.data.dimensions = '2D'
    curve.data.fill_mode = 'BOTH'
    curve.data.extrude = max(0.0, height / 2 - bevel)
    curve.data.bevel_depth = bevel
    curve.data.bevel_resolution = 4
    curve.data.resolution_u = 14
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = curve
    curve.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    # The curve sits at z=0 centred on its extrude; lift so the bottom is at z=0.
    for v in obj.data.vertices:
        v.co.z += height / 2
    return obj

def normalise_svg_import(objs):
    """Fit the rim's width to 1 badge unit and centre it on the origin, baking the transform into the control points."""
    rim = objs[0]
    def pts_of(o):
        return [o.matrix_world @ Vector((p.co.x, p.co.y, p.co.z)) for sp in o.data.splines for p in sp.bezier_points]
    xs = pts_of(rim)
    minx, maxx = min(v.x for v in xs), max(v.x for v in xs)
    miny, maxy = min(v.y for v in xs), max(v.y for v in xs)
    scale = 1.0 / (maxx - minx)
    cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
    for o in objs:
        mw = o.matrix_world.copy()
        for sp in o.data.splines:
            for p in sp.bezier_points:
                for attr in ('co', 'handle_left', 'handle_right'):
                    w = mw @ getattr(p, attr)
                    setattr(p, attr, Vector(((w.x - cx) * scale, (w.y - cy) * scale, 0.0)))
        o.matrix_world.identity()

def ring_from(rim, face):
    """A copy of the rim curve carrying the face outline as a hole, so it fills as a ring."""
    ring = rim.copy()
    ring.data = rim.data.copy()
    bpy.context.collection.objects.link(ring)
    for sp in face.data.splines:
        new = ring.data.splines.new('BEZIER')
        new.bezier_points.add(len(sp.bezier_points) - 1)
        for i, p in enumerate(sp.bezier_points):
            q = new.bezier_points[i]
            q.co, q.handle_left, q.handle_right = p.co.copy(), p.handle_left.copy(), p.handle_right.copy()
            q.handle_left_type = q.handle_right_type = 'FREE'
        new.use_cyclic_u = True
    return ring

def outline_points(curve, n):
    """n points evenly spaced by arc length along a closed bezier outline."""
    from mathutils.geometry import interpolate_bezier
    verts = []
    for sp in curve.data.splines:
        bp = sp.bezier_points
        for i in range(len(bp)):
            p0, p1 = bp[i], bp[(i + 1) % len(bp)]
            verts.extend(interpolate_bezier(p0.co, p0.handle_right, p1.handle_left, p1.co, 24)[:-1])
    pts = [Vector(v) for v in verts] + [Vector(verts[0])]
    seg = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
    total = sum(seg)
    out, acc, i = [], 0.0, 0
    for k in range(n):
        target = total * k / n
        while i < len(seg) - 1 and acc + seg[i] < target:
            acc += seg[i]; i += 1
        t = (target - acc) / seg[i] if seg[i] else 0
        out.append(pts[i].lerp(pts[i + 1], t))
    return out

def build_stones(rim_outline, shape):
    """A ring of round stones set into the rim band, as one mesh named `stones`."""
    n = STONES_PER_SHAPE[shape]
    pts = outline_points(rim_outline, n)
    stones = []
    for p in pts:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=STONE_R, segments=24, ring_count=12, location=(p.x * 0.895, p.y * 0.895, RIM_H - STONE_R * 0.25))
        o = bpy.context.view_layer.objects.active
        bpy.ops.object.shade_smooth()
        stones.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in stones: o.select_set(True)
    bpy.context.view_layer.objects.active = stones[0]
    bpy.ops.object.join()
    ring = bpy.context.view_layer.objects.active
    ring.name = 'stones'
    return ring

def build_body(shape):
    rim_outline, face = import_shape_curves(shape)
    normalise_svg_import([rim_outline, face])
    rim = ring_from(rim_outline, face)
    stones = build_stones(rim_outline, shape)
    bpy.data.objects.remove(rim_outline, do_unlink=True)
    print('DBG after normalise rim dims', tuple(round(d,4) for d in rim.dimensions), 'face', tuple(round(d,4) for d in face.dimensions))
    rim_solid = curve_to_solid(rim, RIM_H, RIM_BEVEL, 'rim')
    print('DBG rim solid dims', tuple(round(d,4) for d in rim_solid.dimensions))
    face_solid = curve_to_solid(face, FACE_H, FACE_BEVEL, 'face')
    print('DBG face solid dims', tuple(round(d,4) for d in face_solid.dimensions))
    # Join into one body.
    bpy.ops.object.select_all(action='DESELECT')
    rim_solid.select_set(True); face_solid.select_set(True)
    bpy.context.view_layer.objects.active = rim_solid
    bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active
    body.name = 'body'
    bpy.ops.object.shade_smooth()
    print(f'BODY {shape} dims', tuple(round(d, 3) for d in body.dimensions))
    return body, stones

def import_mark(family, shape):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ART, 'meshes', f'mark_{family}.glb'))
    new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in new:
        o.select_set(True)
    bpy.context.view_layer.objects.active = new[0]
    if len(new) > 1:
        bpy.ops.object.join()
    mark = bpy.context.view_layer.objects.active
    mark.name = f'mark_{family}'
    # glTF import converts to Blender Z-up: bake the import transform, then the mark's thickness runs along +Z.
    mw = mark.matrix_world.copy()
    for v in mark.data.vertices:
        w = mw @ v.co
        # The importer maps glTF Y-up to Blender Z-up, which stands the mark upright; lay it back flat with its thickness along +Z.
        v.co = Vector((w.x, w.z, -w.y))
    mark.matrix_world.identity()
    # Thickness in the mesh is 0.02; scale it to the relief height and sit it on the face.
    scale, lift = MARK_FIT[shape]
    zs = [v.co.z for v in mark.data.vertices]
    zmin, thick = min(zs), max(zs) - min(zs)
    for v in mark.data.vertices:
        v.co = Vector((v.co.x * scale, v.co.y * scale + lift, (v.co.z - zmin) * (MARK_H / thick) + FACE_H - 0.001))
    bev = mark.modifiers.new('bevel', 'BEVEL')
    bev.width = MARK_BEVEL
    bev.segments = 2
    bev.limit_method = 'ANGLE'
    bev.angle_limit = math.radians(40)
    bpy.context.view_layer.objects.active = mark
    bpy.ops.object.modifier_apply(modifier='bevel')
    bpy.ops.object.shade_smooth()
    return mark

def set_material(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def export_glb(objs, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)

def setup_render(size=480):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.cycles.device = 'CPU'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.film_transparent = False
    world = bpy.data.worlds.new('studio')
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes['Background']
    hdri = ENV_MAP
    if hdri and os.path.exists(hdri):
        env = nt.nodes.new('ShaderNodeTexEnvironment')
        env.image = bpy.data.images.load(hdri)
        nt.links.new(env.outputs['Color'], bg.inputs['Color'])
        bg.inputs['Strength'].default_value = 0.55
        # The badge sits on a dark ground; the environment lights it but isn't seen behind it.
        scene.render.film_transparent = True
    else:
        bg.inputs['Color'].default_value = (0.08, 0.08, 0.09, 1)
        bg.inputs['Strength'].default_value = 1.0
    # Three-point studio: a big soft key, a cool rim, a fill.
    def light(name, kind, loc, energy, size=1.0, color=(1, 1, 1)):
        d = bpy.data.lights.new(name, kind)
        d.energy = energy
        d.color = color
        if kind == 'AREA':
            d.size = size
        o = bpy.data.objects.new(name, d)
        bpy.context.collection.objects.link(o)
        o.location = loc
        o.rotation_euler = (Vector(loc) * -1).to_track_quat('-Z', 'Y').to_euler()
        return o
    light('key', 'AREA', (-1.2, -1.6, 2.2), 110, 1.6, (1.0, 0.96, 0.9))
    light('rim', 'AREA', (1.6, 1.2, 1.4), 60, 1.0, (0.85, 0.92, 1.0))
    light('fill', 'AREA', (1.4, -1.4, 0.9), 25, 2.0)
    cam_data = bpy.data.cameras.new('cam')
    cam_data.lens = 55
    cam = bpy.data.objects.new('cam', cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    return cam

def aim(cam, loc, target=(0, 0, 0.04)):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

def render_to(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

# ---------------------------------------------------------------- build
clear_scene()
body_mats = {k: make_material(k, v['color'], v['metallic'], v['roughness']) for k, v in BODY_MATERIALS.items()}
stone_mats = {k: make_material(f'stone_{k}', v, 0.0, 0.1, coat=0.4) for k, v in STONES.items()}
mark_mats = {k: make_material(f'mark_{k}', v, 0.0, 0.45) for k, v in MARK_COLORS.items()}

def dress(shape, tier, family):
    """Give the objects of `shape` the materials for `tier` and show only `family`'s mark."""
    body_name, stone_name = TIERS[tier - 1]
    body = bpy.data.objects[f'{shape}__body']
    stones = bpy.data.objects[f'{shape}__stones']
    set_material(body, body_mats[body_name])
    body.hide_render = False
    stones.hide_render = stone_name is None
    if stone_name: set_material(stones, stone_mats[stone_name])
    for f in FAMILIES:
        m = bpy.data.objects[f'{shape}__mark_{f}']
        m.hide_render = f != family
        set_material(m, mark_mats[f])
    return body, stones, bpy.data.objects[f'{shape}__mark_{family}']

for shape in SHAPES:
    body, stones = build_body(shape)
    marks = [import_mark(f, shape) for f in FAMILIES]
    set_material(body, body_mats['bronze'])
    set_material(stones, stone_mats['ruby'])
    for m in marks:
        set_material(m, mark_mats[m.name.replace('mark_', '')])
    export_glb([body, stones] + marks, os.path.join(OUT, f'{shape}.glb'))
    for o in [body, stones] + marks:
        o.name = f'{shape}__{o.name}'
        o.hide_render = True
        o.hide_viewport = True

if RENDER:
    cam = setup_render()
    front, low = (0.0, -1.35, 1.1), (0.9, -1.1, 0.35)
    shots = [  # (tier, family, camera)
        (1, 'workouts', front), (2, 'streak', front), (3, 'records', front), (4, 'cycles', front),
        (5, 'volume', front), (6, 'night_owl', front), (7, 'early_bird', front), (8, 'perfect_cycles', front),
        (1, 'buddies', low), (3, 'plan_uses', low), (5, 'streak', low), (8, 'workouts', low),
    ]
    for i, (tier, family, loc) in enumerate(shots):
        for o in bpy.data.objects:
            if '__' in o.name: o.hide_render = True
        shape = ['medallion'] * 3 + ['hex'] * 4 + ['shield']
        shape = shape[tier - 1]
        dress(shape, tier, family)
        aim(cam, tuple(c * 1.45 for c in loc))
        render_to(os.path.join(OUT, f'shot_{i:02d}_{shape}_{TIER_NAMES[tier - 1]}_{family}.png'))

# ---------------------------------------------------------------- turntable
if RENDER and len(argv) > 4 and argv[4] == 'turntable':
    for o in bpy.data.objects:
        if '__' in o.name: o.hide_render = True
    body, stones, mark = dress('hex', 6, 'night_owl')
    pivot = bpy.data.objects.new('pivot', None)
    bpy.context.collection.objects.link(pivot)
    for o in (body, stones, mark): o.parent = pivot
    bpy.context.scene.render.resolution_x = 420
    bpy.context.scene.render.resolution_y = 420
    bpy.context.scene.cycles.samples = 48
    aim(cam, (0.0, -1.9, 1.15), target=(0, 0, 0.04))
    frames = 36
    for i in range(frames):
        pivot.rotation_euler = (0, math.radians(360 * i / frames), 0)
        render_to(os.path.join(OUT, f'turn_{i:02d}.png'))
