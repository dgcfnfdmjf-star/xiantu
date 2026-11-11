import bpy, math, sys, json, hashlib, struct
from pathlib import Path
from mathutils import Vector, Matrix
import numpy as np
import argparse
parser=argparse.ArgumentParser(description='Add a seated-rest Walk rig to one approved V9.5 cat.')
parser.add_argument('--kind',choices=['orange','calico','black','tabby'],required=True)
parser.add_argument('--baseline-dir',type=Path,required=True)
parser.add_argument('--output-dir',type=Path,required=True)
options=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
kind=options.kind
root=Path(__file__).resolve().parents[2]/'assets/cats'
work=options.output_dir.resolve();work.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(options.baseline_dir/(kind+'-cat.blend')))
scene=bpy.context.scene; coll=bpy.data.collections[kind.capitalize()+'Cat']; meshes=[o for o in coll.objects if o.type=='MESH']; body=next(o for o in meshes if '_Fur' in o.name)
sys.path.insert(0,str(Path(__file__).resolve().parent))
from reduce_details import reduce_details
reduce_details(meshes,body)
for o in bpy.context.selected_objects:o.select_set(False)
arm=bpy.data.armatures.new('CatWalkSkeleton');rig=bpy.data.objects.new('CatWalkRig',arm);coll.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
centers={'Root':(0,0,0),'Body':(0,.047,.235),'Head':(0,-.064,.681)}
for side,s in [('L',-1),('R',1)]:
 for leg in ['Front','Rear']:
  if leg=='Front':pts=[(s*.076,-.105,.36),(s*.076,-.075,.18),(s*.077,-.165,.044)]
  else:pts=[(s*.137,.06,.23),(s*.137,-.07,.21),(s*.162,.05,.07),(s*.162,-.054,.045)]
  for part,p in zip(['Upper','Lower','Paw'] if leg=='Front' else ['Upper','Lower','Ankle','Paw'],pts):centers[leg+part+'.'+side]=p
for side,sgn in [('L',-1),('R',1)]:centers['Haunch.'+side]=(sgn*.137,.027,.157)
centers.update({'TailRoot':(.155,.113,.137),'TailMid':(.292,-.092,.044),'TailTip':(.111,-.239,.056)})
for name,p in centers.items():
 if name in ['TailMid','TailTip']:continue
 b=arm.edit_bones.new(name);b.head=p
 if 'Upper' in name:b.tail=centers[name.replace('Upper','Lower')]
 elif 'Lower' in name:b.tail=centers[name.replace('Lower','Ankle' if name.startswith('Rear') else 'Paw')]
 elif 'Ankle' in name:b.tail=centers[name.replace('Ankle','Paw')]
 elif name=='TailRoot':b.tail=centers['TailMid']
 elif name=='TailMid':b.tail=centers['TailTip']
 else:b.tail=Vector(p)+Vector((0,.065,0))
 b.use_deform=name!='Root'
 if name!='Root':b.parent=arm.edit_bones['Root']
bpy.ops.object.mode_set(mode='OBJECT')
for p in rig.pose.bones:p.rotation_mode='QUATERNION'

def smooth(x):x=max(0,min(1,x));return x*x*(3-2*x)
def mixbones(z, names, levels):
 if z<=levels[0]:return {names[0]:1}
 if z>=levels[-1]:return {names[-1]:1}
 for a,b,na,nb in zip(levels,levels[1:],names,names[1:]):
  if z<=b:t=smooth((z-a)/(b-a));return {na:1-t,nb:t}
tail=np.array([[.155,.113,.137],[.225,.105,.1],[.278,.028,.065],[.292,-.092,.044],[.270,-.213,.036],[.200,-.276,.037],[.132,-.273,.044],[.111,-.239,.056]])
def rear_weights(point, side):
 names=['RearUpper.'+side,'RearLower.'+side,'RearAnkle.'+side];joints=[Vector(centers[n]) for n in names]+[Vector(centers['RearPaw.'+side])]
 distances=[];projection=[]
 for a,b in zip(joints,joints[1:]):
  t=max(0,min(1,(point-a).dot(b-a)/(b-a).length_squared));projection.append(t);distances.append((point-(a+(b-a)*t)).length)
 nearest=min(distances);scores=[math.exp(-(d-nearest)/.018) for d in distances];total=sum(scores)
 upper=smooth((point.z-.04)/.055)
 out={n:s/total*(1-upper) for n,s in zip(names,scores)};out['Haunch.'+side]=upper
 return out

