"""Bounded mobile quantization; original images are never recompressed."""
import json,sys
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'assets/cats'));import compact_skin_glb as c
p=Path(sys.argv[1]);d,old=c.parse_glb(p.read_bytes());b=bytearray(old);done={};report=[]
def convert(holder,key,ctype,scale=None,step=None):
 index=holder[key]
 cachekey=(index,ctype,scale,step)
 if cachekey in done:holder[key]=done[cachekey];return
 a=d['accessors'][index];values=np.array(c.accessor_values(d,old,index,normalized=True),dtype=np.float64)
 if step:
  decoded=np.rint(values/step)*step;payload=decoded.astype('<f4');normalized=False
 else:
  assert np.max(values)<=1+1e-7 and np.min(values)>=(-1 if ctype==5122 else 0)-1e-7,(key,values.min(),values.max())
  payload=np.rint(values*scale).astype('<i2' if ctype==5122 else '<u2');decoded=payload.astype(float)/scale;normalized=True
 storage=payload;view_meta={}
 if ctype==5122 and payload.shape[1]==3:
  storage=np.zeros((len(payload),4),dtype='<i2');storage[:,:3]=payload;view_meta={'byteStride':8,'target':34962}
 b.extend(b'\0'*((-len(b))%4));view=len(d['bufferViews']);d['bufferViews'].append({'buffer':0,'byteOffset':len(b),'byteLength':storage.nbytes,**view_meta});b.extend(storage.tobytes())
 aa=dict(a,bufferView=view,componentType=ctype);aa.pop('byteOffset',None);aa.pop('sparse',None);aa['min']=payload.min(axis=0).tolist();aa['max']=payload.max(axis=0).tolist()
 if normalized:aa['normalized']=True
 else:aa.pop('normalized',None)
 new=len(d['accessors']);d['accessors'].append(aa);holder[key]=new;done[cachekey]=new;report.append({'attribute':key,'source':index,'count':a['count'],'maxAbsError':float(np.abs(values-decoded).max()),'componentType':ctype,'normalized':normalized})
for mesh in d['meshes']:
 for primitive in mesh['primitives']:
  convert(primitive['attributes'],'POSITION',5122,32767)
  for key in ['TEXCOORD_0','TEXCOORD_1']:
   if key in primitive['attributes']:convert(primitive['attributes'],key,5123,65535)
  for target in primitive.get('targets',[]):
   if 'POSITION' in target:convert(target,'POSITION',5122,32767)
   if 'NORMAL' in target:convert(target,'NORMAL',5126,step=1/16384)
d['buffers'][0]['byteLength']=len(b)
result,compaction=c.compact(c.write_glb(d,b))
out=Path(sys.argv[2]);out.write_bytes(result);out.with_suffix('.json').write_text(json.dumps({'attributes':report,'compaction':compaction},indent=2)+'\n');print(out,len(result));print(json.dumps(report,indent=2))
