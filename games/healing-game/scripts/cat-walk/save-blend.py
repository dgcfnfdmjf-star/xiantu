"""Import the exact quantized runtime geometry, retain the seated source and render.
Blender does not import EXT_meshopt_compression; its decoded precompression input
is byte-identical to the shipped GLB's decoded views (verified by compress.mjs).
"""
import argparse, sys
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector, Matrix

p=argparse.ArgumentParser()
p.add_argument('--kind',required=True)
p.add_argument('--baseline-dir',type=Path,required=True)
p.add_argument('--output-dir',type=Path,required=True)
p.add_argument('--samples',type=int,default=32)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);kind=a.kind;work=a.output_dir
bpy.ops.wm.open_mainfile(filepath=str(a.baseline_dir/(kind+'-cat.blend')))
scene=bpy.context.scene;scene.render.fps=30
original=bpy.data.collections[kind.capitalize()+'Cat'];original.name='REFERENCE — approved seated V9.5'
for o in original.objects:o.hide_render=True;o.hide_set(True)
original.hide_render=True;original.hide_viewport=True
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(work/(kind+'-walk-quant.glb')))
objects=[o for o in bpy.data.objects if o not in before]
# The importer creates a unit Icosphere used only as a bone custom-shape gizmo.
# Keep that helper in its hidden import collection, never in the rendered cat.
custom_shapes={bone.custom_shape for o in objects if o.type=='ARMATURE' for bone in o.pose.bones if bone.custom_shape}
for helper in custom_shapes:helper.hide_render=True;helper.hide_set(True)
objects=[o for o in objects if o not in custom_shapes]
# Blender imports morph positions, but not glTF morph normals. Reconstruct those
# normals for the review renders; the browser uses these same NORMAL deltas.
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'assets/cats'))
import compact_skin_glb as compact
document,binary=compact.parse_glb((work/(kind+'-walk-quant.glb')).read_bytes())
normal_sources=[]
for mesh in document['meshes']:
 if not mesh['primitives'][0].get('targets'):continue
 positions=np.concatenate([compact.accessor_values(document,binary,q['attributes']['POSITION'],normalized=True) for q in mesh['primitives']])
 positions=positions[:,[0,2,1]];positions[:,1]*=-1
 target=next(o for o in objects if o.type=='MESH' and o.data.shape_keys and len(o.data.vertices)==len(positions))
 assert np.max(np.abs(np.array([v.co[:] for v in target.data.vertices])-positions))<1e-6
 basis=np.concatenate([compact.accessor_values(document,binary,q['attributes']['NORMAL'],normalized=True) for q in mesh['primitives']])
 deltas=[np.concatenate([compact.accessor_values(document,binary,q['targets'][i]['NORMAL'],normalized=True) for q in mesh['primitives']]) for i in range(len(mesh['primitives'][0]['targets']))]
 normal_sources.append((target,basis,deltas))
def review_normals():
 bpy.context.view_layer.update()
 for obj,basis,deltas in normal_sources:
  normals=basis.copy()
  for key,delta in zip(obj.data.shape_keys.key_blocks[1:],deltas):normals+=delta*key.value
  normals=normals[:,[0,2,1]];normals[:,1]*=-1
  normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-9)
  obj.data.normals_split_custom_set_from_vertices(normals.tolist())
collection=bpy.data.collections.new(kind.capitalize()+'Cat — Walk');scene.collection.children.link(collection)
for o in objects:
 for c in list(o.users_collection):c.objects.unlink(o)
 collection.objects.link(o)
 if o.type=='ARMATURE':
  for bone in o.pose.bones:bone.matrix_basis=Matrix.Identity(4)
 for data in [o, o.data.shape_keys if o.type=='MESH' else None]:
  if data is None:continue
  animation=data.animation_data
  if animation:
   action=animation.action
   if action:action.use_fake_user=True
   animation.action=None
   for track in animation.nla_tracks:
    track.mute=False
    for strip in track.strips:strip.extrapolation='NOTHING';strip.blend_type='REPLACE'
  if getattr(data,'key_blocks',None):
   for key in data.key_blocks:key.value=0
for img in bpy.data.images:
 if img.source=='FILE' and not img.packed_file:
  try:img.pack()
  except RuntimeError:pass
scene.frame_start=0;scene.frame_end=47
scene.render.engine='CYCLES';scene.cycles.samples=a.samples;scene.cycles.use_denoising=False
scene.render.resolution_x=768;scene.render.resolution_y=768;scene.render.resolution_percentage=100
scene.render.threads_mode='FIXED';scene.render.threads=3
camera=scene.camera;front=camera.location.copy();rotation=camera.rotation_euler.copy();scale=camera.data.ortho_scale
scene.frame_set(-1);review_normals()
scene.render.filepath=str(work/(kind+'-cat-preview.png'));bpy.ops.render.render(write_still=True)
camera.location=(3.4,-.8,.83);camera.rotation_euler=(Vector((0,.05,.4))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=1.38
for phase in [0,12,24,36]:
 scene.frame_set(phase);review_normals();scene.render.filepath=str(work/(kind+'-walk-'+str(phase).zfill(2)+'.png'));bpy.ops.render.render(write_still=True)
camera.location=front;camera.rotation_euler=rotation;camera.data.ortho_scale=scale
scene.frame_set(-1);review_normals()
text=bpy.data.texts.new('WALK — read me')
text.write('Runtime geometry matches the decoded GLB. Frame -1 is the approved seated rest.\nPlay frames 0–47 at 30 FPS for the 1.6 second Walk loop. All Walk NLA tracks are enabled.\nSource +Z glTF forward is -Y in Blender. Do not rotate the game actor to compensate.\nOriginal V9.5 sources remain hidden as references. Original atlas bytes are preserved.\n')
for o in bpy.context.selected_objects:o.select_set(False)
rig=next(o for o in objects if o.type=='ARMATURE');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(work/(kind+'-cat.blend')),compress=True)
print('EDITABLE_AND_RENDERED',kind,flush=True)
