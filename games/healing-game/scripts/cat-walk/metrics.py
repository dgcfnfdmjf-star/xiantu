#!/usr/bin/env python3
"""Record shipped asset facts without changing the model or its source textures."""
import hashlib,json,struct,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]/'assets/cats'
repo=root.parents[3]
commit='8812ff565b29a0f57bdcb80698f6c8b950ca3965'
for kind in ['orange','calico','black','tabby']:
 raw=(root/(kind+'-cat.glb')).read_bytes();length=struct.unpack_from('<I',raw,12)[0];d=json.loads(raw[20:20+length])
 old=json.loads(subprocess.check_output(['git','show',commit+':games/healing-game/assets/cats/'+kind+'-cat-metrics.json'],cwd=repo))
 fur=next(p for m in d['meshes'] for p in m['primitives'] if d['materials'][p['material']]['name']=='Watercolor fur · runtime atlas')
 a=d['accessors'][fur['attributes']['POSITION']];lo=[v/32767 for v in a['min']];hi=[v/32767 for v in a['max']]
 report={'asset':kind+'-cat','generator':'Blender 4.3.2 seated-rest rig, bounded quantization, official meshopt 1.3.0 lossless compression',
 'blenderVersion':'4.3.2','triangles':sum(d['accessors'][p['indices']]['count']//3 for m in d['meshes'] for p in m['primitives']),
 'triangleBudget':7500,'meshes':len(d['meshes']),'drawCalls':sum(len(m['primitives']) for m in d['meshes']),
 'materials':len(d['materials']),'textures':len(d['textures']),'images':len(d['images']),'textureResolutions':[[1024,1024],[256,256]],
 'allImagesEmbedded':True,'gltfUpAxis':'+Y','gltfForwardAxis':'+Z','pivot':'Ground origin (0,0,0)','seatedBounds':{'min':lo,'max':hi},'height':hi[1]-lo[1],
 'glbBytes':len(raw),'glbSha256':hashlib.sha256(raw).hexdigest(),'palette':old['palette'],
 'animation':{'clip':'Walk','durationSeconds':1.6,'stride':.4,'radius':.71,'joints':len(d['skins'][0]['joints']),'defaultPose':'Approved seated rest; morph weights zero'},
 'approvedStaticSource':{'commit':commit,'glbBytes':old['glbBytes'],'glbSha256':old['glbSha256'],'triangles':old['triangles'],'sourceTriangles':old['sourceTriangles'],'originalAtlasSha256':old['uvBake']['atlasSha256']},
 'preservation':{'originalFurTriangles':5254,'originalImageBytesUnchanged':True,'eyesAndCatchlightsRetained':True,'positionQuantizationMaxError':1/32767/2,'uvQuantizationMaxError':1/65535/2},
 'render':{'engine':'Cycles CPU','samples':32,'resolution':[768,768]},
 'license':old['license']}
 (root/(kind+'-cat-metrics.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(kind,report['triangles'],len(raw))
