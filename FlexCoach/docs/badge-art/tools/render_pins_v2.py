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
env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(ENV)
nt.links.new(env.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.0
scene.view_settings.exposure = -0.15
def light(name, loc, energy, size, color=(1, 1, 1)):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size; d.color = color
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector(loc) * -1).to_track_quat('-Z', 'Y').to_euler()
light('key', (-1.0, -1.4, 2.4), 70, 2.2, (1.0, 0.97, 0.92)); light('rim', (1.5, 1.0, 1.4), 32, 1.2, (0.9, 0.94, 1.0)); light('fill', (1.4, -1.4, 0.8), 18, 2.0)
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
        b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.22
    elif n.startswith('enamel'):
        b.inputs['Metallic'].default_value = 0.0; b.inputs['Roughness'].default_value = 0.5; b.inputs['Coat Weight'].default_value = 0.08; b.inputs['Coat Roughness'].default_value = 0.1; b.inputs['Specular IOR Level'].default_value = 0.1
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
    # glTF Y-up imported as Z-up: the badge lies flat facing +Z. Good for a top-front camera.
    marks = {o.name.split('.')[0]: o for o in objs}
    front, low = (0.0, -1.05, 0.95), (0.75, -0.95, 0.42)
    for f in FAMILIES:
        if i + 1 > LADDER[f]: continue
        for o in objs:
            base = o.name.split('.')[0]
            is_mark = base.startswith('mark_')
            o.hide_render = is_mark and not (base == f'mark_{f}' or base == f'mark_{f}_channel')
        aim(tuple(c * 1.6 for c in front))
        scene.render.filepath = os.path.join(OUT, f'{f}_t{i + 1}.png'); bpy.ops.render.render(write_still=True); shots += 1
    # one low-angle shot per tier, with the workouts mark
    for o in objs:
        base = o.name.split('.')[0]; o.hide_render = base.startswith('mark_') and not base.startswith('mark_workouts')
    aim(tuple(c * 1.6 for c in low)); scene.render.filepath = os.path.join(OUT, f'low_t{i + 1}.png'); bpy.ops.render.render(write_still=True)
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
print('rendered', shots + len(TIERS))
