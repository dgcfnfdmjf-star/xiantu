"""Repair folded cat UV charts without changing geometry or corner normals.

Run inside Blender after materializing the optimized, triangulated mesh and its
initial Smart UV layout. This module performs no scene or file work on import.
The painter must use the repaired UVs rather than project them again.
"""

import hashlib
import math
import struct

import bpy
import numpy as np


_SEAM_TOLERANCE = 1e-7
_BARYCENTRIC_TOLERANCE = 1e-4


def geometry_fingerprint(mesh):
    """Hash local vertex positions, polygon indices and all corner normals."""
    digest = hashlib.sha256()
    for vertex in mesh.vertices:
        digest.update(struct.pack('<3f', *vertex.co))
    for polygon in mesh.polygons:
        digest.update(struct.pack('<' + 'I' * len(polygon.vertices), *polygon.vertices))
    for normal in mesh.corner_normals:
        digest.update(struct.pack('<3f', *normal.vector))
    return digest.hexdigest()


def _validate(obj, size, tolerance):
    if obj.type != 'MESH' or obj.mode != 'OBJECT':
        raise ValueError('UV repair requires a mesh object in Object mode')
    mesh = obj.data
    if not mesh.polygons or any(len(p.vertices) != 3 for p in mesh.polygons):
        raise ValueError('UV repair requires a nonempty, triangulated runtime mesh')
    if mesh.uv_layers.active is None:
        raise ValueError('UV repair requires an existing active Smart UV layout')
    if not isinstance(size, int) or size < 1:
        raise ValueError('Texture size must be a positive integer')
    if not math.isfinite(tolerance) or tolerance <= 0:
        raise ValueError('Surface conflict tolerance must be positive and finite')
    return mesh


def _edges_and_uv_seams(mesh):
    """Read chart boundaries from UV discontinuities; do not alter the mesh."""
    edge_faces = {}
    edge_uvs = {}
    uv = mesh.uv_layers.active.data
    for polygon in mesh.polygons:
        loops = list(polygon.loop_indices)
        for first, second in zip(loops, loops[1:] + loops[:1]):
            a, b = mesh.loops[first], mesh.loops[second]
            edge_faces.setdefault(a.edge_index, []).append(polygon.index)
            edge_uvs.setdefault(a.edge_index, []).append({
                a.vertex_index: tuple(uv[first].uv),
                b.vertex_index: tuple(uv[second].uv),
            })
    seams = []
    for edge in mesh.edges:
        uses = edge_uvs.get(edge.index, [])
        seam = len(uses) != 2 or any(
            any(abs(uses[0][vertex][axis] - uses[1][vertex][axis]) > _SEAM_TOLERANCE
                for axis in range(2))
            for vertex in edge.vertices
        )
        seams.append(seam)
    return edge_faces, seams


