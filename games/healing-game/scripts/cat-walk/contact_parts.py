"""Fully separated anatomical components with internal caps for the approved cat.

No original face, corner UV, corner normal, or vertex position is changed.
``split_parts`` returns arrays suitable for ``Mesh.from_pydata``. Cap UVs are
None until ``place_cap_chart`` places each chart into a free atlas rectangle.
"""
from collections import defaultdict
import numpy as np


def _smooth(value):
    value = max(0.0, min(1.0, float(value)))
    return value * value * (3.0 - 2.0 * value)


def _cross2(a, b, c):
    ab, ac = b - a, c - a
    return float(ab[0] * ac[1] - ab[1] * ac[0])


def _simple_polygon(points, eps=1e-13):
    count = len(points)
    for i in range(count):
        a, b = points[i], points[(i + 1) % count]
        if float(np.linalg.norm(b - a)) < 1e-11:
            return False
        for j in range(i + 1, count):
            if j == i or j == (i + 1) % count or (j + 1) % count == i:
                continue
            c, d = points[j], points[(j + 1) % count]
            ab_c, ab_d = _cross2(a, b, c), _cross2(a, b, d)
            cd_a, cd_b = _cross2(c, d, a), _cross2(c, d, b)
            if ab_c * ab_d < -eps * eps and cd_a * cd_b < -eps * eps:
                return False
    return True


def _ear_clip(points, forbidden_diagonals=()):
    """Triangulate one simple projected ring without inserting a fan center."""
    area2 = sum(float(a[0] * b[1] - b[0] * a[1])
                for a, b in zip(points, np.roll(points, -1, axis=0)))
    if abs(area2) < 1e-14:
        raise ValueError('Cap ring has zero projected area')
    orientation = 1.0 if area2 > 0 else -1.0
    remaining = list(range(len(points)))
    triangles = []
    while len(remaining) > 3:
        ears = []
        for position, current in enumerate(remaining):
            previous, following = remaining[position - 1], remaining[(position + 1) % len(remaining)]
            if tuple(sorted((previous, following))) in forbidden_diagonals:
                continue
            a, b, c = points[[previous, current, following]]
            corner = orientation * _cross2(a, b, c)
            if corner <= 1e-16:
                continue
            occupied = False
            for other in remaining:
                if other in (previous, current, following):
                    continue
                p = points[other]
                if (orientation * _cross2(a, b, p) >= -1e-14 and
                    orientation * _cross2(b, c, p) >= -1e-14 and
                    orientation * _cross2(c, a, p) >= -1e-14):
                    occupied = True
                    break
            if not occupied:
                # Prefer compact ears instead of long diagonals through folded caps.
                span = float(np.dot(c - a, c - a))
                ears.append((span, position, (previous, current, following)))
        if not ears:
            raise ValueError('No valid projected ear; ring is folded or degenerate')
        _, position, triangle = min(ears)
        triangles.append(triangle)
        remaining.pop(position)
    triangles.append(tuple(remaining))
    return triangles


def _project_and_triangulate(points, forbidden_diagonals=()):
    points = np.asarray(points, dtype=float)
    centered = points - points.mean(axis=0)
    _, _, principal = np.linalg.svd(centered, full_matrices=False)
    newell = sum((np.cross(a, b) for a, b in zip(centered, np.roll(centered, -1, axis=0))), np.zeros(3))
    directions = [principal[-1], newell, np.array((1., 0., 0.)),
                  np.array((0., 1., 0.)), np.array((0., 0., 1.))]
    # The seam lies on a curved solid: an oblique cut can be simple when all
    # principal/axis projections overlap. Deterministic sphere coverage finds it.
    for index in range(128):
        z = 1.0 - 2.0 * (index + .5) / 128.0
        angle = 2.399963229728653 * index
        radius = np.sqrt(max(0.0, 1.0 - z * z))
        directions.append(np.array((radius * np.cos(angle), radius * np.sin(angle), z)))
    for direction in directions:
        length = np.linalg.norm(direction)
        if length < 1e-12:
            continue
        direction = direction / length
        helper = np.eye(3)[int(np.argmin(np.abs(direction)))]
        horizontal = np.cross(direction, helper)
        horizontal /= np.linalg.norm(horizontal)
        vertical = np.cross(direction, horizontal)
        projected = np.column_stack((centered @ horizontal, centered @ vertical))
        if not _simple_polygon(projected):
            continue
        try:
            triangles = _ear_clip(projected, forbidden_diagonals)
        except ValueError:
            continue
        lo = projected.min(axis=0)
        span = max(float(np.ptp(projected, axis=0).max()), 1e-12)
        chart_uv = (projected - lo) / span
        return triangles, chart_uv, projected
    raise ValueError('Cap boundary has no simple stable planar projection')


