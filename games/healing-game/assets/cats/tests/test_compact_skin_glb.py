#!/usr/bin/env python3
"""Binary-format regression checks for compact cat skin attributes."""
import copy
import importlib.util
import math
from pathlib import Path
import struct
import unittest

SPEC = importlib.util.spec_from_file_location("compact_skin_glb", Path(__file__).resolve().parents[1] / "compact_skin_glb.py")
PACK = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PACK)


def fixture(weights=((.1, .2, .3, .4), (.33333, .33333, .33334, 0)), image=b"old"):
    # Positions share a strided buffer view with the attributes being compacted.
    # Retaining their bytes proves we do not drop a view still used by geometry.
    rows = [struct.pack("<3f4H4f", *(i + .125 for i in range(3)), 0, 1, 2, 3, *row)
            for row in weights]
    data = bytearray(b"".join(rows))
    views = [{"buffer": 0, "byteOffset": 0, "byteLength": len(data), "byteStride": 36, "target": 34962}]
    accessors = [
        {"bufferView": 0, "byteOffset": 0, "componentType": 5126, "count": 2, "type": "VEC3"},
        {"bufferView": 0, "byteOffset": 12, "componentType": 5123, "count": 2, "type": "VEC4"},
        {"bufferView": 0, "byteOffset": 20, "componentType": 5126, "count": 2, "type": "VEC4"},
    ]
    index_bytes = struct.pack("<3H", 0, 1, 0)
    views.append({"buffer": 0, "byteOffset": len(data), "byteLength": len(index_bytes), "target": 34963})
    accessors.append({"bufferView": 1, "componentType": 5123, "count": 3, "type": "SCALAR"})
    data.extend(index_bytes)
    data.extend(b"\0" * (-len(data) % 4))
    # A header-sized synthetic PNG is enough for the size-and-byte-copy contract.
    png = b"\x89PNG\r\n\x1a\n" + b"\0\0\0\rIHDR" + struct.pack(">II", 1024, 1024) + image
    views.append({"buffer": 0, "byteOffset": len(data), "byteLength": len(png)})
    data.extend(png)
    doc = {"asset": {"version": "2.0"}, "buffers": [{"byteLength": len(data)}],
           "bufferViews": views, "accessors": accessors,
           "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "JOINTS_0": 1, "WEIGHTS_0": 2}, "indices": 3, "material": 0}]}],
           "nodes": [{"mesh": 0, "skin": 0}, {}, {}, {}, {}],
           "skins": [{"joints": [1, 2, 3, 4]}],
           "materials": [{"name": "Fur", "pbrMetallicRoughness": {"baseColorTexture": {"index": 0}}}],
           "textures": [{"source": 0}], "images": [{"bufferView": 2, "mimeType": "image/png"}]}
    return PACK.write_glb(doc, bytes(data))


def surface_fixture(positions, uvs, normals, indices):
    binary, views, accessors = bytearray(), [], []
    for rows, kind, count, component in ((positions, "VEC3", 3, 5126),
                                         (uvs, "VEC2", 2, 5126),
                                         (normals, "VEC3", 3, 5126),
                                         ([(i,) for i in indices], "SCALAR", 1, 5123)):
        binary.extend(bytes(-len(binary) % 4))
        data = b"".join(struct.pack("<" + PACK.FORMATS[component] * count, *row) for row in rows)
        views.append({"buffer": 0, "byteOffset": len(binary), "byteLength": len(data)})
        binary.extend(data)
        accessors.append({"bufferView": len(views) - 1, "componentType": component, "type": kind, "count": len(rows)})
    primitive = {"attributes": {"POSITION": 0, "TEXCOORD_0": 1, "NORMAL": 2}, "indices": 3}
    doc = {"buffers": [{"byteLength": len(binary)}], "bufferViews": views, "accessors": accessors}
    return doc, bytes(binary), primitive


