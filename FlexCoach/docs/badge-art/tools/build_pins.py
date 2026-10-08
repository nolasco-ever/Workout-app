"""
Build the FlexCoach badges as enamel pins, in Blender, headless.

  Blender -b -P build_pins.py -- <art_dir> <out_dir> [render [env.exr [turntable]]]

An enamel pin: a thin metal plate, gently bowed, with a raised metal
border, the mark as raised metal lines, and glossy enamel filling the face
between them. Metal = the tier (bronze, silver, gold, platinum); stones on
the border for tiers 5-8. Units: badge width 1, Y up, front +Z on export.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector
from mathutils.geometry import interpolate_bezier

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ART, OUT = argv[0], argv[1]
RENDER = len(argv) > 2 and argv[2] == 'render'
ENV_MAP = argv[3] if len(argv) > 3 else None
TURNTABLE = len(argv) > 4 and argv[4] == 'turntable'
os.makedirs(OUT, exist_ok=True)

SHAPES = ['medallion', 'hex', 'shield']
FAMILIES = ['workouts', 'streak', 'volume', 'records', 'cycles', 'perfect_cycles', 'early_bird', 'night_owl', 'buddies', 'plan_uses']
MARK_FIT = {'medallion': (1.0, 0.0), 'hex': (1.0, 0.0), 'shield': (0.9, 0.03)}

# Proportions, in badge units (badge width = 1)
PLATE_T = 0.028      # the metal plate
PLATE_BEVEL = 0.006
BORDER_IN = 0.90     # inner edge of the metal border, as a scale of the outline
WALL_H = 0.007       # border and mark lines stand this far above the plate
WALL_BEVEL = 0.0035
ENAMEL_T = 0.0045    # enamel sits this far above the plate; the lines stand only a hair above it
BOW = 0.15           # the whole plate bows up by this much at the centre
STONE_R = 0.022
STONES_PER_SHAPE = {'medallion': 16, 'hex': 12, 'shield': 14}

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)

METALS = {
    'bronze':   dict(color='#CF8343', metallic=1.0, roughness=0.32),
    'silver':   dict(color='#C9CFD8', metallic=1.0, roughness=0.28),
    'gold':     dict(color='#F3C244', metallic=1.0, roughness=0.28),
    'platinum': dict(color='#E2E9F0', metallic=1.0, roughness=0.24),
}
TIERS = [('bronze', None), ('silver', None), ('gold', None), ('platinum', None),
         ('platinum', 'ruby'), ('platinum', 'sapphire'), ('platinum', 'emerald'), ('platinum', 'diamond')]
TIER_NAMES = ['bronze', 'silver', 'gold', 'platinum', 'ruby', 'sapphire', 'emerald', 'diamond']
STONES = {'ruby': '#E0163F', 'sapphire': '#2458E6', 'emerald': '#17A85C', 'diamond': '#E6F6FF'}
# Enamel fills to compare: one graphite for all, the brand orange, or a colour per family.
ENAMEL = {
    'black': '#0A0A0C',
    'orange': '#A83A12',
}
FAMILY_ENAMEL = {
    'workouts': '#E2602A', 'streak': '#D7262A', 'volume': '#2F5C9E', 'records': '#D99400', 'cycles': '#15877A',
    'perfect_cycles': '#7E3FC9', 'early_bird': '#E9A800', 'night_owl': '#2E3FA8', 'buddies': '#D6388F', 'plan_uses': '#1E8BE0',
}

def make_material(name, color, metallic, roughness, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = hexrgb(color)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = roughness
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.08
    if metallic == 0.0:
        b.inputs['Specular IOR Level'].default_value = 0.35
    return m

# ---------------------------------------------------------------- curves
def import_shape_curves(shape):
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=os.path.join(ART, 'shapes', f'{shape}.svg'))
    curves = [o for o in bpy.data.objects if o not in before and o.type == 'CURVE']
    def extent(o):
        pts = [o.matrix_world @ p.co for sp in o.data.splines for p in sp.bezier_points]
        return (max(v.x for v in pts) - min(v.x for v in pts)) * (max(v.y for v in pts) - min(v.y for v in pts))
    curves.sort(key=extent, reverse=True)
    rim, face = curves[0], curves[1]
    # Fit the rim's width to 1 and centre it, baking into the control points.
    pts = [rim.matrix_world @ p.co for sp in rim.data.splines for p in sp.bezier_points]
    minx, maxx = min(v.x for v in pts), max(v.x for v in pts)
    miny, maxy = min(v.y for v in pts), max(v.y for v in pts)
    scale = 1.0 / (maxx - minx); cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
    for o in (rim, face):
        mw = o.matrix_world.copy()
        for sp in o.data.splines:
            sp.use_cyclic_u = True
            for p in sp.bezier_points:
                for attr in ('co', 'handle_left', 'handle_right'):
                    w = mw @ getattr(p, attr)
                    setattr(p, attr, Vector(((w.x - cx) * scale, (w.y - cy) * scale, 0.0)))
        o.matrix_world.identity()
    bpy.data.objects.remove(face, do_unlink=True)   # the pin's border is narrower than the SVG face; we scale the rim instead
    return rim

def scaled_copy(curve, k, name):
    c = curve.copy(); c.data = curve.data.copy(); c.name = name
    bpy.context.collection.objects.link(c)
    for sp in c.data.splines:
        for p in sp.bezier_points:
            for attr in ('co', 'handle_left', 'handle_right'):
                v = getattr(p, attr); setattr(p, attr, Vector((v.x * k, v.y * k, 0.0)))
    return c

def with_hole(outer, inner, name):
    c = outer.copy(); c.data = outer.data.copy(); c.name = name
    bpy.context.collection.objects.link(c)
    for sp in inner.data.splines:
        new = c.data.splines.new('BEZIER'); new.bezier_points.add(len(sp.bezier_points) - 1)
        for i, p in enumerate(sp.bezier_points):
            q = new.bezier_points[i]; q.co, q.handle_left, q.handle_right = p.co.copy(), p.handle_left.copy(), p.handle_right.copy()
            q.handle_left_type = q.handle_right_type = 'FREE'
        new.use_cyclic_u = True
    return c

def solid(curve, z0, height, bevel, name):
    """Extrude a closed outline (with holes) into a solid from z0 to z0+height with rounded edges."""
    curve.data.dimensions = '2D'; curve.data.fill_mode = 'BOTH'
    curve.data.extrude = max(0.0, height / 2 - bevel); curve.data.bevel_depth = bevel
    curve.data.bevel_resolution = 3; curve.data.resolution_u = 12
    bpy.ops.object.select_all(action='DESELECT'); curve.select_set(True); bpy.context.view_layer.objects.active = curve
    bpy.ops.object.convert(target='MESH')
    o = bpy.context.view_layer.objects.active; o.name = name
    for v in o.data.vertices: v.co.z += z0 + height / 2
    bpy.ops.object.shade_smooth()
    return o

def outline_points(curve, n):
    verts = []
    for sp in curve.data.splines:
        bp = sp.bezier_points
        for i in range(len(bp)):
            p0, p1 = bp[i], bp[(i + 1) % len(bp)]
            verts.extend(interpolate_bezier(p0.co, p0.handle_right, p1.handle_left, p1.co, 24)[:-1])
    pts = [Vector(v) for v in verts] + [Vector(verts[0])]
    seg = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
    total = sum(seg); out, acc, i = [], 0.0, 0
    for k in range(n):
        target = total * k / n
        while i < len(seg) - 1 and acc + seg[i] < target: acc += seg[i]; i += 1
        out.append(pts[i].lerp(pts[i + 1], (target - acc) / seg[i] if seg[i] else 0))
    return out

# ---------------------------------------------------------------- the bow
def bow(x, y):
    """How far up the pin curves at (x, y): a shallow cap, highest at the centre."""
    d2 = (x * x + y * y) / 0.25
    return BOW * (1.0 - min(1.0, d2))

def apply_bow(obj):
    for v in obj.data.vertices:
        v.co.z += bow(v.co.x, v.co.y)

# ---------------------------------------------------------------- build
def build(shape):
    rim = import_shape_curves(shape)
    inner = scaled_copy(rim, BORDER_IN, 'inner')
    plate = solid(scaled_copy(rim, 1.0, 'plate_c'), 0.0, PLATE_T, PLATE_BEVEL, 'plate')
    border = solid(with_hole(rim, inner, 'border_c'), PLATE_T - 0.002, WALL_H + 0.002, WALL_BEVEL, 'border')
    enamel = solid(scaled_copy(inner, 0.995, 'enamel_c'), PLATE_T - 0.002, ENAMEL_T + 0.002, 0.001, 'enamel')
    # Stones sit on the border.
    pts = outline_points(rim, STONES_PER_SHAPE[shape])
    stones = []
    for p in pts:
        sx, sy = p.x * (1 + BORDER_IN) / 2, p.y * (1 + BORDER_IN) / 2
        bpy.ops.mesh.primitive_uv_sphere_add(radius=STONE_R, segments=20, ring_count=10, location=(sx, sy, PLATE_T + WALL_H - STONE_R * 0.6))
        o = bpy.context.view_layer.objects.active; bpy.ops.object.shade_smooth(); stones.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in stones: o.select_set(True)
    bpy.context.view_layer.objects.active = stones[0]; bpy.ops.object.join()
    stones = bpy.context.view_layer.objects.active; stones.name = 'stones'
    for c in (rim, inner):
        bpy.data.objects.remove(c, do_unlink=True)
    # Marks: raised metal lines on the enamel.
    marks = []
    for f in FAMILIES:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(ART, 'meshes', f'mark_{f}.glb'))
        new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
        bpy.ops.object.select_all(action='DESELECT')
        for o in new: o.select_set(True)
        bpy.context.view_layer.objects.active = new[0]
        if len(new) > 1: bpy.ops.object.join()
        m = bpy.context.view_layer.objects.active; m.name = f'mark_{f}'
        mw = m.matrix_world.copy()
        for v in m.data.vertices:
            w = mw @ v.co; v.co = Vector((w.x, w.z, -w.y))
        m.matrix_world.identity()
        k, lift = MARK_FIT[shape]
        zs = [v.co.z for v in m.data.vertices]; zmin, thick = min(zs), max(zs) - min(zs)
        for v in m.data.vertices:
            v.co = Vector((v.co.x * k, v.co.y * k + lift, (v.co.z - zmin) * ((WALL_H + 0.002) / thick) + PLATE_T - 0.002))
        bev = m.modifiers.new('bevel', 'BEVEL'); bev.width = WALL_BEVEL; bev.segments = 2; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(40)
        bpy.context.view_layer.objects.active = m; bpy.ops.object.modifier_apply(modifier='bevel'); bpy.ops.object.shade_smooth()
        marks.append(m)
    parts = [plate, border, enamel, stones] + marks
    for o in parts: apply_bow(o)
    return plate, border, enamel, stones, marks

def set_material(obj, mat):
    obj.data.materials.clear(); obj.data.materials.append(mat)

def export_glb(objs, path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)

# ---------------------------------------------------------------- render
def setup_render(size=480):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'; scene.cycles.samples = 64; scene.cycles.use_denoising = True; scene.cycles.device = 'CPU'
    scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Punchy'
    scene.render.resolution_x = size; scene.render.resolution_y = size
    scene.render.film_transparent = True
    world = bpy.data.worlds.new('studio'); scene.world = world; world.use_nodes = True
    nt = world.node_tree; bg = nt.nodes['Background']
    if ENV_MAP and os.path.exists(ENV_MAP):
        env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(ENV_MAP)
        nt.links.new(env.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.35
    else:
        bg.inputs['Color'].default_value = (0.1, 0.1, 0.11, 1)
    def light(name, loc, energy, size, color=(1, 1, 1)):
        d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size; d.color = color
        o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc
        o.rotation_euler = (Vector(loc) * -1).to_track_quat('-Z', 'Y').to_euler()
    light('key', (-1.0, -1.4, 2.4), 90, 2.0, (1.0, 0.97, 0.92))
    light('rim', (1.5, 1.0, 1.4), 50, 1.2, (0.9, 0.94, 1.0))
    light('fill', (1.4, -1.4, 0.8), 25, 2.0)
    cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 55
    cam = bpy.data.objects.new('cam', cam_data); bpy.context.collection.objects.link(cam); scene.camera = cam
    return cam

def aim(cam, loc, target=(0, 0, 0.05)):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

def render_to(path):
    bpy.context.scene.render.filepath = path; bpy.ops.render.render(write_still=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
metal_mats = {k: make_material(k, v['color'], v['metallic'], v['roughness']) for k, v in METALS.items()}
stone_mats = {k: make_material(f'stone_{k}', v, 0.0, 0.15, coat=1.0) for k, v in STONES.items()}
enamel_mats = {k: make_material(f'enamel_{k}', v, 0.0, 0.5, coat=0.1) for k, v in ENAMEL.items()}
family_enamel = {k: make_material(f'enamel_{k}', v, 0.0, 0.42, coat=0.12) for k, v in FAMILY_ENAMEL.items()}

built = {}
for shape in SHAPES:
    plate, border, enamel, stones, marks = build(shape)
    set_material(plate, metal_mats['bronze']); set_material(border, metal_mats['bronze']); set_material(enamel, enamel_mats['black']); set_material(stones, stone_mats['ruby'])
    for m in marks: set_material(m, metal_mats['bronze'])
    export_glb([plate, border, enamel, stones] + marks, os.path.join(OUT, f'{shape}.glb'))
    for o in [plate, border, enamel, stones] + marks:
        o.name = f'{shape}__{o.name}'; o.hide_render = True
    built[shape] = True

def dress(shape, tier, family, enamel_key):
    metal, stone = TIERS[tier - 1]
    for o in bpy.data.objects:
        if '__' in o.name: o.hide_render = True
    g = lambda n: bpy.data.objects[f'{shape}__{n}']
    for n in ('plate', 'border'):
        set_material(g(n), metal_mats[metal]); g(n).hide_render = False
    set_material(g('enamel'), family_enamel[family] if enamel_key == 'family' else enamel_mats[enamel_key]); g('enamel').hide_render = False
    g('stones').hide_render = stone is None
    if stone: set_material(g('stones'), stone_mats[stone])
    m = g(f'mark_{family}'); set_material(m, metal_mats[metal]); m.hide_render = False
    return [g('plate'), g('border'), g('enamel'), g('stones'), m]

shape_of = lambda tier: (['medallion'] * 3 + ['hex'] * 4 + ['shield'])[tier - 1]

if RENDER:
    cam = setup_render()
    front, low = (0.0, -1.35, 1.1), (0.9, -1.1, 0.35)
    shots = [
        (1, 'workouts', 'black', front), (2, 'streak', 'black', front), (3, 'records', 'black', front), (4, 'cycles', 'black', front),
        (5, 'volume', 'black', front), (6, 'night_owl', 'black', front), (7, 'early_bird', 'black', front), (8, 'perfect_cycles', 'black', front),
        (1, 'workouts', 'orange', front), (3, 'records', 'orange', front), (6, 'night_owl', 'orange', front), (8, 'perfect_cycles', 'orange', front),
        (1, 'buddies', 'black', low), (3, 'plan_uses', 'orange', low), (5, 'streak', 'black', low), (8, 'workouts', 'orange', low),
    ]
    for i, (tier, family, enamel_key, loc) in enumerate(shots):
        dress(shape_of(tier), tier, family, enamel_key)
        aim(cam, tuple(c * 1.45 for c in loc))
        render_to(os.path.join(OUT, f'shot_{i:02d}_{TIER_NAMES[tier - 1]}_{enamel_key}_{family}.png'))
    if TURNTABLE:
        objs = dress('hex', 6, 'night_owl', 'black')
        pivot = bpy.data.objects.new('pivot', None); bpy.context.collection.objects.link(pivot)
        for o in objs: o.parent = pivot
        bpy.context.scene.render.resolution_x = bpy.context.scene.render.resolution_y = 420
        bpy.context.scene.cycles.samples = 48
        aim(cam, (0.0, -1.9, 1.15), target=(0, 0, 0.05))
        for i in range(36):
            pivot.rotation_euler = (0, math.radians(360 * i / 36), 0)
            render_to(os.path.join(OUT, f'turn_{i:02d}.png'))
print('done')
