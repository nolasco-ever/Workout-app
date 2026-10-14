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
    nt.links.new(env.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.9
else:
    bg.inputs['Color'].default_value = (0.42, 0.42, 0.44, 1); bg.inputs['Strength'].default_value = 1.0
scene.view_settings.exposure = 0.0
DIFF = float(os.environ.get('DIFF', '0.25'))   # diffuse surfaces (enamel) see the big sources at this fraction; reflections see them in full
def ray_mix(ntree, strength_input, strong):
    """Drive a strength input: `strong` for glossy (reflection) rays, strong*DIFF for everything else."""
    lp = ntree.nodes.new('ShaderNodeLightPath'); m = ntree.nodes.new('ShaderNodeMath'); m.operation = 'MULTIPLY_ADD'
    m.inputs[1].default_value = strong - strong * DIFF; m.inputs[2].default_value = strong * DIFF
    ntree.links.new(lp.outputs['Is Glossy Ray'], m.inputs[0]); ntree.links.new(m.outputs[0], strength_input)
ray_mix(nt, bg.inputs['Strength'], bg.inputs['Strength'].default_value)
# A softbox overhead: a large emissive plane the metals reflect as a broad highlight.
bpy.ops.mesh.primitive_plane_add(size=2.6, location=(-0.4, -0.6, 2.2))
soft = bpy.context.view_layer.objects.active; soft.name = 'softbox'
soft.rotation_euler = (math.radians(12), math.radians(-8), 0)
sm = bpy.data.materials.new('softbox'); sm.use_nodes = True
em = sm.node_tree.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 3.8; em.inputs['Color'].default_value = (1.0, 0.98, 0.95, 1)
sm.node_tree.links.new(em.outputs['Emission'], sm.node_tree.nodes['Material Output'].inputs['Surface'])
soft.data.materials.append(sm); soft.visible_camera = False; ray_mix(sm.node_tree, em.inputs['Strength'], 3.8)
# The badge faces the camera; its flat face reflects what sits behind and above it. A second softbox there is what the metal shows.
bpy.ops.mesh.primitive_plane_add(size=5.0, location=(0.2, 2.2, 2.2))
soft2 = bpy.context.view_layer.objects.active; soft2.name = 'softbox_reflect'
soft2.rotation_euler = (Vector((0.2, 1.9, 1.9)) * -1).to_track_quat('-Z', 'Y').to_euler()
sm2 = bpy.data.materials.new('softbox2'); sm2.use_nodes = True
em2 = sm2.node_tree.nodes.new('ShaderNodeEmission'); em2.inputs['Strength'].default_value = 6.0; em2.inputs['Color'].default_value = (1.0, 0.98, 0.94, 1)
sm2.node_tree.links.new(em2.outputs['Emission'], sm2.node_tree.nodes['Material Output'].inputs['Surface'])
soft2.data.materials.append(sm2); soft2.visible_camera = False; ray_mix(sm2.node_tree, em2.inputs['Strength'], 6.0)
def light(name, loc, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(loc) * -1).to_track_quat('-Z', 'Y').to_euler()
    d.use_nodes = True; ray_mix(d.node_tree, d.node_tree.nodes['Emission'].inputs['Strength'], 1.0)
light('key', (-1.2, -1.6, 2.0), 110, 0.3, (1.0, 0.97, 0.92)); light('rim', (1.6, 1.3, 1.2), 120, 0.4, (0.85, 0.92, 1.0)); light('rim2', (-1.7, 1.0, 0.9), 70, 0.5, (1.0, 0.9, 0.8)); light('fill', (1.4, -1.6, 0.9), 20, 2.5)
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 60
cam = bpy.data.objects.new('cam', cam_data); bpy.context.collection.objects.link(cam); scene.camera = cam
def aim(loc, target=(0, 0, 0.02)):
    cam.location = loc; cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

GLOW_ENAMEL = float(os.environ.get('GLOW_ENAMEL', '0.3')); GLOW_METAL = float(os.environ.get('GLOW_METAL', '0.12'))   # self-light keeps the colour saturated in shade (the cartoon look)
def shade(mat):
    """Keep the flat base colour from the file; set the shader by material role."""
    mat.use_nodes = True
    b = mat.node_tree.nodes.get('Principled BSDF')
    if not b: return
    n = mat.name.split('.')[0]
    if n in ('metal', 'mark', 'metal_dark'):
        b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.55 if n == 'metal_dark' else 0.2
        b.inputs['Emission Color'].default_value = tuple(b.inputs['Base Color'].default_value); b.inputs['Emission Strength'].default_value = GLOW_METAL
    elif n.startswith('enamel'):
        b.inputs['Metallic'].default_value = 0.0; b.inputs['Roughness'].default_value = 0.55; b.inputs['Coat Weight'].default_value = 0.06; b.inputs['Coat Roughness'].default_value = 0.1; b.inputs['Specular IOR Level'].default_value = 0.08
        # cartoon enamel: part flat colour (emission of the exact hex), part shaded surface
        nt_ = mat.node_tree; out = nt_.nodes['Material Output']
        em_ = nt_.nodes.new('ShaderNodeEmission'); em_.inputs['Color'].default_value = tuple(b.inputs['Base Color'].default_value); em_.inputs['Strength'].default_value = 1.0
        mx = nt_.nodes.new('ShaderNodeMixShader'); mx.inputs['Fac'].default_value = GLOW_ENAMEL
        nt_.links.new(b.outputs['BSDF'], mx.inputs[1]); nt_.links.new(em_.outputs['Emission'], mx.inputs[2]); nt_.links.new(mx.outputs['Shader'], out.inputs['Surface'])
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
            bev = o.modifiers.new('bevel', 'BEVEL'); bev.width = 0.0015; bev.segments = 2; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(40); bev.use_clamp_overlap = True
        bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(70)) if hasattr(bpy.ops.object, 'shade_smooth_by_angle') else bpy.ops.object.shade_smooth(); o.select_set(False)
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
            is_lines = base.startswith('lines_')
            o.hide_render = (is_mark and not (base == f'mark_{f}' or base == f'mark_{f}_channel')) or (is_lines and base != f'lines_{f}')
        aim(tuple(c * 1.6 for c in front))
        scene.render.filepath = os.path.join(OUT, f'{f}_t{i + 1}.png'); bpy.ops.render.render(write_still=True); shots += 1
    # the back, turned round on the vertical axis: the engraved logo
    if not ONLY or f'back:{i + 1}' in ONLY.split(','):
        pivot = bpy.data.objects.new('pivot', None); bpy.context.collection.objects.link(pivot)
        for o in objs: o.parent = pivot
        pivot.rotation_euler = (0, 0, math.pi)
        soft2.hide_render = True   # that softbox sits behind the badge and would flood the back
        aim(tuple(c * 1.6 for c in front)); scene.render.filepath = os.path.join(OUT, f'back_t{i + 1}.png'); bpy.ops.render.render(write_still=True)
        soft2.hide_render = False
        for o in objs: o.parent = None
        bpy.data.objects.remove(pivot, do_unlink=True)
    # one low-angle shot per tier, with the workouts mark
    if ONLY and f'low:{i + 1}' not in ONLY.split(','):
        for o in objs: bpy.data.objects.remove(o, do_unlink=True)
        continue
    for o in objs:
        base = o.name.split('.')[0]; o.hide_render = (base.startswith('mark_') and not base.startswith('mark_workouts')) or (base.startswith('lines_') and base != 'lines_workouts')
    aim(tuple(c * 1.6 for c in low)); scene.render.filepath = os.path.join(OUT, f'low_t{i + 1}.png'); bpy.ops.render.render(write_still=True)
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
print('rendered', shots + len(TIERS))

