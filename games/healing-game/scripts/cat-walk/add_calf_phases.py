import json,struct,math
from pathlib import Path

def append_walk_fullness(path):
 p=Path(path);raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);binary=bytearray(raw[28+n:]);walk=next(a for a in doc['animations'] if a['name']=='Walk');node=next(i for i,n in enumerate(doc['nodes']) if n.get('name','').endswith('_HindShins'))
 mesh=doc['meshes'][doc['nodes'][node]['mesh']];mesh['weights']=[0.]*4;doc['nodes'][node]['weights']=[0.]*4
 timing=next(s['input'] for s in walk['samplers']);a=doc['accessors'][timing];v=doc['bufferViews'][a['bufferView']];values=struct.unpack_from('<'+'f'*a['count'],binary,v.get('byteOffset',0)+a.get('byteOffset',0));duration=values[-1];weights=[]
 for time in values:
  phase=(time/duration*4)%4;i=int(phase);f=phase-i;row=[0.]*4;row[i]=1-f;row[(i+1)%4]=f;weights.extend(row)
 binary.extend(b'\0'*((-len(binary))%4));offset=len(binary);payload=struct.pack('<'+'f'*len(weights),*weights);binary.extend(payload);view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(payload)});accessor=len(doc['accessors']);doc['accessors'].append({'bufferView':view,'componentType':5126,'count':len(weights),'type':'SCALAR','min':[0.0],'max':[1.0]});sampler=len(walk['samplers']);walk['samplers'].append({'input':timing,'output':accessor,'interpolation':'LINEAR'});walk['channels'].append({'sampler':sampler,'target':{'node':node,'path':'weights'}})
 doc['buffers'][0]['byteLength']=len(binary);binary.extend(b'\0'*((-len(binary))%4));js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);p.write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary)
