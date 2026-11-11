import sys,json,struct
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'assets/cats'));import compact_skin_glb as c
p=Path(sys.argv[1]);doc,old=c.parse_glb(p.read_bytes());binary=bytearray(old);widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16};types={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
# Blender may emit two identical texture references for black fur and eyes.
# Share the same image/sampler object, as the approved seated asset did.
textures=[];texture_map={}
for i,texture in enumerate(doc.get('textures',[])):
 if texture not in textures:textures.append(texture)
 texture_map[i]=textures.index(texture)
def remap_textures(value):
 if isinstance(value,dict):
  for key,child in value.items():
   if key.endswith('Texture') and isinstance(child,dict) and 'index' in child:child['index']=texture_map[child['index']]
   else:remap_textures(child)
 elif isinstance(value,list):
  for child in value:remap_textures(child)
remap_textures(doc.get('materials',[]));doc['textures']=textures
for a in doc['accessors']:
 if 'sparse' not in a:continue
 width=widths[a['type']];dtype=np.dtype(types[a['componentType']]);values=np.zeros((a['count'],width),dtype)
 if 'bufferView' in a:
  v=doc['bufferViews'][a['bufferView']];values[:]=np.ndarray((a['count'],width),dtype,buffer=old,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dtype.itemsize),dtype.itemsize))
 s=a.pop('sparse');ix=s['indices'];v=doc['bufferViews'][ix['bufferView']];indices=np.frombuffer(old,types[ix['componentType']],s['count'],v.get('byteOffset',0)+ix.get('byteOffset',0));sv=s['values'];v=doc['bufferViews'][sv['bufferView']];payload=np.frombuffer(old,dtype,s['count']*width,v.get('byteOffset',0)+sv.get('byteOffset',0)).reshape(-1,width);values[indices]=payload
 binary.extend(b'\0'*((-len(binary))%4));view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':values.nbytes});binary.extend(values.tobytes());a['bufferView']=view;a.pop('byteOffset',None)
doc['buffers'][0]['byteLength']=len(binary);result,report=c.compact(c.write_glb(doc,binary),compact_normals=True);output=Path(sys.argv[2]);output.write_bytes(result);output.with_suffix('.json').write_text(json.dumps(report,indent=2)+'\n');print(output,len(result));print(json.dumps({k:v for k,v in report.items() if k not in ['baselineGeometry','animationOptimization']},indent=2))
