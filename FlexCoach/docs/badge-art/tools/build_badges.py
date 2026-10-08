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

MATERIALS = {
    'bronze':   dict(color='#C9843F', metallic=1.0, roughness=0.30, gem=False),
    'silver':   dict(color='#C7CAD2', metallic=1.0, roughness=0.22, gem=False),
    'gold':     dict(color='#F0C449', metallic=1.0, roughness=0.24, gem=False),
    'platinum': dict(color='#DCE4EB', metallic=1.0, roughness=0.18, gem=False),
    'ruby':     dict(color='#B8203F', metallic=0.0, roughness=0.05, gem=True),
    'sapphire': dict(color='#2A55C4', metallic=0.0, roughness=0.05, gem=True),
    'emerald':  dict(color='#1E8F5E', metallic=0.0, roughness=0.05, gem=True),
    'diamond':  dict(color='#BFE0F7', metallic=0.0, roughness=0.02, gem=True),
}
MARK_TONE = {  # the relief, a darker tone of the material
    'bronze': '#5E3512', 'silver': '#5B5F69', 'gold': '#7A540F', 'platinum': '#62737F',
    'ruby': '#7E0B24', 'sapphire': '#143693', 'emerald': '#0C633F', 'diamond': '#4A86B3',
}

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def make_material(name, color, metallic, roughness, gem):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hexrgb(color)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if gem:
        bsdf.inputs['Transmission Weight'].default_value = 0.65
        bsdf.inputs['IOR'].default_value = 1.75
        bsdf.inputs['Coat Weight'].default_value = 0.6
        bsdf.inputs['Coat Roughness'].default_value = 0.03
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

def build_body(shape):
    rim_outline, face = import_shape_curves(shape)
    normalise_svg_import([rim_outline, face])
    rim = ring_from(rim_outline, face)
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
    return body

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
        bg.inputs['Strength'].default_value = 1.0
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
    light('key', 'AREA', (-1.2, -1.6, 2.2), 180, 1.6, (1.0, 0.96, 0.9))
    light('rim', 'AREA', (1.6, 1.2, 1.4), 90, 1.0, (0.85, 0.92, 1.0))
    light('fill', 'AREA', (1.4, -1.4, 0.9), 40, 2.0)
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
mats = {k: make_material(k, **v) for k, v in MATERIALS.items()}
tones = {k: make_material(f'{k}_mark', v, 1.0 if not MATERIALS[k]['gem'] else 0.0, 0.35, False) for k, v in MARK_TONE.items()}

for shape in SHAPES:
    body = build_body(shape)
    marks = [import_mark(f, shape) for f in FAMILIES]
    set_material(body, mats['bronze'])
    for m in marks:
        set_material(m, tones['bronze'])
    export_glb([body] + marks, os.path.join(OUT, f'{shape}.glb'))
    # Keep the objects around for rendering; hide marks except one per render.
    for o in [body] + marks:
        o.name = f'{shape}__{o.name}'
        o.hide_render = True
        o.hide_viewport = True

if RENDER:
    cam = setup_render()
    shots = [  # (shape, material, family, camera)
        ('medallion', 'bronze', 'workouts', (0.0, -1.35, 1.1)),
        ('medallion', 'silver', 'streak', (0.0, -1.35, 1.1)),
        ('medallion', 'gold', 'records', (0.0, -1.35, 1.1)),
        ('hex', 'platinum', 'cycles', (0.0, -1.35, 1.1)),
        ('hex', 'ruby', 'volume', (0.0, -1.35, 1.1)),
        ('hex', 'sapphire', 'night_owl', (0.0, -1.35, 1.1)),
        ('hex', 'emerald', 'early_bird', (0.0, -1.35, 1.1)),
        ('shield', 'diamond', 'perfect_cycles', (0.0, -1.35, 1.1)),
        ('medallion', 'bronze', 'buddies', (0.9, -1.1, 0.35)),   # low angle, shows the bevel and relief
        ('medallion', 'gold', 'plan_uses', (-0.9, -1.0, 0.5)),
        ('hex', 'ruby', 'streak', (0.9, -1.1, 0.35)),
        ('shield', 'diamond', 'workouts', (0.9, -1.1, 0.35)),
    ]
    for i, (shape, material, family, loc) in enumerate(shots):
        for o in bpy.data.objects:
            if '__' in o.name:
                o.hide_render = True
        body = bpy.data.objects[f'{shape}__body']
        mark = bpy.data.objects[f'{shape}__mark_{family}']
        set_material(body, mats[material]); set_material(mark, tones[material])
        body.hide_render = False; mark.hide_render = False
        aim(cam, tuple(c * 1.45 for c in loc))
        render_to(os.path.join(OUT, f'shot_{i:02d}_{shape}_{material}_{family}.png'))
print('done')

# ---------------------------------------------------------------- turntable
if RENDER and len(argv) > 4 and argv[4] == 'turntable':
    shape, material, family = 'medallion', 'gold', 'records'
    for o in bpy.data.objects:
        if '__' in o.name:
            o.hide_render = True
    body = bpy.data.objects[f'{shape}__body']
    mark = bpy.data.objects[f'{shape}__mark_{family}']
    set_material(body, mats[material]); set_material(mark, tones[material])
    body.hide_render = False; mark.hide_render = False
    pivot = bpy.data.objects.new('pivot', None)
    bpy.context.collection.objects.link(pivot)
    body.parent = pivot; mark.parent = pivot
    bpy.context.scene.render.resolution_x = 420
    bpy.context.scene.render.resolution_y = 420
    bpy.context.scene.cycles.samples = 48
    aim(cam, (0.0, -1.9, 1.15), target=(0, 0, 0.04))
    frames = 36
    for i in range(frames):
        pivot.rotation_euler = (0, math.radians(360 * i / frames), 0)
        render_to(os.path.join(OUT, f'turn_{i:02d}.png'))
