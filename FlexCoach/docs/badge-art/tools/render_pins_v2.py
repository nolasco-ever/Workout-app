"""Render every badge from the tier .glb files.  Blender -b -P render_pins_v2.py -- <glb_dir> <out_dir> <env.exr>"""
import bpy, json, math, os, sys
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
GLB, OUT, ENV = argv[0], argv[1], argv[2]
os.makedirs(OUT, exist_ok=True)
M = json.load(open(os.path.join(GLB, 'manifest.json')))
FAMILIES, LADDER, TIERS = M['families'], M['ladder'], M['tiers']

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'; scene.cycles.samples = 64; scene.cycles.use_denoising = True; scene.cycles.device = 'CPU'
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'
scene.render.resolution_x = scene.render.resolution_y = 480
scene.render.film_transparent = True
world = bpy.data.worlds.new('studio'); scene.world = world; world.use_nodes = True
nt = world.node_tree; bg = nt.nodes['Background']
if ENV != 'none':
    env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(ENV)
    nt.links.new(env.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.6
else:
    bg.inputs['Color'].default_value = (0.16, 0.16, 0.17, 1); bg.inputs['Strength'].default_value = 1.0
scene.view_settings.exposure = 0.0
# A softbox overhead: a large emissive plane the metals reflect as a broad highlight.
bpy.ops.mesh.primitive_plane_add(size=2.6, location=(-0.4, -0.6, 2.2))
soft = bpy.context.view_layer.objects.active; soft.name = 'softbox'
soft.rotation_euler = (math.radians(12), math.radians(-8), 0)
sm = bpy.data.materials.new('softbox'); sm.use_nodes = True
em = sm.node_tree.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 3.8; em.inputs['Color'].default_value = (1.0, 0.98, 0.95, 1)
sm.node_tree.links.new(em.outputs['Emission'], sm.node_tree.nodes['Material Output'].inputs['Surface'])
soft.data.materials.append(sm); soft.visible_camera = False
def light(name, loc, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(loc) * -1).to_track_quat('-Z', 'Y').to_euler()
light('key', (-1.2, -1.6, 2.0), 150, 0.3, (1.0, 0.97, 0.92)); light('rim', (1.6, 1.3, 1.2), 120, 0.4, (0.85, 0.92, 1.0)); light('rim2', (-1.7, 1.0, 0.9), 70, 0.5, (1.0, 0.9, 0.8)); light('fill', (1.4, -1.6, 0.9), 20, 2.5)
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 60
cam = bpy.data.objects.new('cam', cam_data); bpy.context.collection.objects.link(cam); scene.camera = cam
def aim(loc, target=(0, 0, 0.02)):
    cam.location = loc; cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

def shade(mat):
    """Keep the flat base colour from the file; set the shader by material role."""
    mat.use_nodes = True
    b = mat.node_tree.nodes.get('Principled BSDF')
    if not b: return
    n = mat.name.split('.')[0]
    if n in ('metal', 'mark'):
        b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.2
    elif n.startswith('enamel'):
        b.inputs['Metallic'].default_value = 0.0; b.inputs['Roughness'].default_value = 0.55; b.inputs['Coat Weight'].default_value = 0.06; b.inputs['Coat Roughness'].default_value = 0.1; b.inputs['Specular IOR Level'].default_value = 0.08
    elif n == 'stone':
        b.inputs['Metallic'].default_value = 0.0; b.inputs['Roughness'].default_value = 0.05; b.inputs['Coat Weight'].default_value = 1.0; b.inputs['Coat Roughness'].default_value = 0.03; b.inputs['IOR'].default_value = 1.75; b.inputs['Transmission Weight'].default_value = 0.35

shots = 0
for i, t in enumerate(TIERS):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(GLB, f'tier{i + 1}.glb'))
    objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
    for o in objs:
        for slot in o.material_slots:
            if slot.material: shade(slot.material)
        base = o.name.split('.')[0]
        if base != 'stones':
            bev = o.modifiers.new('bevel', 'BEVEL'); bev.width = 0.0025; bev.segments = 2; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(40); bev.use_clamp_overlap = True
        bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35)) if hasattr(bpy.ops.object, 'shade_smooth_by_angle') else bpy.ops.object.shade_smooth(); o.select_set(False)
    # glTF Y-up imported as Z-up: the badge lies flat facing +Z. Good for a top-front camera.
    marks = {o.name.split('.')[0]: o for o in objs}
    front, low = (0.0, -1.05, 0.95), (0.75, -0.95, 0.42)
    ONLY = os.environ.get('ONLY')
    for f in FAMILIES:
        if i + 1 > LADDER[f]: continue
        if ONLY and f'{f}:{i + 1}' not in ONLY.split(','): continue
        for o in objs:
            base = o.name.split('.')[0]
            is_mark = base.startswith('mark_')
            o.hide_render = is_mark and not (base == f'mark_{f}' or base == f'mark_{f}_channel')
        aim(tuple(c * 1.6 for c in front))
        scene.render.filepath = os.path.join(OUT, f'{f}_t{i + 1}.png'); bpy.ops.render.render(write_still=True); shots += 1
    # one low-angle shot per tier, with the workouts mark
    if ONLY and f'low:{i + 1}' not in ONLY.split(','):
        for o in objs: bpy.data.objects.remove(o, do_unlink=True)
        continue
    for o in objs:
        base = o.name.split('.')[0]; o.hide_render = base.startswith('mark_') and not base.startswith('mark_workouts')
    aim(tuple(c * 1.6 for c in low)); scene.render.filepath = os.path.join(OUT, f'low_t{i + 1}.png'); bpy.ops.render.render(write_still=True)
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
print('rendered', shots + len(TIERS))

# ---------------------------------------------------------------- turntables: TURN="workouts:1,streak:3" renders 24 frames each, spinning about the vertical axis
TURN = os.environ.get('TURN')
if TURN:
    FRAMES = int(os.environ.get('FRAMES', '24'))
    scene.render.resolution_x = scene.render.resolution_y = 360
    scene.cycles.samples = 48
    for spec in TURN.split(','):
        f, t = spec.split(':'); t = int(t)
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(GLB, f'tier{t}.glb'))
        objs = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
        pivot = bpy.data.objects.new('pivot', None); bpy.context.collection.objects.link(pivot)
        for o in objs:
            for slot in o.material_slots:
                if slot.material: shade(slot.material)
            base = o.name.split('.')[0]
            if base != 'stones':
                bev = o.modifiers.new('bevel', 'BEVEL'); bev.width = 0.0025; bev.segments = 2; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(40); bev.use_clamp_overlap = True
            bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35)) if hasattr(bpy.ops.object, 'shade_smooth_by_angle') else bpy.ops.object.shade_smooth(); o.select_set(False)
            o.hide_render = base.startswith('mark_') and not (base == f'mark_{f}' or base == f'mark_{f}_channel')
            o.parent = pivot
        aim((0.0, -1.9, 1.0), target=(0, 0, 0.03))
        for i in range(FRAMES):
            pivot.rotation_euler = (0, math.radians(360 * i / FRAMES), 0)
            scene.render.filepath = os.path.join(OUT, f'turn_{f}_t{t}_{i:02d}.png'); bpy.ops.render.render(write_still=True)
        for o in objs: bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.objects.remove(pivot, do_unlink=True)
    print('turntables done')