def weights(v, return_part=False):
 x,y,z=v; rawz=z+.032*smooth((z-.43)/.208); q=np.array((x,y,rawz)); candidates=[]
 def ell(name,c,r):
  c=np.array(c);r=np.array(r); delta=q-c
  if name.startswith('FrontLeg'):
   angle=math.radians(8);dy,dz=delta[1],delta[2];delta[1]=math.cos(angle)*dy-math.sin(angle)*dz;delta[2]=math.sin(angle)*dy+math.cos(angle)*dz
  rho=np.linalg.norm(delta/r)
  # First-order signed ellipsoid distance in physical units.
  denom=max(np.linalg.norm(delta/(r*r)),1e-9)
  d=(rho-1)*rho/denom
  candidates.append((d,name))
 for c,r in [((0,.047,.235),(.184,.145,.221)),((0,.008,.398),(.144,.12,.214)),((0,-.028,.504),(.123,.106,.153))]:ell('Body',c,r)
 ell('Neck',(0,-.028,.594),(.101,.091,.125))
 for c,r in [((0,-.064,.713),(.151,.122,.131)),((0,-.098,.663),(.108,.088,.065)),((0,-.159,.635),(.046,.042,.025)),((0,-.158,.697),(.031,.04,.042))]:ell('Head',c,r)
 for side,sgn in [('L',-1),('R',1)]:
  ell('RearUpper.'+side,(sgn*.137,.027,.157),(.096,.127,.143))
  ell('RearPaw.'+side,(sgn*.162,-.054,.045),(.065,.090,.043))
  ell('FrontLeg.'+side,(sgn*.076,-.105,.245),(.047,.054,.204))
  ell('FrontLower.'+side,(sgn*.075,-.134,.105),(.043,.052,.088))
  ell('FrontPaw.'+side,(sgn*.077,-.165,.044),(.057,.077,.044))
  ell('Head',(sgn*.098,-.095,.684),(.063,.08,.067))
  ell('Head',(sgn*.032,-.169,.659),(.041,.046,.032))
 # Continuous nearest point along the tail's centerline, not nearest discrete knot.
 best=(100,0)
 for i,(a,b) in enumerate(zip(tail,tail[1:])):
  d=b-a;t=np.clip(np.dot(np.array(v)-a,d)/np.dot(d,d),0,1);pt=a+t*d;u=(i+t)/7
  distance=np.linalg.norm(np.array(v)-pt)-(.039*(1-.62*u)+.001)
  if distance<best[0]:best=(distance,u)
 candidates.append((best[0],'Tail'))
 # Anatomical part labels are independent from the rig influence blend.
 if return_part:
  part=min(candidates,key=lambda item:item[0])[1]
  if part.startswith('Front'):return 'Front.'+part[-1]
  if part.startswith('RearUpper'):return 'Haunch.'+part[-1]
  if part.startswith('RearPaw'):return 'RearPaw.'+part[-1]
  return 'Tail' if part=='Tail' else 'Body'
 # Multiple torso/head primitives form one union, not multiple votes in skin weights.
 united={}
 for distance,name in candidates:united[name]=min(distance,united.get(name,100))
 candidates=[(distance,name) for name,distance in united.items()]
 mind=min(d for d,n in candidates); temp=.010+.006*smooth((z-.3)/.15)
 scores=[(math.exp(-(d-mind)/(.004 if n=='Tail' else temp)),n) for d,n in candidates if d-mind<.045]
 out={}
 for w,n in scores:
  if n.startswith('FrontLeg'):
   side=n[-1];sub=mixbones(z,['FrontPaw.'+side,'FrontLower.'+side,'FrontUpper.'+side,'Body'],[.07,.16,.30,.40])
  elif n.startswith('RearUpper'):
   side=n[-1];sub=rear_weights(Vector(v),side)
  elif n.startswith('FrontLower'):
   side=n[-1];sub=mixbones(z,['FrontPaw.'+side,'FrontLower.'+side,'FrontUpper.'+side,'Body'],[.07,.16,.30,.40])
  elif n=='Neck':sub={'Body':1-smooth((z-.49)/.11),'Head':smooth((z-.49)/.11)}
  elif n=='Tail':
   u=best[1]
   f=smooth(u/.32);sub={'Body':1-f,'TailRoot':f}
  else:sub={n:1}
  for name,ww in sub.items():out[name]=out.get(name,0)+w*ww
 if z>.61:out={'Head':1}
 out={k:v for k,v in out.items() if v>1e-6};out=dict(sorted(out.items(),key=lambda kv:kv[1],reverse=True)[:4]);su=sum(out.values());return {k:v/su for k,v in out.items()}