def animated_fixture(channels, clip_count=1):
    doc, data = PACK.parse_glb(fixture())
    binary = bytearray(data[:doc["buffers"][0]["byteLength"]])
    animation = {"name": "Walk", "samplers": [], "channels": []}
    def append(rows, kind):
        binary.extend(bytes(-len(binary) % 4))
        payload = b"".join(struct.pack("<" + "f" * PACK.COMPONENTS[kind], *row) for row in rows)
        view, accessor = len(doc["bufferViews"]), len(doc["accessors"])
        doc["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": len(payload)})
        binary.extend(payload)
        doc["accessors"].append({"bufferView": view, "componentType": 5126, "count": len(rows), "type": kind})
        return accessor
    for node, path, times, values, interpolation in channels:
        input_index = append([(time,) for time in times], "SCALAR")
        output_index = append(values, "VEC4" if path == "rotation" else "VEC3")
        animation["channels"].append({"sampler": len(animation["samplers"]), "target": {"node": node, "path": path}})
        animation["samplers"].append({"input": input_index, "output": output_index, "interpolation": interpolation})
    doc["animations"] = [copy.deepcopy(animation) for _ in range(clip_count)]
    doc["nodes"][0]["extras"] = {"asset": "Original seated orange cat", "source_triangles": 35280,
        "runtime_decimation_ratio": .185, "catWalkStride": .4, "catWalkDuration": 1.6, "keep": "sample"}
    doc["nodes"][1]["extras"] = {"asset": "Current walk rig", "catWalkForward": "+Z"}
    doc["scenes"] = [{"nodes": list(range(len(doc["nodes"]))),
                      "extras": {"asset_notes": "legacy editing notes", "catWalkReview": True}}]
    return PACK.write_glb(doc, bytes(binary))


def animation_duration(doc, binary, index=0):
    return max(PACK.accessor_values(doc, binary, sampler["input"])[-1][0]
               for sampler in doc["animations"][index]["samplers"])


def evaluated_trs(doc, binary, time):
    defaults = {"translation": (0, 0, 0), "rotation": (0, 0, 0, 1), "scale": (1, 1, 1)}
    result = {(index, path): tuple(node.get(path, value)) for index, node in enumerate(doc["nodes"])
              for path, value in defaults.items()}
    for channel in doc["animations"][0]["channels"]:
        sampler = doc["animations"][0]["samplers"][channel["sampler"]]
        times = [row[0] for row in PACK.accessor_values(doc, binary, sampler["input"])]
        values = PACK.accessor_values(doc, binary, sampler["output"])
        if time <= times[0]:
            value = values[0]
        elif time >= times[-1]:
            value = values[-1]
        else:
            i = next(i for i in range(len(times) - 1) if times[i] <= time < times[i + 1])
            fraction = 0 if sampler.get("interpolation") == "STEP" else (time - times[i]) / (times[i + 1] - times[i])
            value = tuple(a + (b - a) * fraction for a, b in zip(values[i], values[i + 1]))
        result[channel["target"]["node"], channel["target"]["path"]] = value
    return result


