"""Curved completions of existing anatomical parts; preserves original exterior."""
import math
import numpy as np
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt
from mathutils.bvhtree import BVHTree

def rounded_caps(data, mesh):
    surface=BVHTree.FromPolygons([v.co for v in mesh.vertices],[tuple(p.vertices) for p in mesh.polygons],all_triangles=True)
    def source_inside(p):
        votes=0
        for ray in [(1,.317,.211),(.231,1,.419),(.441,.217,1)]:
            ray=Vector(ray).normalized();origin=Vector(p);crossings=0
            for _ in range(64):
                hit,_,_,_=surface.ray_cast(origin,ray)
                if hit is None:break
                crossings+=1;origin=hit+ray*1e-6
            votes+=crossings%2
        return votes>=2
    def inset(p):
        p=Vector(p)
        hit,n,_,d=surface.find_nearest(p)
        if not source_inside(p) or d<.002:
            return hit-n*.003
        return p
    def primitives(label):
        s=-1 if label.endswith('.L') else 1
        if label=='Body':return [((0,.047,.235),(.184,.145,.221),0),((0,.008,.398),(.144,.12,.214),0),((0,-.028,.49),(.123,.106,.147),0)]
        if label.startswith('Haunch'):return [((s*.137,.027,.157),(.096,.127,.143),0)]
        if label.startswith('RearPaw'):return [((s*.162,-.054,.045),(.065,.090,.043),0)]
        if label.startswith('Front'):return [((s*.076,-.105,.245),(.047,.054,.204),math.radians(-8)),((s*.075,-.134,.105),(.043,.052,.088),0),((s*.077,-.165,.044),(.057,.077,.044),0)]
        return []
    def project(p,label,hidden=True,direction=None):
        shapes=primitives(label)
        if not shapes:return Vector(p)
        p=np.asarray(p,dtype=float).copy()
        if direction is not None:
            direction=np.asarray(direction,dtype=float);direction/=np.linalg.norm(direction)
            exits=[]
            for c,r,a in shapes:
                c=np.array(c);r=np.array(r);co,si=math.cos(a),math.sin(a)
                R=np.array(((1,0,0),(0,co,-si),(0,si,co)))
                o=(R.T@(p-c))/r;d=(R.T@direction)/r
                A=d@d;B=2*(o@d);C=o@o-1;disc=B*B-4*A*C
                if disc>=0:
                    lo=(-B-math.sqrt(disc))/(2*A);hi=(-B+math.sqrt(disc))/(2*A)
                    if hi>-.02 and lo<.04:exits.append(hi)
            if exits:
                target=p+direction*max(exits)
                return inset(target) if hidden else Vector(target)
        for _ in range(12):
            choices=[]
            for c,r,a in shapes:
                c=np.array(c);r=np.array(r);co,si=math.cos(a),math.sin(a)
                R=np.array(((1,0,0),(0,co,-si),(0,si,co)))
                v=R.T@(p-c);rho=np.linalg.norm(v/r);grad=R@(v/(r*r))/max(rho,1e-8)
                d=(rho-1)/max(np.linalg.norm(grad),1e-8);n=grad/max(np.linalg.norm(grad),1e-8)
                choices.append((d,n))
            d,n=min(choices,key=lambda x:x[0]);p-=n*max(-.04,min(.04,d))
            if abs(d)<1e-6:break
        return inset(p) if hidden else Vector(p)
    cap_count=0;data['walk_targets']={}
    for chart in data['cap_charts']:
        n=len(chart['source_ring']);positions=[data['verts'][i] for i in chart['mapped_ring']]
        direction=sum((a.cross(b) for a,b in zip(positions,positions[1:]+positions[:1])),Vector()).normalized()
        points=np.asarray(chart['projected_coords']);samples=[Vector(p) for p in points];base_triangles=list(chart['triangles'])
        def bary(q,tri):
            a,b,c=points[list(tri)];A=np.column_stack((b-a,c-a))
            try:uv=np.linalg.solve(A,q-a)
            except np.linalg.LinAlgError:return None
            w=np.array((1-uv.sum(),*uv));return w if min(w)>1e-5 else None
        initial={i:p.copy() for i,p in enumerate(positions)}
        triangles=list(base_triangles)
        for refinement in range(6 if n>=40 else 3 if n>=20 else 1):
            edges={}
            for ti,tri in enumerate(triangles):
                for a,b in zip(tri,tri[1:]+tri[:1]):edges.setdefault(tuple(sorted((a,b))),[]).append(ti)
            candidates=[((initial[a]-initial[b]).length,a,b) for (a,b),faces in edges.items() if len(faces)==2]
            if not candidates:break
            length,a,b=max(candidates)
            if length<.045:break
            new=len(samples);samples.append((samples[a]+samples[b])*.5);initial[new]=(initial[a]+initial[b])*.5
            replacement=[]
            for tri in triangles:
                if a not in tri or b not in tri:replacement.append(tri);continue
                for k in range(3):
                    x,y,z=tri[k],tri[(k+1)%3],tri[(k+2)%3]
                    if {x,y}=={a,b}:replacement.extend(((x,new,z),(new,y,z)));break
            triangles=replacement
        if len(samples)==n:
            ti=max(range(len(triangles)),key=lambda ti:(positions[triangles[ti][1]]-positions[triangles[ti][0]]).cross(positions[triangles[ti][2]]-positions[triangles[ti][0]]).length)
            tri=triangles.pop(ti);new=len(samples);samples.append(sum((samples[i] for i in tri),Vector((0,0)))/3);initial[new]=sum((positions[i] for i in tri),Vector())/3
            triangles.extend(((tri[0],tri[1],new),(tri[1],tri[2],new),(tri[2],tri[0],new)))
        mapped=list(chart['mapped_ring'])
        for index in range(n,len(samples)):
            new_index=len(data['verts']);mapped.append(new_index)
            data['verts'].append(project(initial[index],chart['label'],True,direction))
            data['walk_targets'][new_index]=project(initial[index],chart['label'],False,direction)
            data['vertexpart'][new_index]=chart['label'];data['vertex_source'][new_index]=None;data['vertex_strength'][new_index]=1.
        chart['mapped_vertices']=mapped;chart['triangles']=triangles
        chart['projected_coords']=[tuple(p) for p in samples]
        coords=np.asarray(samples);lo=coords.min(axis=0);span=max(np.ptp(coords,axis=0));chart['uv_coords']=[tuple(p) for p in (coords-lo)/span]
        cap_count+=len(mapped)-n
    # Rebuild added faces, retaining all original exterior data.
    data['faces']=data['faces'][:data['original_face_count']];data['uvs']=data['uvs'][:data['original_loop_count']];data['normals']=data['normals'][:data['original_loop_count']]
    for chart in data['cap_charts']:
        mapped=chart['mapped_vertices'];chart['face_indices']=[];chart['loop_indices']=[]
        for tri in chart['triangles']:
            ids=[mapped[i] for i in tri];a,b,c=[data['verts'][i] for i in ids];normal=(b-a).cross(c-a).normalized()
            chart['face_indices'].append(len(data['faces']));data['faces'].append(ids)
            chart['loop_indices'].append(list(range(len(data['uvs']),len(data['uvs'])+3)));data['uvs'] += [None]*3;data['normals'] += [tuple(normal)]*3
    data['cap_refinement']={'newInteriorVertices':cap_count,'method':'anatomical curved surface completion'}
    data['walk_project']=lambda point,label: project(point,label,False)
    return data