def _simple_cycles(edges):
    """Consume oriented boundary edges, splitting pinched cycles at shared vertices."""
    outgoing = defaultdict(list)
    for a, b in edges:
        outgoing[a].append(b)
    for values in outgoing.values():
        values.sort(reverse=True)
    while any(outgoing.values()):
        start = min(vertex for vertex, values in outgoing.items() if values)
        path, locations = [start], {start: 0}
        current = start
        while outgoing[current]:
            following = outgoing[current].pop()
            if following in locations:
                offset = locations[following]
                ring = path[offset:]
                if len(ring) >= 3:
                    yield ring
                for vertex in path[offset + 1:]:
                    locations.pop(vertex, None)
                path = path[:offset + 1]
                current = following
                if current == start and not outgoing[current]:
                    break
            else:
                locations[following] = len(path)
                path.append(following)
                current = following
        if len(path) > 1:
            raise ValueError(('Open anatomical boundary', path))


def split_parts(mesh, labels):
    """Fully duplicate every anatomical inter-part seam and close each component.

    Labels normally are Body, Front.L/R, Haunch.L/R, RearPaw.L/R and Tail.
    Original exterior triangles and all their corner attributes remain exact.
    Every result vertex has its part label and vertex_strength=1: there are no
    Joined vertices and no shoulder/root blend baked into this geometry helper.
    """
    if len(labels) != len(mesh.polygons):
        raise ValueError('One anatomical label is required per original polygon')
    oldverts = [v.co.copy() for v in mesh.vertices]
    incident = defaultdict(set)
    part_edges = defaultdict(list)
    for label, polygon in zip(labels, mesh.polygons):
        ids = list(polygon.vertices)
        for vertex in ids:
            incident[vertex].add(label)
        for a, b in zip(ids, ids[1:] + ids[:1]):
            part_edges[(label, min(a, b), max(a, b))].append((a, b))

    def region(index, label):
        return label

    def strength(index, label):
        return 1.0

    result = dict(verts=[], faces=[], uvs=[], normals=[], vertexpart={},
                  vertex_source={}, vertex_strength={}, vmap={}, cap_charts=[],
                  original_face_count=len(mesh.polygons), original_loop_count=len(mesh.loops))
    vmap = result['vmap']
    for label, polygon in zip(labels, mesh.polygons):
        face = []
        for source in polygon.vertices:
            part = region(source, label)
            key = (source, part)
            if key not in vmap:
                index = len(result['verts'])
                vmap[key] = index
                result['verts'].append(oldverts[source].copy())
                result['vertexpart'][index] = part
                result['vertex_source'][index] = source
                result['vertex_strength'][index] = 0.0 if part == 'Joined' else strength(source, label)
            face.append(vmap[key])
        result['faces'].append(face)
        result['uvs'].extend(tuple(mesh.uv_layers.active.data[i].uv) for i in polygon.loop_indices)
        result['normals'].extend(tuple(mesh.corner_normals[i].vector) for i in polygon.loop_indices)

    by_part = defaultdict(list)
    for (label, _, _), edges in part_edges.items():
        if len(edges) == 1:
            by_part[label].append(edges[0])
    for label in sorted(by_part):
        for source_ring in _simple_cycles(by_part[label]):
            if not any(region(index, label) != 'Joined' for index in source_ring):
                continue
            # Reverse the exterior boundary to give the closure opposite winding.
            source_ring = list(reversed(source_ring))
            mapped = [vmap[(index, region(index, label))] for index in source_ring]
            points = [oldverts[index] for index in source_ring]
            ring_edges = {tuple(sorted((a,b))) for a,b in zip(source_ring, source_ring[1:]+source_ring[:1])}
            forbidden = set()
            for i,a in enumerate(source_ring):
                for j in range(i+1,len(source_ring)):
                    b=source_ring[j]
                    if tuple(sorted((a,b))) not in ring_edges and (label,min(a,b),max(a,b)) in part_edges:
                        forbidden.add((i,j))
            try:
                triangles, chart_uv, projected = _project_and_triangulate(points, forbidden)
            except ValueError as error:
                raise ValueError(('Cap triangulation failed', label, len(source_ring), str(error))) from error
            normal_sums = np.zeros((len(source_ring), 3), dtype=float)
            for triangle in triangles:
                a, b, c = [np.asarray(points[i], dtype=float) for i in triangle]
                cross = np.cross(b - a, c - a)
                if np.linalg.norm(cross) < 1e-14:
                    raise ValueError(('Zero-area cap triangle', label, triangle))
                for index in triangle:
                    normal_sums[index] += cross
            lengths = np.linalg.norm(normal_sums, axis=1)
            if np.any(lengths < 1e-14):
                raise ValueError(('Undefined cap vertex normal', label))
            normal_sums /= lengths[:, None]
            chart = dict(label=label, source_ring=source_ring, mapped_ring=mapped,
                         uv_coords=[tuple(p) for p in chart_uv],
                         projected_coords=[tuple(p) for p in projected],
                         face_indices=[], loop_indices=[], triangles=triangles,
                         vertex_normals=[tuple(n) for n in normal_sums])
            for triangle in triangles:
                chart['face_indices'].append(len(result['faces']))
                result['faces'].append([mapped[i] for i in triangle])
                loop_indices = []
                for index in triangle:
                    loop_indices.append(len(result['uvs']))
                    result['uvs'].append(None)
                    result['normals'].append(tuple(normal_sums[index]))
                chart['loop_indices'].append(loop_indices)
            result['cap_charts'].append(chart)
    return result


