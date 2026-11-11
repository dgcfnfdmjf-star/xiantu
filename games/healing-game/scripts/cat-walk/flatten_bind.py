import json,struct,sys,math
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation
p=Path(sys.argv[1]);raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);b=bytearray(raw[28+n:]);skin=d['skins'][0];root=next(i for i,node in enumerate(d['nodes']) if node.get('name')=='Root')
rot=Rotation.from_euler('x',-90,degrees=True);inverse=rot.inv()
widths={'SCALAR':1,'VEC3':3,'VEC4':4,'MAT4':16}
def acc(i):
 a=d['accessors'][i];v=d['bufferViews'][a['bufferView']];w=widths[a['type']];return np.ndarray((a['count'],w),dtype='<f4',buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',4*w),4)).copy()
def put(v,kind):
 v=np.array(v,dtype='<f4');b.extend(b'\0'*((-len(b))%4));view=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':v.nbytes});b.extend(v.tobytes());i=len(d['accessors']);d['accessors'].append({'bufferView':view,'componentType':5126,'count':len(v),'type':kind});return i
basis={i:Rotation.from_quat(d['nodes'][i].get('rotation',[0,0,0,1])) for i in skin['joints'] if i!=root}
for animation in d['animations']:
 for channel in animation['channels']:
  ni=channel['target']['node'];kind=channel['target']['path']
  if ni not in basis:continue
  sampler=animation['samplers'][channel['sampler']];v=acc(sampler['output'])
  if kind=='translation':v=v[:,[0,2,1]];v[:,2]*=-1;sampler['output']=put(v,'VEC3')
  if kind=='rotation':v=(rot*Rotation.from_quat(v)*basis[ni].inv()*inverse).as_quat();sampler['output']=put(v,'VEC4')
inverses=[]
for ni in skin['joints']:
 node=d['nodes'][ni];translation=node.get('translation',[0,0,0]);c=[translation[0],translation[2],-translation[1]] if ni!=root else [0,0,0]
 node['translation']=c;node.pop('rotation',None);node.pop('scale',None);m=np.eye(4);m[:3,3]=-np.array(c);inverses.append(m.T.flatten())
skin['inverseBindMatrices']=put(inverses,'MAT4')
d['buffers'][0]['byteLength']=len(b);b.extend(b'\0'*((-len(b))%4));js=json.dumps(d,separators=(',',':')).encode();js+=b' '*((-len(js))%4);out=Path(sys.argv[2]);out.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(b))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b);print(out)