def _chart_ids(mesh, edge_faces, seam_flags=None):
    parent = list(range(len(mesh.polygons)))

    def root(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    for edge in mesh.edges:
        uses = edge_faces.get(edge.index, [])
        seam = edge.use_seam if seam_flags is None else seam_flags[edge.index]
        if not seam and len(uses) == 2:
            parent[root(uses[0])] = root(uses[1])
    return np.array([root(index) for index in range(len(mesh.polygons))])


def _unwrap_and_pack(obj, margin):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    try:
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.unwrap(method='ANGLE_BASED', margin=.001)
        bpy.ops.uv.pack_islands(
            rotate=True, rotate_method='ANY', margin_method='FRACTION',
            margin=margin, shape_method='CONCAVE', scale=True,
        )
    finally:
        bpy.ops.object.mode_set(mode='OBJECT')


def _scan(mesh, vertices, size, tolerance, edge_faces, seam_flags=None):
    """Rasterize at texture pixel centers and compare overlapping 3D positions."""
    mesh.calc_loop_triangles()
    uv = np.array([entry.uv[:] for entry in mesh.uv_layers.active.data])
    coverage = np.zeros((size, size), np.int16)
    owner = np.full((size, size), -1, np.int32)
    positions = np.zeros((size, size, 3), float)
    conflicts = np.zeros((size, size), bool)
    pairs = {}
    max_separation = 0.
    areas = []
    for triangle in mesh.loop_triangles:
        xy = uv[list(triangle.loops)] * size
        a, b, c = xy
        determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
        areas.append(abs(determinant) / 2)
        if abs(determinant) < 1e-12:
            continue
        x0, y0 = np.maximum(np.floor(xy.min(0)).astype(int), 0)
        x1, y1 = np.minimum(np.ceil(xy.max(0)).astype(int), size - 1)
        if x0 > x1 or y0 > y1:
            continue
        xx, yy = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        w0 = ((b[1] - c[1]) * (xx - c[0]) + (c[0] - b[0]) * (yy - c[1])) / determinant
        w1 = ((c[1] - a[1]) * (xx - c[0]) + (a[0] - c[0]) * (yy - c[1])) / determinant
        w2 = 1 - w0 - w1
        inside = ((w0 >= -_BARYCENTRIC_TOLERANCE)
                  & (w1 >= -_BARYCENTRIC_TOLERANCE)
                  & (w2 >= -_BARYCENTRIC_TOLERANCE))
        sampled = np.stack((w0, w1, w2), axis=-1) @ vertices[list(triangle.vertices)]
        counts = coverage[y0:y1 + 1, x0:x1 + 1]
        owners = owner[y0:y1 + 1, x0:x1 + 1]
        previous = positions[y0:y1 + 1, x0:x1 + 1]
        overlap = inside & (counts > 0)
        distance = np.linalg.norm(previous - sampled, axis=-1)
        if overlap.any():
            max_separation = max(max_separation, float(distance[overlap].max()))
        bad = overlap & (distance > tolerance)
        if bad.any():
            conflicts[y0:y1 + 1, x0:x1 + 1] |= bad
            for earlier in np.unique(owners[bad]):
                pair = (int(earlier), triangle.polygon_index)
                pairs[pair] = pairs.get(pair, 0) + int(np.count_nonzero(bad & (owners == earlier)))
        counts[inside] += 1
        owners[inside] = triangle.polygon_index
        previous[inside] = sampled[inside]
    covered = int((coverage > 0).sum())
    stats = {
        'conflictingTexels': int(conflicts.sum()),
        'maxObservedSurfaceSeparation': max_separation,
        'coveredTexels': covered,
        'coverageFraction': covered / (size * size),
        'multiplyCoveredTexels': int((coverage > 1).sum()),
        'maximumCoverage': int(coverage.max()),
        'degenerateUVTriangles': int(sum(area < 1e-12 for area in areas)),
        'subpixelUVTriangles': int(sum(area < 1 for area in areas)),
        'charts': len(set(_chart_ids(mesh, edge_faces, seam_flags).tolist())),
        'seams': (sum(edge.use_seam for edge in mesh.edges)
                  if seam_flags is None else sum(seam_flags)),
    }
    return stats, pairs


def audit_uv_layout(obj, size=1024, tolerance=1e-4):
    """Return JSON-ready overlap/coverage evidence without changing UVs or seams.

    Shared-edge raster tolerance can produce tiny duplicate samples. Only samples
    separated by more than ``tolerance`` in local mesh space are conflicts.
    """
    mesh = _validate(obj, size, tolerance)
    edge_faces, seams = _edges_and_uv_seams(mesh)
    vertices = np.array([vertex.co[:] for vertex in mesh.vertices], dtype=float)
    stats, _ = _scan(mesh, vertices, size, tolerance, edge_faces, seams)
    return stats


def repair_uv_layout(obj, size=1024, margin=.012, tolerance=1e-4, max_iterations=8):
    """Unfold only conflicting charts and return JSON-ready repair evidence.

    Initial seams come from the existing Smart UV layout. After ANGLE_BASED
    unwrapping and packing, each offending chart is split along the coordinate
    axis that best separates its overlapping 3D face pairs. Only UVs/seams change;
    vertex positions, polygon indices and corner normals must remain exact.

    Leaves ``obj`` active in Object mode. Raises instead of returning a layout
    with unresolved conflicts, degenerate UV triangles or altered geometry.
    """
    mesh = _validate(obj, size, tolerance)
    if not math.isfinite(margin) or not 0 < margin < .5:
        raise ValueError('UV packing margin must be a finite fraction between 0 and 0.5')
    if not isinstance(max_iterations, int) or max_iterations < 1:
        raise ValueError('UV repair requires at least one iteration')
    before = geometry_fingerprint(mesh)
    vertices = np.array([vertex.co[:] for vertex in mesh.vertices], dtype=float)
    faces = np.array([polygon.vertices[:] for polygon in mesh.polygons], dtype=int)
    centers = vertices[faces].mean(axis=1)
    edge_faces, seams = _edges_and_uv_seams(mesh)
    for edge, seam in zip(mesh.edges, seams):
        edge.use_seam = seam

    history = []
    for iteration in range(max_iterations):
        _unwrap_and_pack(obj, margin)
        stats, pairs = _scan(mesh, vertices, size, tolerance, edge_faces)
        stats['iteration'] = iteration
        history.append(stats)
        if not pairs:
            break
        if iteration == max_iterations - 1:
            raise RuntimeError(
                f'UV repair exhausted {max_iterations} iterations with '
                f'{stats["conflictingTexels"]} conflicting texels; '
                f'maximum sampled separation {stats["maxObservedSurfaceSeparation"]:.9g}'
            )
        groups = _chart_ids(mesh, edge_faces)
        offending = {}
        for (first, second), weight in pairs.items():
            if groups[first] != groups[second]:
                raise RuntimeError('UV packing left overlap between separate charts')
            offending.setdefault(int(groups[first]), []).append((first, second, weight))
        cuts = []
        face_side = {}
        for group, entries in offending.items():
            delta = np.array([centers[a] - centers[b] for a, b, _ in entries])
            weights = np.array([weight for _, _, weight in entries])
            axis = int(np.argmax(np.sum(delta * delta * weights[:, None], axis=0)))
            midpoint = np.array([(centers[a, axis] + centers[b, axis]) / 2 for a, b, _ in entries])
            threshold = float(np.average(midpoint, weights=weights))
            members = np.where(groups == group)[0]
            for face in members:
                face_side[int(face)] = bool(centers[face, axis] > threshold)
            cuts.append({'chart': group, 'faces': len(members), 'axis': 'XYZ'[axis], 'threshold': threshold})
        added = 0
        for edge in mesh.edges:
            uses = edge_faces.get(edge.index, [])
            if edge.use_seam or len(uses) != 2:
                continue
            first, second = uses
            if (first in face_side and second in face_side
                    and groups[first] == groups[second]
                    and face_side[first] != face_side[second]):
                edge.use_seam = True
                added += 1
        stats['cuts'] = cuts
        stats['addedSeams'] = added
        if not added:
            raise RuntimeError('UV chart repair found no new separating seam')

    after = geometry_fingerprint(mesh)
    if before != after:
        raise RuntimeError('UV repair changed mesh positions, polygon indices or corner normals')
    if history[-1]['degenerateUVTriangles']:
        raise RuntimeError('UV repair left degenerate UV triangles')
    return {
        'success': True,
        'textureSize': size,
        'packingMargin': margin,
        'conflictThreshold': tolerance,
        'geometryAndCornerNormalsUnchanged': True,
        'geometryFingerprint': before,
        'geometryFingerprintAfter': after,
        'history': history,
        'final': dict(history[-1]),
    }