# Release the static voxel union's contacts between limbs, retaining every external rest triangle.
mesh=body.data; oldverts=[v.co.copy() for v in mesh.vertices]
oldfaces=[list(p.vertices) for p in mesh.polygons];olduv=[tuple(u.uv) for u in mesh.uv_layers.active.data];oldnorm=[tuple(n.vector) for n in mesh.corner_normals]
labels=[]
for p in mesh.polygons:
 c=sum((oldverts[i] for i in p.vertices),Vector())/len(p.vertices)
 labels.append(weights(c,return_part=True))
# Remove tiny classifier spurs along fused contacts, without changing an exterior
# vertex or triangle. Smoother anatomical boundaries need fewer hidden closures.
from collections import defaultdict
edges=defaultdict(list)
for fi,face in enumerate(oldfaces):
 for a,b in zip(face,face[1:]+face[:1]):edges[tuple(sorted((a,b)))].append(fi)
neighbors=[[] for _ in oldfaces]
for (a,b),faces in edges.items():
 if len(faces)==2:
  i,j=faces;length=(oldverts[a]-oldverts[b]).length;neighbors[i].append((j,length));neighbors[j].append((i,length))
for _ in range(6):
 changed=0
 for i,adjacent in enumerate(neighbors):
  scores=defaultdict(float)
  for j,length in adjacent:scores[labels[j]]+=length
  if not scores:continue
  best=max(scores,key=scores.get)
  if best!=labels[i] and scores[best]>scores.get(labels[i],0)*1.15 and sum(labels[j]==best for j,_ in adjacent)>=2:
   labels[i]=best;changed+=1
 if not changed:break
print('CLEAN_CONTACTS',changed,flush=True)
# Preserve exact external faces; release only the anatomical contacts required to articulate.
sys.path.insert(0,str(Path(__file__).resolve().parent))
from contact_parts import split_parts,place_cap_chart,refine_parts
from rounded_caps import rounded_caps
data=rounded_caps(split_parts(mesh,labels),mesh)
print("CAP_REFINEMENT",data["cap_refinement"],flush=True)
verts,faces,uvs,normals=[data[name] for name in ['verts','faces','uvs','normals']]
vertexpart=data['vertexpart'];vertexstrength=data['vertex_strength']
# Compact per-cap charts reuse unchanged atlas pixels matching their boundary fur.
occupied=np.zeros((1024,1024),dtype=bool)
for p in mesh.polygons:
 uv=np.array([olduv[i] for i in p.loop_indices]);lo=np.floor(uv.min(axis=0)*1024-2).astype(int);hi=np.ceil(uv.max(axis=0)*1024+2).astype(int)
 occupied[max(0,lo[1]):min(1024,hi[1]+1),max(0,lo[0]):min(1024,hi[0]+1)]=True
cells=[]
for yy in range(8,1016,8):
 for xx in range(8,1016,8):
  if not occupied[yy-2:yy+7,xx-2:xx+7].any():cells.append((xx,yy))