class CompactSkin(unittest.TestCase):
    def test_strided_geometry_and_weights(self):
        before = fixture()
        after, report = PACK.compact(before)
        old_doc, old_bin = PACK.parse_glb(before)
        doc, binary = PACK.parse_glb(after)
        self.assertEqual(report["skinVertices"], 2)
        self.assertEqual(report["skinAttributeBytes"], 16)
        self.assertLessEqual(report["maximumWeightError"], 1 / 255)
        self.assertEqual(doc["accessors"][1]["componentType"], 5121)
        self.assertTrue(doc["accessors"][2]["normalized"])
        self.assertEqual(PACK.accessor_values(doc, binary, 1), [(0, 1, 2, 3)] * 2)
        self.assertEqual([sum(row) for row in PACK.accessor_values(doc, binary, 2)], [255, 255])
        for i in (0, 3):
            self.assertEqual(PACK.accessor_bytes(old_doc, old_bin, i), PACK.accessor_bytes(doc, binary, i))
        self.assertTrue(all(view.get("byteOffset", 0) % 4 == 0 for view in doc["bufferViews"]))

    def test_baseline_image_reuse_is_exact(self):
        baseline = fixture(image=b"approved-original")
        exported = fixture(image=b"reencoded-by-exporter")
        result, report = PACK.compact(exported, baseline)
        old_doc, old_bin = PACK.parse_glb(baseline)
        doc, binary = PACK.parse_glb(result)
        self.assertEqual(PACK.view_bytes(old_doc, old_bin, old_doc["images"][0]["bufferView"]),
                         PACK.view_bytes(doc, binary, doc["images"][0]["bufferView"]))
        self.assertFalse(report["baselineImages"][0]["exportImageWasExact"])
        self.assertTrue(all(x["byteExact"] for x in report["baselineGeometry"].values()))

    def test_nonunit_weights_rejected(self):
        with self.assertRaisesRegex(ValueError, "sum to one"):
            PACK.compact(fixture(weights=((1, 1, 0, 0), (1, 0, 0, 0))))

    def test_bad_joint_index_rejected(self):
        doc, binary = PACK.parse_glb(fixture())
        doc["skins"][0]["joints"] = [1, 2]
        with self.assertRaisesRegex(ValueError, "Joint index"):
            PACK.compact(PACK.write_glb(doc, binary))

    def test_invalid_glb_length_rejected(self):
        with self.assertRaisesRegex(ValueError, "complete"):
            PACK.parse_glb(fixture()[:-4])

    def test_single_joint_detail_reparent_preserves_bind_world(self):
        doc, binary = PACK.parse_glb(fixture())
        binary = binary[:doc["buffers"][0]["byteLength"]]
        binary += b"\0" * (-len(binary) % 4)
        view = len(doc["bufferViews"])
        doc["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": 32})
        binary += struct.pack("<8f", 1, 0, 0, 0, 1, 0, 0, 0)
        accessor = len(doc["accessors"])
        doc["accessors"].append({"bufferView": view, "componentType": 5126, "count": 2, "type": "VEC4"})
        detail = copy.deepcopy(doc["meshes"][0])
        detail["primitives"][0]["attributes"]["WEIGHTS_0"] = accessor
        doc["meshes"].append(detail)
        doc["nodes"][1].update(name="Head", translation=[1, 2, 3])
        doc["nodes"].append({"name": "Eyes", "mesh": 1, "skin": 0, "translation": [1, 2, 3]})
        doc["scenes"] = [{"nodes": list(range(6))}]
        result, report = PACK.compact(PACK.write_glb(doc, binary))
        packed, _ = PACK.parse_glb(result)
        self.assertEqual(len(report["rigidDetails"]), 1)
        self.assertNotIn("skin", packed["nodes"][5])
        self.assertNotIn("JOINTS_0", packed["meshes"][1]["primitives"][0]["attributes"])
        self.assertEqual(packed["nodes"][1]["children"], [5])
        self.assertNotIn(5, packed["scenes"][0]["nodes"])
        self.assertEqual(len(packed["accessors"]), 4, "unreferenced rigid weight payload removed")
        before = PACK.local_matrix(doc["nodes"][5])
        after = PACK.multiply(PACK.local_matrix(packed["nodes"][1]), PACK.local_matrix(packed["nodes"][5]))
        self.assertEqual(PACK.flatten(before), PACK.flatten(after))

    @staticmethod
    def with_normals(raw, delta=0, rows=None):
        doc, binary = PACK.parse_glb(raw)
        binary = binary[:doc["buffers"][0]["byteLength"]]
        binary += b"\0" * (-len(binary) % 4)
        view, accessor = len(doc["bufferViews"]), len(doc["accessors"])
        doc["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": 24})
        rows = rows or [(0, 0, 1 + delta), (0, 0, 1 + delta)]
        binary += struct.pack("<6f", *(x for row in rows for x in row))
        doc["accessors"].append({"bufferView": view, "componentType": 5126, "count": 2, "type": "VEC3"})
        doc["meshes"][0]["primitives"][0]["attributes"]["NORMAL"] = accessor
        return PACK.write_glb(doc, binary)

    def test_baseline_normals_restore_only_export_rounding(self):
        baseline = self.with_normals(fixture(), 0)
        result, report = PACK.compact(self.with_normals(fixture(), 1e-7), baseline)
        original, original_bin = PACK.parse_glb(baseline)
        packed, packed_bin = PACK.parse_glb(result)
        self.assertEqual(len(report["baselineNormalsRestored"]), 1)
        self.assertFalse(report["nonSkinPayloadsByteExact"])
        self.assertEqual(PACK.accessor_bytes(original, original_bin, 4), PACK.accessor_bytes(packed, packed_bin, 4))

    def test_larger_normal_changes_are_reported_not_replaced(self):
        baseline = self.with_normals(fixture(), 0)
        export = self.with_normals(fixture(), 1e-4)
        result, report = PACK.compact(export, baseline)
        source, source_bin = PACK.parse_glb(export)
        packed, packed_bin = PACK.parse_glb(result)
        self.assertEqual(report["baselineNormalsRestored"], [])
        self.assertEqual(PACK.accessor_bytes(source, source_bin, 4), PACK.accessor_bytes(packed, packed_bin, 4))

    def test_short_normals_are_aligned_and_direction_error_is_bounded(self):
        source = self.with_normals(fixture(), rows=[(.23123, -.6546, .7198), (-.8799, .2134, -.4323)])
        result, report = PACK.compact(source, compact_normals=True)
        old_doc, old_bin = PACK.parse_glb(source)
        doc, binary = PACK.parse_glb(result)
        accessor = doc["accessors"][4]
        view = doc["bufferViews"][accessor["bufferView"]]
        self.assertEqual(accessor["componentType"], 5122)
        self.assertTrue(accessor["normalized"])
        self.assertEqual(view["byteStride"], 8)
        self.assertEqual(view["byteLength"], 16)
        self.assertEqual(view["byteOffset"] % 4, 0)
        payload = PACK.view_bytes(doc, binary, accessor["bufferView"])
        self.assertEqual(payload[6:8] + payload[14:16], bytes(4))
        self.assertEqual(doc["extensionsRequired"], ["KHR_mesh_quantization"])
        self.assertEqual(doc["extensionsUsed"], ["KHR_mesh_quantization"])
        self.assertGreater(report["normalQuantization"]["maximumDecodedUnitComponentError"], 0)
        self.assertLessEqual(report["normalQuantization"]["maximumDecodedUnitComponentError"], 1 / 32767)
        for before, after in zip(PACK.accessor_values(old_doc, old_bin, 4),
                                 PACK.accessor_values(doc, binary, 4, normalized=True)):
            a = math.sqrt(sum(x * x for x in before))
            b = math.sqrt(sum(x * x for x in after))
            self.assertLessEqual(max(abs(x / a - y / b) for x, y in zip(before, after)), 1 / 32767)
        for index in (0, 3):
            self.assertEqual(PACK.accessor_bytes(old_doc, old_bin, index), PACK.accessor_bytes(doc, binary, index))

    def test_normal_position_shared_accessor_is_split_without_changing_positions(self):
        doc, binary = PACK.parse_glb(fixture())
        doc["meshes"][0]["primitives"][0]["attributes"]["NORMAL"] = 0
        source = PACK.write_glb(doc, binary)
        result, report = PACK.compact(source, compact_normals=True)
        packed, packed_bin = PACK.parse_glb(result)
        attributes = packed["meshes"][0]["primitives"][0]["attributes"]
        self.assertNotEqual(attributes["POSITION"], attributes["NORMAL"])
        self.assertEqual(packed["accessors"][attributes["POSITION"]]["componentType"], 5126)
        self.assertEqual(packed["accessors"][attributes["NORMAL"]]["componentType"], 5122)
        self.assertEqual(report["normalQuantization"]["sharedAccessorsSplit"], 1)
        self.assertEqual(PACK.accessor_bytes(doc, binary, 0),
                         PACK.accessor_bytes(packed, packed_bin, attributes["POSITION"]))

    def test_normal_compaction_is_opt_in(self):
        source = self.with_normals(fixture(), rows=[(.23123, -.6546, .7198), (-.8799, .2134, -.4323)])
        result, report = PACK.compact(source)
        old_doc, old_bin = PACK.parse_glb(source)
        doc, binary = PACK.parse_glb(result)
        self.assertNotIn("normalQuantization", report)
        self.assertNotIn("KHR_mesh_quantization", doc.get("extensionsRequired", []))
        self.assertEqual(doc["accessors"][4]["componentType"], 5126)
        self.assertEqual(PACK.accessor_bytes(old_doc, old_bin, 4), PACK.accessor_bytes(doc, binary, 4))

    def test_invalid_normal_rejected_before_quantization(self):
        for row in ((0, 0, 0), (math.nan, 0, 1), (math.inf, 0, 1)):
            with self.subTest(row=row), self.assertRaisesRegex(ValueError, "vertex normal"):
                PACK.compact(self.with_normals(fixture(), rows=[row, (0, 0, 1)]), compact_normals=True)

    def test_contact_split_restores_only_retained_external_triangle_normals(self):
        positions = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        uvs = [(.1, .1), (.2, .1), (.1, .2)]
        old = surface_fixture(positions, uvs, [(0, 0, 1)] * 3, [0, 1, 2])
        # Three new cap vertices intentionally reuse outer keys to prove that
        # matching a position/UV alone is insufficient; new faces stay untouched.
        current = surface_fixture(positions * 2 + [(.3, .3, 0)], uvs * 2 + [(.8, .8)],
                                  [(.0001, 0, 1)] * 3 + [(1, 0, 0)] * 4,
                                  [1, 2, 0, 3, 4, 6])
        payload, report = PACK.restore_split_surface_normals(*old, *current)
        rows = list(struct.iter_unpack("<3f", payload))
        self.assertEqual(rows[:3], [(0, 0, 1)] * 3)
        self.assertEqual(rows[3:], [(1, 0, 0)] * 4)
        self.assertEqual(report["retainedApprovedTriangles"], 1)
        self.assertEqual(report["matchedVertices"], 3)
        self.assertEqual(report["restoredVertices"], 3)
        self.assertEqual(report["excludedNewFaceVertices"], 3)
        self.assertEqual(report["unmatchedNewVertices"], 1)

    def test_contact_lookup_requires_exact_uv_and_original_winding(self):
        positions = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        uvs = [(.1, .1), (.2, .1), (.1, .2)]
        old = surface_fixture(positions, uvs, [(0, 0, 1)] * 3, [0, 1, 2])
        for new_uvs, indices in ((uvs, [0, 2, 1]), ([(.10001, .1), *uvs[1:]], [0, 1, 2])):
            current = surface_fixture(positions, new_uvs, [(.0001, 0, 1)] * 3, indices)
            payload, report = PACK.restore_split_surface_normals(*old, *current)
            self.assertEqual(payload, PACK.accessor_bytes(current[0], current[1], 2))
            self.assertEqual(report["matchedVertices"], 0)
            self.assertEqual(report["retainedApprovedTriangles"], 0)

    def test_contact_lookup_rejects_large_changes_on_retained_surface(self):
        positions = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        uvs = [(.1, .1), (.2, .1), (.1, .2)]
        old = surface_fixture(positions, uvs, [(0, 0, 1)] * 3, [0, 1, 2])
        current = surface_fixture(positions, uvs, [(.01, 0, 1)] * 3, [0, 1, 2])
        with self.assertRaisesRegex(ValueError, "more than 0.002"):
            PACK.restore_split_surface_normals(*old, *current)

    def test_animation_cleanup_preserves_evaluated_motion_and_metadata(self):
        times = [0, .4, 1.6]
        channels = [
            (1, "translation", times, [(0, 0, 0), (0, .1, .2), (0, 0, 0)], "LINEAR"),
            (1, "scale", times, [(1, 1, 1)] * 3, "LINEAR"),
            (2, "translation", times, [(.1, .2, .3)] * 3, "STEP"),
            (3, "scale", times, [(1, 1, 1), (1, 1.0000001, 1), (1, 1, 1)], "LINEAR"),
            (4, "rotation", times, [(0, 0, 0, 1)] * 3, "LINEAR")]
        source = animated_fixture(channels)
        result, report = PACK.compact(source)
        before, before_bin = PACK.parse_glb(source)
        after, after_bin = PACK.parse_glb(result)
        self.assertEqual(report["animationOptimization"]["removedRestChannels"], 2)
        self.assertEqual(report["animationOptimization"]["collapsedConstantChannels"], 1)
        self.assertEqual(len(after["animations"][0]["channels"]), 3)
        self.assertEqual(animation_duration(before, before_bin), animation_duration(after, after_bin))
        for time in (0, .001, .1, .3999, .4, .4001, .8, 1.2, 1.599, 1.6, 1.7):
            self.assertEqual(evaluated_trs(before, before_bin, time), evaluated_trs(after, after_bin, time))
        constant = next(ch for ch in after["animations"][0]["channels"] if ch["target"]["node"] == 2)
        sampler = after["animations"][0]["samplers"][constant["sampler"]]
        self.assertEqual(after["accessors"][sampler["input"]]["count"], 1)
        self.assertEqual(after["nodes"][0]["extras"], {"catWalkStride": .4, "catWalkDuration": 1.6, "keep": "sample"})
        self.assertEqual(after["nodes"][1]["extras"]["asset"], "Current walk rig")
        self.assertEqual(after["scenes"][0]["extras"], {"catWalkReview": True})
        used = {holder[key] for holder, key in PACK.accessor_references(after)}
        self.assertEqual(used, set(range(len(after["accessors"]))), "unused animation accessor storage removed")

    def test_all_constant_rest_clip_retains_duration_and_original_time_origin(self):
        times = [1 / 30, .8, 1.6 + 1 / 30]
        source = animated_fixture([(1, "scale", times, [(1, 1, 1)] * 3, "LINEAR"),
                                   (2, "rotation", times, [(0, 0, 0, 1)] * 3, "LINEAR")])
        result, report = PACK.compact(source)
        before, before_bin = PACK.parse_glb(source)
        after, after_bin = PACK.parse_glb(result)
        self.assertEqual(len(after["animations"][0]["channels"]), 1)
        sampler = after["animations"][0]["samplers"][0]
        values = PACK.accessor_values(after, after_bin, sampler["input"])
        original_times = PACK.accessor_values(before, before_bin, before["animations"][0]["samplers"][0]["input"])
        self.assertEqual(values, [original_times[0], original_times[-1]])
        self.assertEqual(animation_duration(before, before_bin), animation_duration(after, after_bin))
        self.assertEqual(evaluated_trs(before, before_bin, .3), evaluated_trs(after, after_bin, .3))

    def test_constant_nonrest_clip_retains_two_endpoint_duration_anchor(self):
        source = animated_fixture([(1, "translation", [0, .8, 1.6], [(.1, .2, .3)] * 3, "LINEAR")])
        result, _ = PACK.compact(source)
        before, before_bin = PACK.parse_glb(source)
        after, after_bin = PACK.parse_glb(result)
        sampler = after["animations"][0]["samplers"][0]
        self.assertEqual(after["accessors"][sampler["input"]]["count"], 2)
        self.assertEqual(animation_duration(before, before_bin), animation_duration(after, after_bin))
        self.assertEqual(evaluated_trs(before, before_bin, .5), evaluated_trs(after, after_bin, .5))

    def test_rest_tracks_are_kept_for_assets_with_multiple_blendable_clips(self):
        source = animated_fixture([(1, "translation", [0, 1.6], [(0, 0, 0), (0, .1, 0)], "LINEAR"),
                                   (2, "scale", [0, 1.6], [(1, 1, 1)] * 2, "LINEAR")], clip_count=2)
        result, report = PACK.compact(source)
        after, _ = PACK.parse_glb(result)
        self.assertEqual(report["animationOptimization"]["removedRestChannels"], 0)
        self.assertTrue(all(len(animation["channels"]) == 2 for animation in after["animations"]))

    def test_cubic_spline_tangents_are_not_treated_as_constant_values(self):
        values = [(0, 0, 0), (1, 1, 1), (.1, 0, 0), (-.1, 0, 0), (1, 1, 1), (0, 0, 0)]
        source = animated_fixture([(1, "scale", [0, 1.6], values, "CUBICSPLINE")])
        result, report = PACK.compact(source)
        before, before_bin = PACK.parse_glb(source)
        after, after_bin = PACK.parse_glb(result)
        self.assertEqual(report["animationOptimization"]["removedRestChannels"], 0)
        self.assertEqual(report["animationOptimization"]["collapsedConstantChannels"], 0)
        old_index = before["animations"][0]["samplers"][0]["output"]
        new_index = after["animations"][0]["samplers"][0]["output"]
        self.assertEqual(PACK.accessor_bytes(before, before_bin, old_index), PACK.accessor_bytes(after, after_bin, new_index))

    @staticmethod
    def with_added_primitive(raw, role):
        doc, binary = PACK.parse_glb(raw)
        primitive = copy.deepcopy(doc["meshes"][0]["primitives"][0])
        primitive["material"] = len(doc["materials"])
        doc["materials"].append({"name": role, "pbrMetallicRoughness": {"baseColorFactor": [1, .5, .2, 1]}})
        doc["meshes"].append({"primitives": [primitive]})
        doc["nodes"].append({"mesh": len(doc["meshes"]) - 1, "skin": 0})
        return PACK.write_glb(doc, binary)

    def test_explicit_hind_shin_addition_is_reported_without_weakening_baseline(self):
        baseline = self.with_normals(fixture())
        source = self.with_added_primitive(baseline, "Hidden hind shins • approved coat")
        _, report = PACK.compact(source, baseline)
        self.assertEqual(len(report["addedGeometry"]), 1)
        self.assertEqual(report["addedGeometry"][0]["material"], "Hidden hind shins • approved coat")
        self.assertEqual(report["addedGeometry"][0]["vertices"], 2)
        self.assertEqual(report["addedGeometry"][0]["triangles"], 1)
        self.assertTrue(all(stream["byteExact"] for stream in report["baselineGeometry"].values()))

    def test_other_new_material_roles_remain_rejected(self):
        baseline = self.with_normals(fixture())
        source = self.with_added_primitive(baseline, "Unreviewed new body")
        with self.assertRaisesRegex(ValueError, "outside the explicit hind-shin"):
            PACK.compact(source, baseline)

    def test_hind_shin_allowance_does_not_allow_removing_original_attributes(self):
        baseline = self.with_normals(fixture())
        source = self.with_added_primitive(baseline, "Hidden hind shins • approved coat")
        doc, binary = PACK.parse_glb(source)
        doc["meshes"][0]["primitives"][0]["attributes"].pop("NORMAL")
        with self.assertRaisesRegex(ValueError, "outside the explicit hind-shin"):
            PACK.compact(PACK.write_glb(doc, binary), baseline)

    @staticmethod
    def with_calf_morph(raw, default_weight=0, original_surface=False):
        doc, data = PACK.parse_glb(raw)
        binary = bytearray(data[:doc["buffers"][0]["byteLength"]])
        def append(rows, kind):
            binary.extend(bytes(-len(binary) % 4))
            payload = b"".join(struct.pack("<" + "f" * PACK.COMPONENTS[kind], *row) for row in rows)
            view, index = len(doc["bufferViews"]), len(doc["accessors"])
            doc["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": len(payload)})
            doc["accessors"].append({"bufferView": view, "componentType": 5126, "count": len(rows), "type": kind})
            binary.extend(payload)
            return index
        target = {"POSITION": append([(.01, 0, 0), (.01, 0, 0)], "VEC3"),
                  "NORMAL": append([(0, .03, 0), (0, .03, 0)], "VEC3")}
        mesh = doc["meshes"][-1]
        mesh["primitives"][0]["targets"] = [target]
        mesh["extras"] = {"targetNames": ["Walk calf fullness"]}
        mesh["weights"] = [default_weight]
        doc["nodes"][-1]["weights"] = [default_weight]
        if original_surface:
            doc["meshes"][0]["primitives"][0]["targets"] = [copy.deepcopy(target)]
        doc["animations"] = [{"name": "Walk", "channels": [
            {"sampler": 0, "target": {"node": len(doc["nodes"]) - 1, "path": "weights"}}],
            "samplers": [{"input": append([(0,), (1.6,)], "SCALAR"),
                          "output": append([(1,), (1,)], "SCALAR"), "interpolation": "LINEAR"}]}]
        return PACK.write_glb(doc, bytes(binary))

    def test_localized_calf_corrective_preserves_zero_rest_and_constant_walk_weight(self):
        baseline = self.with_normals(fixture())
        source = self.with_calf_morph(self.with_added_primitive(baseline, "Hidden hind shins • approved coat"))
        result, report = PACK.compact(source, baseline, compact_normals=True)
        before, before_bin = PACK.parse_glb(source)
        after, after_bin = PACK.parse_glb(result)
        self.assertEqual(after["meshes"][-1]["weights"], [0])
        self.assertEqual(after["nodes"][-1]["weights"], [0])
        self.assertEqual(after["meshes"][-1]["extras"]["targetNames"], ["Walk calf fullness"])
        self.assertEqual(report["addedGeometry"][0]["morphBytes"], 48)
        self.assertEqual(report["addedGeometry"][0]["morphAnimation"]["minimum"], 1)
        self.assertEqual(report["addedGeometry"][0]["morphAnimation"]["maximum"], 1)
        channel = after["animations"][0]["channels"][0]
        self.assertEqual(channel["target"]["path"], "weights", "constant Walk corrective channel is retained")
        sampler = after["animations"][0]["samplers"][channel["sampler"]]
        self.assertEqual(PACK.accessor_values(after, after_bin, sampler["output"]), [(1,), (1,)])
        for semantic in ("POSITION", "NORMAL"):
            old_index = before["meshes"][-1]["primitives"][0]["targets"][0][semantic]
            new_index = after["meshes"][-1]["primitives"][0]["targets"][0][semantic]
            self.assertEqual(after["accessors"][new_index]["componentType"], 5126)
            self.assertEqual(PACK.accessor_bytes(before, before_bin, old_index), PACK.accessor_bytes(after, after_bin, new_index))

    def test_calf_corrective_cannot_change_seated_rest_default(self):
        baseline = self.with_normals(fixture())
        source = self.with_calf_morph(self.with_added_primitive(baseline, "Hidden hind shins • approved coat"), default_weight=1)
        with self.assertRaisesRegex(ValueError, "default to zero"):
            PACK.compact(source, baseline)

    def test_corrective_allowance_cannot_morph_an_original_surface(self):
        baseline = self.with_normals(fixture())
        source = self.with_calf_morph(self.with_added_primitive(baseline, "Hidden hind shins • approved coat"), original_surface=True)
        with self.assertRaisesRegex(ValueError, "original cat surface"):
            PACK.compact(source, baseline)

    @staticmethod
    def with_closure_colors(raw, rows=None):
        doc, data = PACK.parse_glb(raw)
        binary = bytearray(data[:doc["buffers"][0]["byteLength"]])
        binary.extend(bytes(-len(binary) % 4))
        rows = rows or [(.8, .4, .1, 1), (.7, .3, .08, 1)]
        payload = b"".join(struct.pack("<4f", *row) for row in rows)
        view, index = len(doc["bufferViews"]), len(doc["accessors"])
        doc["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": len(payload)})
        doc["accessors"].append({"bufferView": view, "componentType": 5126, "count": len(rows), "type": "VEC4"})
        binary.extend(payload)
        doc["meshes"][-1]["primitives"][0]["attributes"]["COLOR_0"] = index
        doc["materials"][-1]["pbrMetallicRoughness"]["baseColorFactor"] = [1, 1, 1, 1]
        return PACK.write_glb(doc, bytes(binary))

    def test_explicit_closure_vertex_colors_are_audited_and_preserved(self):
        baseline = self.with_normals(fixture())
        source = self.with_closure_colors(self.with_added_primitive(baseline, "Anatomical closures • transferred fur"))
        result, report = PACK.compact(source, baseline, compact_normals=True)
        before, before_bin = PACK.parse_glb(source)
        after, after_bin = PACK.parse_glb(result)
        addition = report["addedGeometry"][0]
        self.assertEqual(addition["material"], "Anatomical closures • transferred fur")
        self.assertEqual(addition["colorAttribute"], {"componentType": 5126, "type": "VEC4",
                                                       "normalized": False, "colorSpace": "linear", "bytes": 32})
        old_index = before["meshes"][-1]["primitives"][0]["attributes"]["COLOR_0"]
        new_index = after["meshes"][-1]["primitives"][0]["attributes"]["COLOR_0"]
        self.assertEqual(PACK.accessor_bytes(before, before_bin, old_index), PACK.accessor_bytes(after, after_bin, new_index))
        self.assertTrue(all(stream["byteExact"] for stream in report["baselineGeometry"].values()))

    def test_closure_role_without_transferred_color_attribute_is_rejected(self):
        baseline = self.with_normals(fixture())
        source = self.with_added_primitive(baseline, "Anatomical closures • transferred fur")
        with self.assertRaisesRegex(ValueError, "explicit hind-shin/closure additions"):
            PACK.compact(source, baseline)

    def test_closure_colors_cannot_exceed_linear_unit_range(self):
        baseline = self.with_normals(fixture())
        source = self.with_closure_colors(self.with_added_primitive(baseline, "Anatomical closures • transferred fur"),
                                           rows=[(1.1, .4, .1, 1), (.7, .3, .08, 1)])
        with self.assertRaisesRegex(ValueError, "colors must stay finite"):
            PACK.compact(source, baseline)

    def test_calf_morph_allowance_does_not_extend_to_closures(self):
        baseline = self.with_normals(fixture())
        source = self.with_calf_morph(self.with_closure_colors(
            self.with_added_primitive(baseline, "Anatomical closures • transferred fur")))
        with self.assertRaisesRegex(ValueError, "original cat surface"):
            PACK.compact(source, baseline)


if __name__ == "__main__":
    unittest.main()
