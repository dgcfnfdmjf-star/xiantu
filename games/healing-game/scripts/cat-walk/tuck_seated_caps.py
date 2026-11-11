import json,struct,sys
from pathlib import Path
import numpy as np
p=Path(sys.argv[1]);factor=.5;raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+n]);b=bytearray(raw[28+n:])
q=next(q for m in d['meshes'] for q in m['primitives'] if d['materials'][q['material']]['name'].startswith('Anatomical'))
def a(i):
 x=d['accessors'][i];v=d['bufferViews'][x['bufferView']];return np.ndarray((x['count'],3),'<f4',buffer=b,offset=v.get('byteOffset',0)+x.get('byteOffset',0),strides=(v.get('byteStride',12),4))
pos=a(q['attributes']['POSITION']);delta=a(q['targets'][0]['POSITION']);target=pos.copy()+delta.copy();c=np.array([0,.25,0]);pos[:]=c+(pos-c)*factor;delta[:]=target-pos
for i in [q['attributes']['POSITION'],q['targets'][0]['POSITION']]:v=a(i);d['accessors'][i]['min']=v.min(axis=0).tolist();d['accessors'][i]['max']=v.max(axis=0).tolist()
js=json.dumps(d,separators=(',',':')).encode();js+=b' '*((-len(js))%4);out=Path(sys.argv[2]);out.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(b))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b);print(out)
