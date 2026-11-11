"""Repair explicit walking NORMAL deltas and keep default cap edges tucked inside.
Works on raw Blender float skin/morph export, before lossless compression.
"""
import json,struct,sys
from pathlib import Path
import numpy as np
p=Path(sys.argv[1]);raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);b=bytearray(raw[28+n:])
types={5121:np.dtype('u1'),5123:np.dtype('<u2'),5125:np.dtype('<u4'),5126:np.dtype('<f4')}
widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def acc(i):
 a=d['accessors'][i];width=widths[a['type']];dt=types[a['componentType']];v=np.zeros((a['count'],width),dt)
 if 'bufferView' in a:
  view=d['bufferViews'][a['bufferView']];off=view.get('byteOffset',0)+a.get('byteOffset',0);stride=view.get('byteStride',width*dt.itemsize);v=np.ndarray((a['count'],width),dtype=dt,buffer=b,offset=off,strides=(stride,dt.itemsize)).copy()
 if 'sparse' in a:
  s=a['sparse'];ix=s['indices'];iv=d['bufferViews'][ix['bufferView']];indices=np.frombuffer(b,dtype=types[ix['componentType']],count=s['count'],offset=iv.get('byteOffset',0)+ix.get('byteOffset',0));val=s['values'];vv=d['bufferViews'][val['bufferView']];values=np.frombuffer(b,dtype=dt,count=s['count']*width,offset=vv.get('byteOffset',0)+val.get('byteOffset',0)).reshape(-1,width);v[indices]=values
 return v

def put(values,kind='VEC3'):
 values=np.array(values,dtype='<f4');b.extend(b'\0'*((-len(b))%4));view=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':values.nbytes});b.extend(values.tobytes());i=len(d['accessors']);d['accessors'].append({'bufferView':view,'componentType':5126,'type':kind,'count':len(values),'min':values.min(axis=0).tolist(),'max':values.max(axis=0).tolist()});return i
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'assets/cats'))
import compact_skin_glb as compact
old,oldbin=compact.parse_glb(Path(sys.argv[3]).read_bytes())
oldfur=next(q for m in old['meshes'] for q in m['primitives'] if old['materials'][q['material']]['name']=='Watercolor fur · runtime atlas')
for m in d['meshes']:
 for q in m['primitives']:
  name=d['materials'][q['material']]['name']
  if name=='Watercolor fur · runtime atlas':
   restored,report=compact.restore_split_surface_normals(old,oldbin,oldfur,d,b,q)
   q['attributes']['NORMAL']=put(np.frombuffer(restored,dtype='<f4').reshape(-1,3));print('RESTORE_NORMALS',report)
  if name=='Sepia facial detail':
   a=q['attributes'];pos=acc(a['POSITION']);joints=acc(a['JOINTS_0']);weights=acc(a['WEIGHTS_0'])
   for i,point in enumerate(pos):
    if point[1]>=.14:continue
    bone='FrontPaw.'+('L' if point[0]<0 else 'R');index=next(i for i,node in enumerate(d['skins'][0]['joints']) if d['nodes'][node]['name']==bone)
    joints[i]=[index,0,0,0];weights[i]=[1,0,0,0]
   aa=d['accessors'][a['JOINTS_0']];vv=d['bufferViews'][aa['bufferView']];off=vv.get('byteOffset',0)+aa.get('byteOffset',0);stride=vv.get('byteStride',joints.shape[1]*joints.dtype.itemsize)
   for i,row in enumerate(joints):b[off+i*stride:off+i*stride+row.nbytes]=row.tobytes()
   q['attributes']['WEIGHTS_0']=put(weights,'VEC4')
parts=[];smooth={};affected=set();basisNormals={}
for m in d['meshes']:
 for q in m['primitives']:
  name=d['materials'][q['material']]['name']
  if name not in ['Watercolor fur · runtime atlas','Anatomical closures • transferred fur']:continue
  if name=='Watercolor fur · runtime atlas':q['attributes'].pop('COLOR_0',None)
  a=q['attributes'];pos=acc(a['POSITION']);normal=acc(a['NORMAL']);delta=acc(q['targets'][0]['POSITION']);j=acc(a['JOINTS_0']);w=acc(a['WEIGHTS_0']);ix=acc(q['indices']).flatten()
  keys=[tuple(np.round(np.concatenate((pp,jj,ww)),7)) for pp,jj,ww in zip(pos,j,w)]
  target=pos+delta
  for i,key in enumerate(keys):
   if name.startswith('Watercolor'):basisNormals[key]=normal[i]
  for indices in ix.reshape(-1,3):
   pts=target[indices];face=np.cross(pts[1]-pts[0],pts[2]-pts[0])
   for i in indices:
    key=keys[i];smooth[key]=smooth.get(key,np.zeros(3))+face
    if np.linalg.norm(delta[indices])>1e-5 or name.startswith('Anatomical'):affected.add(key)
  parts.append((q,name,pos,normal,delta,keys))
for q,name,pos,normal,delta,keys in parts:
 target=pos+delta;norm=normal.copy()
 for i,key in enumerate(keys):
  if key in affected:
   norm[i]=smooth[key]/max(np.linalg.norm(smooth[key]),1e-8)
 # Basis cap is just inside the original shell. Its animated rim lands exactly
 # on the corresponding exterior rim, so the full Walk surface stays joined.
 if name.startswith('Anatomical'):
  for i,key in enumerate(keys):
   weights=key[7:11];joints=key[3:7];slot=int(np.argmax(weights));joint=d['nodes'][d['skins'][0]['joints'][int(joints[slot])]]['name']
   sign=-1 if joint.endswith('.L') or joint.endswith('L') else 1
   if joint.startswith('Front'):
    height=pos[i][1];center=np.array((sign*.076,height,.105))
    if height<.10:center=np.array((sign*.077,.044,.165))
   elif joint.startswith('Haunch'):center=np.array((sign*.137,.157,-.027))
   elif joint.startswith('Rear'):center=np.array((sign*.162,.045,.054))
   elif joint.startswith('Tail'):center=pos[i]-basisNormals.get(key,normal[i])*.02
   else:center=np.array((0,.28,-.025))
   pos[i]=center+(pos[i]-center)*.85
  q['attributes']['POSITION']=put(pos);q['targets'][0]['POSITION']=put(target-pos)
 q['targets'][0]['NORMAL']=put(norm-normal)
d['buffers'][0]['byteLength']=len(b);b.extend(b'\0'*((-len(b))%4));js=json.dumps(d,separators=(',',':')).encode();js+=b' '*((-len(js))%4);out=Path(sys.argv[2]);out.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(b))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b);print(out,len(b),len(affected))