# ---------------------------------------------------------------- turntables: TURN="workouts:1,streak:3" renders 24 frames each, spinning about the vertical axis
TURN = os.environ.get('TURN')
if TURN:
    FRAMES = int(os.environ.get('FRAMES', '24'))
    scene.render.resolution_x = scene.render.resolution_y = 300
    scene.cycles.samples = 40
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
                bev = o.modifiers.new('bevel', 'BEVEL'); bev.width = 0.0015; bev.segments = 2; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(40); bev.use_clamp_overlap = True
            bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(70)) if hasattr(bpy.ops.object, 'shade_smooth_by_angle') else bpy.ops.object.shade_smooth(); o.select_set(False)
            o.hide_render = (base.startswith('mark_') and not (base == f'mark_{f}' or base == f'mark_{f}_channel')) or (base.startswith('lines_') and base != f'lines_{f}')
            o.parent = pivot
        # The imported badge stands upright facing -Y (toward the camera). Yaw about Z turns it round to the edge and the
        # back; pitch about X tips it to show the top and the underside.
        aim((0.0, -2.1, 0.55), target=(0, 0, 0.0))
        PITCHES = [-40, 0, 40]
        for pi_, pitch in enumerate(PITCHES):
            for i in range(FRAMES):
                pivot.rotation_euler = (math.radians(pitch), 0, math.radians(360 * i / FRAMES))
                scene.render.filepath = os.path.join(OUT, f'turn_{f}_t{t}_p{pi_}_{i:02d}.png'); bpy.ops.render.render(write_still=True)
        for o in objs: bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.objects.remove(pivot, do_unlink=True)
    print('turntables done')