def place_cap_chart(data, chart, origin, size):
    """Place one whole cap chart in a free atlas rectangle (normalized UV units).

    Example for an interior 5px cell: origin=((xx+.5)/1024,(yy+.5)/1024),
    size=(4/1024,4/1024). Every occurrence of a cap vertex gets identical UVs.
    """
    for triangle, loops in zip(chart['triangles'], chart['loop_indices']):
        for vertex, loop in zip(triangle, loops):
            u, v = chart['uv_coords'][vertex]
            data['uvs'][loop] = (origin[0] + u * size[0], origin[1] + v * size[1])


def refine_parts(data, original_mesh, max_new_vertices=100, max_edge_length=float("inf"),
                inside_tolerance=1e-6, inset=.0015, flat_caps=False, minimum_clearance=.0002):
    """Bisect shared cap-internal edges; keep every exterior seam unchanged.

    Call after ``split_parts`` and BEFORE atlas placement. Every inserted
    midpoint belongs only to its chart, receives part-specific skin weights,
    and is pulled inward when the original closed mesh marks it outside.
    The 7-point guard checks all triangle vertices, edge midpoints and centroid.
    Original exterior arrays remain exact. Diagnostics are in cap_refinement.
    """
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree

    surface = BVHTree.FromPolygons([v.co for v in original_mesh.vertices],
                                  [tuple(p.vertices) for p in original_mesh.polygons],
                                  all_triangles=all(len(p.vertices) == 3 for p in original_mesh.polygons))

    ray_directions = [Vector(v).normalized() for v in
                      ((1., .371, .119), (.231, 1., .513), (.419, .269, 1.))]

    def signed_distance(point):
        point = Vector(point)
        hit, normal, _, distance = surface.find_nearest(point)
        if hit is None:
            raise ValueError('Original closed surface has no nearest point')
        if distance <= inside_tolerance * .1:
            return 0.0, hit, normal
        signed = float((point - hit).dot(normal))
        # Near a concave mesh edge, the closest triangle normal can give the
        # wrong sign (even for points centimetres inside). Resolve such edge/
        # vertex cases by three deterministic rays through the original solid.
        if abs(signed) < distance * .999:
            inside_votes = 0
            for direction in ray_directions:
                origin, crossings = point.copy(), 0
                for _ in range(64):
                    crossing, _, _, _ = surface.ray_cast(origin, direction, 4.)
                    if crossing is None:
                        break
                    crossings += 1
                    origin = crossing + direction * 1e-6
                inside_votes += crossings % 2
            inside = inside_votes >= 2
            signed = -distance if inside else distance
            if not inside:
                normal = (point - hit).normalized()
        return signed, hit, normal

    def interior(point):
        point = Vector(point)
        for _ in range(8):
            distance, hit, normal = signed_distance(point)
            if distance <= -max(minimum_clearance, inset):
                return point
            point = hit - normal * max(inset, minimum_clearance * 2.0, inside_tolerance * 4.0)
        if signed_distance(point)[0] > inside_tolerance:
            raise ValueError('Cannot place cap midpoint inside original surface')
        return point

    charts = data['cap_charts']
    for chart in charts:
        chart['mapped_vertices'] = list(chart.get('mapped_vertices', chart['mapped_ring']))
        chart['triangles'] = [tuple(t) for t in chart['triangles']]
        chart['uv_coords'] = list(chart['uv_coords'])
        chart['projected_coords'] = list(chart['projected_coords'])
        for local in range(len(chart['source_ring']), len(chart['mapped_vertices'])):
            index = chart['mapped_vertices'][local]
            if signed_distance(data['verts'][index])[0] > -minimum_clearance:
                data['verts'][index] = interior(data['verts'][index])
    added = 0
    edge_splits = 0
    center_splits = 0
    blocked = set()
    while added < max_new_vertices:
        best = None
        for ci, chart in enumerate(charts):
            positions = [data['verts'][i] for i in chart['mapped_vertices']]
            incidence = defaultdict(list)
            for ti, tri in enumerate(chart['triangles']):
                for a, b in zip(tri, tri[1:] + tri[:1]):
                    incidence[tuple(sorted((a, b)))].append(ti)
                point = sum((positions[i] for i in tri), Vector()) / 3.0
                deficit = signed_distance(point)[0] + minimum_clearance
                key = (ci, 'face', tuple(tri))
                if deficit > inside_tolerance and key not in blocked:
                    area = (positions[tri[1]]-positions[tri[0]]).cross(positions[tri[2]]-positions[tri[0]]).length
                    score = (1, deficit, area, -ci, -ti)
                    if best is None or score > best[0]:
                        best = (score, ci, 'face', tuple(tri), point)
            for edge, incident in incidence.items():
                key = (ci, 'edge', edge)
                if len(incident) != 2 or key in blocked:
                    continue  # Original exterior seam remains exact.
                a, b = edge
                midpoint = (positions[a] + positions[b]) * .5
                deficit = signed_distance(midpoint)[0] + minimum_clearance
                length = (positions[a] - positions[b]).length
                if length < 2e-5:
                    continue
                if deficit <= inside_tolerance and length <= max_edge_length:
                    continue
                score = (2, max(deficit, 0.0), length, -ci, -a)
                if best is None or score > best[0]:
                    best = (score, ci, 'edge', edge, midpoint)
        if best is None:
            break
        _, ci, mode, selected, point = best
        chart = charts[ci]
        point = interior(point)
        local = len(chart['mapped_vertices'])
        replacement = []
        valid = True
        for tri in chart['triangles']:
            if mode == 'face':
                if tuple(tri) != selected:
                    replacement.append(tri)
                    continue
                changes = [(tri[0],tri[1],local), (tri[1],tri[2],local), (tri[2],tri[0],local)]
            else:
                a,b = selected
                if a not in tri or b not in tri:
                    replacement.append(tri)
                    continue
                changes = []
                for offset in range(3):
                    first, second, third = tri[offset], tri[(offset+1)%3], tri[(offset+2)%3]
                    if {first,second} == {a,b}:
                        changes = [(first,local,third),(local,second,third)]
                        break
            for newtri in changes:
                coords = [point if i==local else data['verts'][chart['mapped_vertices'][i]] for i in newtri]
                if (coords[1]-coords[0]).cross(coords[2]-coords[0]).length < 1e-12:
                    valid = False
                    break
            replacement.extend(changes)
        if not valid:
            blocked.add((ci,mode,selected))
            continue
        index = len(data['verts'])
        data['verts'].append(point)
        chart['mapped_vertices'].append(index)
        data['vertex_source'][index] = None
        data['vertexpart'][index] = chart['label']
        data['vertex_strength'][index] = 1.0
        chart['uv_coords'].append(tuple(np.mean([chart['uv_coords'][i] for i in selected],axis=0)))
        chart['projected_coords'].append(tuple(np.mean([chart['projected_coords'][i] for i in selected],axis=0)))
        chart['triangles'] = replacement
        added += 1
        edge_splits += mode == 'edge'
        center_splits += mode == 'face'

    # Rebuild only appended cap arrays. Flat per-triangle normals prevent smooth
    # normal averaging across strongly folded internal closure surfaces.
    original_faces = data['original_face_count']
    original_loops = data['original_loop_count']
    data['faces'] = data['faces'][:original_faces]
    data['uvs'] = data['uvs'][:original_loops]
    data['normals'] = data['normals'][:original_loops]
    residual = []
    residual_clearance = []
    minimum_measured_clearance = float('inf')
    longest = 0.0
    for ci, chart in enumerate(charts):
        chart['face_indices'], chart['loop_indices'] = [], []
        chart['flat_normals'] = flat_caps
        mapped = chart['mapped_vertices']
        normal_sums = np.zeros((len(mapped), 3), dtype=float)
        for triangle in chart['triangles']:
            a,b,c = [data['verts'][mapped[i]] for i in triangle]
            face_vector = np.asarray((b-a).cross(c-a))
            for i in triangle:normal_sums[i] += face_vector
        lengths = np.linalg.norm(normal_sums,axis=1)
        normal_sums /= np.maximum(lengths[:,None],1e-20)
        chart['vertex_normals'] = [tuple(n) for n in normal_sums]
        boundary_edges = {tuple(sorted((a,b))) for a,b in zip(range(len(chart['source_ring'])),list(range(1,len(chart['source_ring'])))+[0])}
        for ti, triangle in enumerate(chart['triangles']):
            indices = [mapped[i] for i in triangle]
            a, b, c = [data['verts'][i] for i in indices]
            normal = (b - a).cross(c - a)
            if normal.length < 1e-14:
                raise ValueError(('Degenerate refined cap triangle', ci, ti))
            normal.normalize()
            chart['face_indices'].append(len(data['faces']))
            data['faces'].append(indices)
            chart['loop_indices'].append(list(range(len(data['uvs']), len(data['uvs']) + 3)))
            data['uvs'].extend([None, None, None])
            if flat_caps:
                data['normals'].extend([tuple(normal)] * 3)
            else:
                data['normals'].extend(tuple(normal_sums[i]) if lengths[i]>1e-14 else tuple(normal) for i in triangle)
            probes = [a, b, c, (a+b)*.5, (b+c)*.5, (c+a)*.5, (a+b+c)/3.0]
            probe_distances = [signed_distance(p)[0] for p in probes]
            worst = max(probe_distances)
            interior_probes = [(6, 'centroid')]
            for offset,(va,vb) in enumerate(zip(triangle,triangle[1:]+triangle[:1])):
                if tuple(sorted((va,vb))) not in boundary_edges:interior_probes.append((3+offset,'internal_edge'))
            for offset,vi in enumerate(triangle):
                if vi>=len(chart['source_ring']):interior_probes.append((offset,'interior_vertex'))
            for pi,kind in interior_probes:
                clearance=-probe_distances[pi]
                minimum_measured_clearance=min(minimum_measured_clearance,clearance)
                if clearance < minimum_clearance-inside_tolerance:
                    residual_clearance.append(dict(chart=ci,label=chart['label'],triangle=ti,probe=kind,clearance=clearance))
            if worst > inside_tolerance:
                residual.append(dict(chart=ci, label=chart['label'], triangle=ti, outside=worst, probe_distances=probe_distances, indices=indices))
            longest = max(longest, (a-b).length, (b-c).length, (c-a).length)
    data['cap_refinement'] = dict(added_vertices=added, added_triangles=2*added, edge_splits=edge_splits, center_splits=center_splits,
                                  minimum_clearance=minimum_clearance, minimum_measured_clearance=minimum_measured_clearance, residual_clearance=residual_clearance,
                                  residual_outside=residual, max_remaining_edge=longest,
                                  inside_tolerance=inside_tolerance,
                                  max_outside=max((r['outside'] for r in residual), default=0.0))
    return data


# Compatible names for the existing build-script integration.
split_contacts = split_parts
refine_caps = refine_parts
