import json,struct
from pathlib import Path

def append_body_walk(path):
 p=Path(path);raw=p.read_bytes();jlen=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+jlen]);offset=20+jlen;blen=struct.unpack_from('<I',raw,offset)[0];binary=bytearray(raw[offset+8:offset+8+blen]);walk=next(a for a in doc['animations'] if a['name']=='Walk');node=next(i for i,n in enumerate(doc['nodes']) if n.get('name','').endswith('_Fur'))
 mesh=doc['meshes'][doc['nodes'][node]['mesh']];mesh['weights']=[0.0];doc['nodes'][node]['weights']=[0.0]
 timing=next(s['input'] for s in walk['samplers']);count=doc['accessors'][timing]['count'];binary.extend(b'\0'*((-len(binary))%4));at=len(binary);payload=struct.pack('<'+'f'*count,*([1.0]*count));binary.extend(payload)
 view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':at,'byteLength':len(payload)});accessor=len(doc['accessors']);doc['accessors'].append({'bufferView':view,'componentType':5126,'count':count,'type':'SCALAR','min':[1.0],'max':[1.0]})
 sampler=len(walk['samplers']);walk['samplers'].append({'input':timing,'output':accessor,'interpolation':'LINEAR'});walk['channels'].append({'sampler':sampler,'target':{'node':node,'path':'weights'}})
 doc['buffers'][0]['byteLength']=len(binary);binary.extend(b'\0'*((-len(binary))%4));js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);result=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary;p.write_bytes(result)