img=next(n.image for n in body.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
pixels=np.empty(len(img.pixels),dtype=np.float32);img.pixels.foreach_get(pixels);pixels=pixels.reshape(img.size[1],img.size[0],4)
cellcolors=np.array([pixels[yy:yy+5,xx:xx+5,:3].mean(axis=(0,1)) for xx,yy in cells]);freecells=set(range(len(cells)))
vertexcolors={}
for fi,poly in enumerate(mesh.polygons):
 for li in poly.loop_indices:
  u,v=olduv[li];color=pixels[min(1023,int(v*1024)),min(1023,int(u*1024)),:3]
  vertexcolors.setdefault((labels[fi],mesh.loops[li].vertex_index),[]).append(color)
for chart in data['cap_charts']:
 colors=[col for index in chart['source_ring'] for col in vertexcolors.get((chart['label'],index),[])]
 target=np.median(colors,axis=0) if colors else np.array((.9,.5,.2))
 cell=min(freecells,key=lambda index:float(np.sum((cellcolors[index]-target)**2)));freecells.remove(cell);xx,yy=cells[cell]
 place_cap_chart(data,chart,((xx+.5)/1024,(yy+.5)/1024),(4/1024,4/1024))
new=bpy.data.meshes.new(mesh.name+' • articulated contact surfaces');new.from_pydata(verts,[],faces);new.update()
for mat in mesh.materials:new.materials.append(mat)
uv=new.uv_layers.new(name=mesh.uv_layers.active.name)
for dst,value in zip(uv.data,uvs):dst.uv=value
for p in new.polygons:p.use_smooth=True
new.normals_split_custom_set(normals);body.data=new
assert len({tuple(sorted(f)) for f in faces})==len(faces),'Duplicate anatomical faces'
print('CONTACT_SPLIT',len(data['cap_charts']),'charts; faces',len(oldfaces),'->',len(faces),flush=True)
for obj in meshes:
 for g in list(obj.vertex_groups):obj.vertex_groups.remove(g)
 for n in centers:
  if n!='Root':obj.vertex_groups.new(name=n)
 for v in obj.data.vertices:
  ww=weights(v.co)
  if obj==body:
   part=vertexpart[v.index];original=ww.copy()
   if part=='Body':
    ww={n:w for n,w in ww.items() if n in ['Body','Head']}
    if not ww:ww={'Body':1}
   elif part=='Tail':ww={'TailRoot':1}
   elif part.startswith('Haunch.'):
    ww={part:1}
   elif part.startswith('RearPaw.'):ww={part:1}
   elif part.startswith('Front.'):
    side=part[-1];ww={n:w for n,w in ww.items() if n.startswith('Front') and n.endswith('.'+side)}
    if not ww:ww={'FrontUpper.'+side:1}
   total=sum(ww.values());ww={n:w/total for n,w in ww.items()}
  for n,w in ww.items():obj.vertex_groups[n].add([v.index],w,'REPLACE')
 mod=obj.modifiers.new('Walk skin • seated rest preserved','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=False
 obj.parent=rig
# Toe creases belong to the same deformed surface as their nearest original fur triangle.
# Independent analytic classification here would lift a dark stroke away from its paw.
from mathutils.bvhtree import BVHTree
surface=[tuple(p.vertices) for p in body.data.polygons[:len(oldfaces)]]
bvh=BVHTree.FromPolygons([v.co for v in body.data.vertices],surface,all_triangles=True)
def surface_weights(point):
 hit,normal,face_index,distance=bvh.find_nearest(point)
 ids=surface[face_index];a,b,c=[body.data.vertices[i].co for i in ids];v0=b-a;v1=c-a;v2=hit-a
 d00=v0.dot(v0);d01=v0.dot(v1);d11=v1.dot(v1);d20=v2.dot(v0);d21=v2.dot(v1);denom=d00*d11-d01*d01
 vv=(d11*d20-d01*d21)/denom;ww=(d00*d21-d01*d20)/denom;bs=[1-vv-ww,vv,ww];result={}
 for index,factor in zip(ids,bs):
  for group in body.data.vertices[index].groups:
   name=body.vertex_groups[group.group].name;result[name]=result.get(name,0)+factor*group.weight
 result=dict(sorted(result.items(),key=lambda p:p[1],reverse=True)[:4]);total=sum(result.values());return {n:w/total for n,w in result.items() if w>0}
detail=next(o for o in meshes if o.name=='Sepia facial detail')
for v in detail.data.vertices:
 if v.co.z>.14:continue
 for group in detail.vertex_groups:group.remove([v.index])
 detail.vertex_groups['FrontPaw.'+('L' if v.co.x<0 else 'R')].add([v.index],1,'REPLACE')
# Transfer the approved fur's boundary colors/normals to previously hidden closures.
# glTF COLOR_0 is linear RGB; image.pixels exposes the original JPEG's sRGB samples.
from collections import defaultdict
samples=defaultdict(list);boundary_normals=defaultdict(list)
def srgb_to_linear(color):
 return np.where(color<=.04045,color/12.92,((color+.055)/1.055)**2.4)
def atlas_sample(uv):
 x=float(uv[0])*1024-.5;y=float(uv[1])*1024-.5;ix=int(math.floor(x));iy=int(math.floor(y));fx=x-ix;fy=y-iy
 def at(xx,yy):return pixels[max(0,min(1023,yy)),max(0,min(1023,xx)),:3]
 srgb=at(ix,iy)*(1-fx)*(1-fy)+at(ix+1,iy)*fx*(1-fy)+at(ix,iy+1)*(1-fx)*fy+at(ix+1,iy+1)*fx*fy
 return srgb_to_linear(srgb)
for fi,poly in enumerate(mesh.polygons):
 for li in poly.loop_indices:
  key=(labels[fi],mesh.loops[li].vertex_index);samples[key].append(atlas_sample(olduv[li]));boundary_normals[key].append(np.asarray(oldnorm[li]))
capverts=[];capfaces=[];capcolors=[];capnormals=[];capgroups=[]
for ci,chart in enumerate(data['cap_charts']):
 ids=chart['mapped_vertices'];count=len(ids);fixed=len(chart['source_ring']);neighbors=[{} for _ in ids];geom=np.zeros((count,3))
 for tri in chart['triangles']:
  a,b,c=[np.asarray(verts[ids[i]],dtype=float) for i in tri];normal=np.cross(b-a,c-a)
  for i in tri:geom[i]+=normal
  for a,b in zip(tri,tri[1:]+tri[:1]):
   weight=1/max((verts[ids[a]]-verts[ids[b]]).length,1e-6);neighbors[a][b]=weight;neighbors[b][a]=weight
 geom/=np.maximum(np.linalg.norm(geom,axis=1)[:,None],1e-9)
 colors=np.zeros((count,3));norms=np.zeros((count,3))
 for i,source in enumerate(chart['source_ring']):
  key=(chart['label'],source);colors[i]=np.mean(samples[key],axis=0);normal=np.mean(boundary_normals[key],axis=0);norms[i]=normal/max(np.linalg.norm(normal),1e-9)
 if count>fixed:
  matrix=np.zeros((count-fixed,count-fixed));rhs=np.zeros((count-fixed,6))
  for i in range(fixed,count):
   for j,weight in neighbors[i].items():
    matrix[i-fixed,i-fixed]+=weight
    if j>=fixed:matrix[i-fixed,j-fixed]-=weight
    else:rhs[i-fixed,:3]+=weight*colors[j];rhs[i-fixed,3:]+=weight*norms[j]
  values=np.linalg.solve(matrix,rhs);colors[fixed:]=values[:,:3];norms[fixed:]=geom[fixed:]
 # Keep every smooth closure normal in its geometric outward hemisphere.
 for i in range(fixed,count):
  n=norms[i];g=geom[i];projection=float(np.dot(n,g))
  if projection<.05:n=n+g*(.05-projection)
  norms[i]=n/max(np.linalg.norm(n),1e-9)
 offset=len(capverts)
 for i,source_index in enumerate(ids):
  capverts.append(verts[source_index]);capcolors.append((*np.clip(colors[i],0,1),1));capnormals.append(tuple(norms[i]));capgroups.append({body.vertex_groups[g.group].name:g.weight for g in body.data.vertices[source_index].groups})
 for tri in chart['triangles']:capfaces.append(tuple(offset+i for i in tri))
# Cap and original exterior share vertices so walking normals join continuously.
colorattr=body.data.color_attributes.new(name='Transferred fur',type='FLOAT_COLOR',domain='POINT')
for dst in colorattr.data:dst.color=(1,1,1,1)
for chart in data['cap_charts']:
 for index,source in enumerate(chart['mapped_vertices']):
  colorattr.data[source].color=capcolors.pop(0)
material=bpy.data.materials.new('Anatomical closures • transferred fur');material.use_nodes=True
shader=material.node_tree.nodes.get('Principled BSDF');shader.inputs['Roughness'].default_value=.93
vertexcolor=material.node_tree.nodes.new('ShaderNodeVertexColor');vertexcolor.layer_name='Transferred fur';material.node_tree.links.new(vertexcolor.outputs['Color'],shader.inputs['Base Color'])
body.data.materials.append(material)
rest_normals=list(oldnorm);offset=0
for chart in data['cap_charts']:
 for tri in chart['triangles']:
  rest_normals.extend(capnormals[offset+i] for i in tri)
 offset+=len(chart['mapped_vertices'])
body.data.normals_split_custom_set(rest_normals)
for polygon in body.data.polygons[len(oldfaces):]:polygon.material_index=1
basis=body.shape_key_add(name='Approved seated silhouette');walkshape=body.shape_key_add(name='Walk surface completion')
# Round each previously missing inner surface, then carry its neighbouring outer
# vertices continuously into the complete anatomical part when walking.
boundaries={}
for chart in data['cap_charts']:
 boundaries.setdefault(chart['label'],set()).update(chart['mapped_ring'])
for vertex in body.data.vertices:
 part=vertexpart[vertex.index];point=vertex.co
 if part=='Tail':continue
 ring=boundaries.get(part,set())
 distance=min(((point-body.data.vertices[i].co).length for i in ring),default=1)
 added=vertex.index>=len(data['vmap'])
 strength=1. if added else 0.
 if strength:
  target=data['walk_targets'].get(vertex.index,data['walk_project'](point,part))
  walkshape.data[vertex.index].co=point.lerp(target,strength)
walkshape.value=0
from cap_texture import paint_caps
paint_caps(body,data,kind,work,tail)
print('ROUNDED_WALK_SURFACES',len(body.data.vertices),len(body.data.polygons),flush=True)

# Closed hind shins are inside the approved seated haunch, revealed by extension.
# Their palette is the approved coat color; no outer seated vertex/atlas is changed.
shinverts=[];shinfaces=[];shinweights=[];shintargets=[]
source_bvh=BVHTree.FromPolygons(oldverts,oldfaces,all_triangles=True)
def inside_source(point):
 votes=0
 for direction in (Vector((1,.317,.231)),Vector((.233,1,.451)),Vector((.411,.219,1))):
  direction.normalize();origin=point.copy();hits=0
  for _ in range(50):
   hit,n,idx,d=source_bvh.ray_cast(origin,direction)
   if hit is None:break
   hits+=1;origin=hit+direction*1e-6
  votes+=hits%2
 return votes>=2
radial_count=8;ring_count=7
for side in ['L','R']:
 names=['RearUpper.'+side,'RearLower.'+side,'RearAnkle.'+side,'RearPaw.'+side]
 joints=[Vector(centers[n]) for n in names]
 points=[joints[0],joints[0].lerp(joints[1],.5),joints[1],joints[1].lerp(joints[2],.5),joints[2],joints[2].lerp(joints[3],.5),joints[3]]
 points[4]=points[3]*.25+joints[2]*.5+points[5]*.25
 radii=[.023,.030,.030,.034,.032,.030,.028]
 weightlist=[{names[0]:1},{names[0]:1},{names[0]:.5,names[1]:.5},{names[1]:1},{names[1]:.5,names[2]:.5},{names[2]:1},{names[3]:1}]
 offset=len(shinverts)
 for ri,(point,radius,ww) in enumerate(zip(points,radii,weightlist)):
  tangent=(points[min(ri+1,ring_count-1)]-points[max(ri-1,0)]).normalized();u=Vector((1,0,0));u=(u-tangent*u.dot(tangent)).normalized();v=tangent.cross(u).normalized()
  for az in range(radial_count):
   radial=u*math.cos(az*math.tau/radial_count)+v*math.sin(az*math.tau/radial_count);rr=radius
   while not inside_source(point+radial*rr) and rr>.001:rr*=.8
   shinverts.append(point+radial*rr);shinweights.append(ww);shintargets.append(point+radial*rr)
 for row in range(ring_count-1):
  for col in range(radial_count):
   a=offset+row*radial_count+col;b=offset+row*radial_count+(col+1)%radial_count;c=b+radial_count;d=a+radial_count
   shinfaces.extend(((a,b,c),(a,c,d)))
 top=offset+(ring_count-1)*radial_count
 for i in range(1,radial_count-1):shinfaces.extend(((offset,offset+i+1,offset+i),(top,top+i,top+i+1)))
sm=bpy.data.meshes.new('Hind shins • hidden in seated rest');sm.from_pydata(shinverts,[],shinfaces);sm.update();shin=bpy.data.objects.new(kind.capitalize()+'Cat_HindShins',sm);coll.objects.link(shin);shin.parent=rig
hexcolor={'orange':'f6a457','calico':'fff4e6','black':'35303c','tabby':'b09a80'}[kind]
srgb=[int(hexcolor[i:i+2],16)/255 for i in (0,2,4)];linear=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in srgb]
material=bpy.data.materials.new('Hidden hind shins • approved coat');material.use_nodes=True;shader=material.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(*linear,1);shader.inputs['Roughness'].default_value=.88;sm.materials.append(material)
for p in sm.polygons:p.use_smooth=True
for name in centers:
 if name!='Root':shin.vertex_groups.new(name=name)
for i,ww in enumerate(shinweights):
 for name,w in ww.items():shin.vertex_groups[name].add([i],w,'REPLACE')
basis=shin.shape_key_add(name='Seated hidden basis');fullness=shin.shape_key_add(name='Walk calf phase 0')
for dst,point in zip(fullness.data,shintargets):dst.co=point
fullness.value=0
mod=shin.modifiers.new('Walk hind limb chain','ARMATURE');mod.object=rig
meshes.append(shin)
print('HIDDEN_SHINS',len(shinfaces),'triangles',len(shinverts),'vertices',flush=True)

rig['catWalkRadius']=.710;rig['catWalkStride']=.40;rig['catWalkDuration']=1.6;rig['catWalkForward']='+Z';rig['catWalkStanceFraction']=.62

# Every deform bone has the same local axes as the model. Pose matrices are easy to audit.
def bone(name, transform):
 rig.pose.bones[name].matrix=transform@rig.data.bones[name].matrix_local
 rig.pose.bones[name].scale=(.70,.70,.70) if name.startswith('Haunch.') else (1,1,1)
def at(name,target,R=None):
 c=Vector(centers[name]);return Matrix.Translation(Vector(target))@(R or Matrix.Identity(4))@Matrix.Translation(-c)
def segment(name,restend,start,end):
 c=Vector(centers[name]);v=Vector(restend)-c;w=Vector(end)-Vector(start)
 q=v.rotation_difference(w)
 return Matrix.Translation(Vector(start))@q.to_matrix().to_4x4()@Matrix.Translation(-c)
def knee_ik(start,target,upper,lower,bend):
 delta=target-start;length=delta.length;direction=delta.normalized()
 assert length<upper+lower,('Unreachable paw',length,upper+lower)
 along=(length*length+upper*upper-lower*lower)/(2*length)
 height=math.sqrt(max(0,upper*upper-along*along));axis=Vector(bend);axis=(axis-direction*axis.dot(direction)).normalized()
 return start+direction*along+axis*height
def foot(q):
 q%=1;stance=.62;span=.40*stance
 if q<stance:return -span/2+span*q/stance,0
 t=(q-stance)/(1-stance);a=(1-math.cos(math.pi*t))/2
 return span/2-span*a,.068*math.sin(math.pi*t)**1.5

def pose(t):
 phase=t/1.6;ang=2*math.pi*phase
 bob=.006*(1-math.cos(2*ang));roll=.018*math.sin(ang)
 R=Matrix.Rotation(math.radians(65),4,'X')@Matrix.Rotation(roll,4,'Y')
 pelvis=Vector((.006*math.sin(ang),.12,.365+bob));B=Matrix.Translation(pelvis)@R@Matrix.Translation(-Vector(centers['Body']))
 bone('Body',B)
 hp=B@Vector(centers['Head'])+Vector((0,.08,.13));bone('Head',at('Head',hp,Matrix.Rotation(roll*.5,4,'Y')))
 for side,s in [('L',-1),('R',1)]:
  for leg in ['Front','Rear']:
   n=leg+'Upper.'+side; lo=leg+'Lower.'+side; pa=leg+'Paw.'+side
   ph=phase+(0 if side=='L' else .5)+(0 if leg=='Front' else .25)
   dy,lift=foot(ph)
   start=B@Vector(centers[n]); base_y=-.18 if leg=='Front' else .095
   if leg=='Rear':start.z-=.003
   target=Vector((s*(.095 if leg=='Front' else .162),base_y+dy,.044+lift))
   if leg=='Front':
    length1=(Vector(centers[lo])-Vector(centers[n])).length;length2=(Vector(centers[pa])-Vector(centers[lo])).length
    knee=knee_ik(start,target,length1,length2,(0,1,0))
    bone(n,segment(n,centers[lo],start,knee));bone(lo,segment(lo,centers[pa],knee,target))
   else:
    ankle='RearAnkle.'+side;length1=(Vector(centers[lo])-Vector(centers[n])).length;length2=(Vector(centers[ankle])-Vector(centers[lo])).length
    length3=(Vector(centers[pa])-Vector(centers[ankle])).length
    hock=target+Vector((0,.08,.07)).normalized()*length3
    knee=knee_ik(start,hock,length1,length2,(0,-1,0))
    bone(n,segment(n,centers[lo],start,knee));bone(lo,segment(lo,centers[ankle],knee,hock));bone(ankle,segment(ankle,centers[pa],hock,target))
    h='Haunch.'+side;ht=(start+knee)*.5+Vector((0,.02,.01));hq=(Vector(centers[lo])-Vector(centers[n])).rotation_difference(knee-start);bone(h,at(h,ht,hq.to_matrix().to_4x4()))
   bone(pa,at(pa,target))
 tr=B@Vector(centers['TailRoot'])
 chord=Vector(tail[-1]-tail[0]);current=R.to_3x3()@chord;desired=Vector((.025*math.sin(ang),chord.length,.035))
 tailR=current.rotation_difference(desired).to_matrix().to_4x4()@R
 tailT=Matrix.Translation(tr)@tailR@Matrix.Translation(-Vector(centers['TailRoot']))
 bone('TailRoot',tailT)
 bpy.context.view_layer.update()
scene.render.fps=30;scene.frame_start=0;scene.frame_end=48
previous_quaternions={}
for f in sorted(set(range(0,49,4))|{5.76,17.76,29.76,41.76}):
 scene.frame_set(int(f),subframe=f-int(f));pose(f/30)
 for p in rig.pose.bones:
  if p.name=='Root':continue
  if p.name in previous_quaternions and p.rotation_quaternion.dot(previous_quaternions[p.name])<0:p.rotation_quaternion.negate()
  previous_quaternions[p.name]=p.rotation_quaternion.copy()
  p.keyframe_insert('location',frame=f,group=p.name);p.keyframe_insert('rotation_quaternion',frame=f,group=p.name)
  if p.name.startswith('Haunch.'):p.keyframe_insert('scale',frame=f,group=p.name)
action=rig.animation_data.action;action.name='Walk'
for curve in action.fcurves:
 for k in curve.keyframe_points:k.interpolation='LINEAR'
scene.frame_set(0)
# Four small periodic corrective poses maintain calf volume through the gait.
calf_keys=[fullness]+[shin.shape_key_add(name='Walk calf phase '+str(i)) for i in range(1,4)]
for sample,key in enumerate(calf_keys):
 scene.frame_set(sample*12)
 for side,sgn in [('L',-1),('R',1)]:
  names=['RearUpper.'+side,'RearLower.'+side,'RearAnkle.'+side,'RearPaw.'+side]
  transforms={name:rig.pose.bones[name].matrix@rig.data.bones[name].matrix_local.inverted() for name in names}
  joints=[transforms[name]@Vector(centers[name]) for name in names]
  points=[joints[0],joints[0].lerp(joints[1],.5),joints[1],joints[1].lerp(joints[2],.5),joints[2],joints[2].lerp(joints[3],.5),joints[3]]
  points[4]=points[3]*.25+joints[2]*.5+points[5]*.25
  for ri,center in enumerate(points):
   tangent=(points[min(ri+1,ring_count-1)]-points[max(ri-1,0)]).normalized();u=Vector((1,0,0));v=tangent.cross(u).normalized();u=v.cross(tangent).normalized()
   radius=[.034,.040,.043,.042,.038,.035,.032][ri]
   for col in range(radial_count):
    index=(0 if side=='L' else ring_count*radial_count)+ri*radial_count+col
    desired=center+(u*math.cos(col*math.tau/radial_count)+v*math.sin(col*math.tau/radial_count))*radius
    blended=Matrix(((0,0,0,0),)*4)
    for name,weight in shinweights[index].items():blended+=transforms[name]*weight
    key.data[index].co=blended.inverted()@desired
for key in calf_keys:key.value=0
scene.frame_set(0)
# Test export from rest pose; exporter reads Walk action separately.
for o in bpy.context.selected_objects:o.select_set(False)
rig.select_set(True)
for o in meshes:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(work/(kind+'-walk.blend')),compress=True)
bpy.ops.export_scene.gltf(filepath=str(work/(kind+'-walk-raw.glb')),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_image_format='JPEG',export_jpeg_quality=90,export_image_quality=90,export_animations=True,export_optimize_animation_size=True,export_optimize_animation_keep_anim_armature=False,export_animation_mode='ACTIONS',export_force_sampling=False,export_frame_range=True,export_rest_position_armature=True,export_morph=True,export_morph_normal=True,export_extras=True,export_cameras=False,export_lights=False)
from add_calf_phases import append_walk_fullness
append_walk_fullness(work/(kind+'-walk-raw.glb'))
from append_body_walk import append_body_walk
append_body_walk(work/(kind+'-walk-raw.glb'))
print('WALK_EXPORT',str(work/(kind+'-walk-raw.glb')),flush=True)
