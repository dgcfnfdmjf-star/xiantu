#!/usr/bin/env python3
"""Pack ordinary Blender glTF skin attributes without an extra runtime decoder.

Only JOINTS_0/WEIGHTS_0 are quantized. Rigid single-joint detail meshes are parented
directly to that joint, preserving their bind-space world transform.
An optional static baseline supplies its original embedded image bytes, preventing
an unnecessary second JPEG encoding. The geometry comparison is diagnostic only:
this tool never replaces a different vertex/index/UV stream. When those streams
are exact, baseline normals may restore exporter renormalization below 2e-7;
contact-split surfaces additionally recover their original corner normals using
exact position/UV/triangle-winding matches (bounded 0.002 export drift). New cap
faces retain their own normals. Every restoration is recorded in the report.
Optional --compact-normals stores signed normalized SHORT normals with an 8-byte
vertex stride, using the standard KHR_mesh_quantization extension (no decoder).
Exact constant animation channels and legacy authoring-only extras are removed;
motion values, loop timing and catWalk metadata are retained.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import math
import struct
from pathlib import Path


FORMATS = {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}
COMPONENTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4,
              "MAT2": 4, "MAT3": 9, "MAT4": 16}


def parse_glb(raw):
    if len(raw) < 28 or struct.unpack_from("<4sII", raw) != (b"glTF", 2, len(raw)):
        raise ValueError("Expected a complete glTF 2 GLB")
    chunks = []
    offset = 12
    while offset < len(raw):
        length, kind = struct.unpack_from("<II", raw, offset)
        offset += 8
        if length % 4 or offset + length > len(raw):
            raise ValueError("Invalid GLB chunk alignment/length")
        chunks.append((kind, raw[offset:offset + length]))
        offset += length
    if [kind for kind, _ in chunks] != [0x4E4F534A, 0x004E4942]:
        raise ValueError("Expected exactly one JSON and one BIN chunk")
    doc, binary = json.loads(chunks[0][1]), chunks[1][1]
    if len(doc.get("buffers", [])) != 1 or "uri" in doc["buffers"][0]:
        raise ValueError("Only a self-contained single-buffer GLB is supported")
    if doc["buffers"][0]["byteLength"] > len(binary):
        raise ValueError("Truncated BIN buffer")
    if any(x in doc.get("extensionsUsed", []) for x in
           ("EXT_meshopt_compression", "KHR_draco_mesh_compression")):
        raise ValueError("Compressed accessors must be decoded before skin packing")
    return doc, binary


def write_glb(doc, binary):
    doc = copy.deepcopy(doc)
    doc["buffers"][0]["byteLength"] = len(binary)
    js = json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    padded = binary + b"\0" * (-len(binary) % 4)
    return (struct.pack("<4sII", b"glTF", 2, 28 + len(js) + len(padded)) +
            struct.pack("<II", len(js), 0x4E4F534A) + js +
            struct.pack("<II", len(padded), 0x004E4942) + padded)


def view_bytes(doc, binary, index):
    view = doc["bufferViews"][index]
    if view.get("buffer", 0) != 0:
        raise ValueError("Unexpected secondary buffer")
    start, length = view.get("byteOffset", 0), view["byteLength"]
    if start < 0 or start + length > doc["buffers"][0]["byteLength"]:
        raise ValueError("Buffer view is out of bounds")
    return binary[start:start + length]


def accessor_bytes(doc, binary, index):
    accessor = doc["accessors"][index]
    if "sparse" in accessor:
        raise ValueError("Sparse accessors are not emitted by this cat pipeline")
    fmt = FORMATS[accessor["componentType"]]
    width = struct.calcsize("<" + fmt * COMPONENTS[accessor["type"]])
    # glTF pads byte/short matrix columns. The cat pipeline uses float MAT4 only.
    if accessor["type"].startswith("MAT") and accessor["componentType"] != 5126:
        raise ValueError("Only float matrix accessors are supported")
    if "bufferView" not in accessor:
        return bytes(width * accessor["count"])
    view = doc["bufferViews"][accessor["bufferView"]]
    data = view_bytes(doc, binary, accessor["bufferView"])
    stride, start = view.get("byteStride", width), accessor.get("byteOffset", 0)
    if stride < width or start < 0 or (accessor["count"] and
            start + (accessor["count"] - 1) * stride + width > len(data)):
        raise ValueError("Accessor exceeds its buffer view")
    return b"".join(data[start + i * stride:start + i * stride + width]
                    for i in range(accessor["count"]))


def accessor_values(doc, binary, index, normalized=False):
    accessor = doc["accessors"][index]
    fmt = "<" + FORMATS[accessor["componentType"]] * COMPONENTS[accessor["type"]]
    rows = list(struct.iter_unpack(fmt, accessor_bytes(doc, binary, index)))
    if normalized and accessor.get("normalized"):
        denominators = {5120: 127, 5121: 255, 5122: 32767, 5123: 65535}
        if accessor["componentType"] not in denominators:
            raise ValueError("Expected integer normalized attribute")
        divisor = denominators[accessor["componentType"]]
        rows = [tuple(max(x / divisor, -1) for x in row) for row in rows]
    return rows


def matrix(values=None):
    values = values or [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    return [[values[column * 4 + row] for column in range(4)] for row in range(4)]


def multiply(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]


def inverse(value):
    rows = [value[i][:] + [int(i == j) for j in range(4)] for i in range(4)]
    for column in range(4):
        pivot = max(range(column, 4), key=lambda row: abs(rows[row][column]))
        rows[column], rows[pivot] = rows[pivot], rows[column]
        divisor = rows[column][column]
        if abs(divisor) < 1e-12:
            raise ValueError("Singular bind transform")
        rows[column] = [x / divisor for x in rows[column]]
        for row in range(4):
            if row != column:
                factor = rows[row][column]
                rows[row] = [a - factor * b for a, b in zip(rows[row], rows[column])]
    return [row[4:] for row in rows]


def flatten(value):
    return [value[row][column] for column in range(4) for row in range(4)]


def local_matrix(node):
    if "matrix" in node:
        return matrix(node["matrix"])
    x, y, z, w = node.get("rotation", [0, 0, 0, 1])
    rotation = [[1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y), 0],
                [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x), 0],
                [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y), 0],
                [0, 0, 0, 1]]
    for column, scale in enumerate(node.get("scale", [1, 1, 1])):
        for row in range(3):
            rotation[row][column] *= scale
    for row, position in enumerate(node.get("translation", [0, 0, 0])):
        rotation[row][3] = position
    return rotation


def rigid_details(doc, binary):
    """Avoid skin payloads/draw-time skinning on fully rigid facial details."""
    nodes, parents, worlds = doc.get("nodes", []), {}, {}
    for index, node in enumerate(nodes):
        for child in node.get("children", []):
            if child in parents:
                raise ValueError("A glTF node has multiple parents")
            parents[child] = index
    def world(index, visiting=None):
        visiting = set() if visiting is None else visiting
        if index in visiting:
            raise ValueError("Cyclic glTF hierarchy")
        if index not in worlds:
            visiting.add(index)
            local = local_matrix(nodes[index])
            worlds[index] = multiply(world(parents[index], visiting), local) if index in parents else local
            visiting.remove(index)
        return worlds[index]
    for index in range(len(nodes)):
        world(index)
    animated = {channel["target"].get("node") for animation in doc.get("animations", [])
                for channel in animation.get("channels", [])}
    report = []
    for mesh_index, mesh in enumerate(doc.get("meshes", [])):
        instances = [i for i, node in enumerate(nodes) if node.get("mesh") == mesh_index]
        if not instances or any("skin" not in nodes[i] or i in animated for i in instances):
            continue
        rigid_joint = None
        valid = True
        for primitive in mesh["primitives"]:
            attributes = primitive["attributes"]
            if any(key.startswith(("JOINTS_", "WEIGHTS_")) and not key.endswith("_0") for key in attributes):
                valid = False
                break
            if not {"JOINTS_0", "WEIGHTS_0"}.issubset(attributes):
                valid = False
                break
            joints = accessor_values(doc, binary, attributes["JOINTS_0"])
            weights = accessor_values(doc, binary, attributes["WEIGHTS_0"], normalized=True)
            for joint_row, weight_row in zip(joints, weights):
                slots = [i for i, weight in enumerate(weight_row) if weight != 0]
                if len(slots) != 1 or weight_row[slots[0]] != 1:
                    valid = False
                    break
                joint = joint_row[slots[0]]
                if rigid_joint is None:
                    rigid_joint = joint
                elif rigid_joint != joint:
                    valid = False
                    break
            if not valid:
                break
        if not valid or rigid_joint is None:
            continue
        staged = []
        for index in instances:
            skin = doc["skins"][nodes[index]["skin"]]
            joint_node = skin["joints"][rigid_joint]
            cursor = joint_node
            while cursor in parents and cursor != index:
                cursor = parents[cursor]
            if cursor == index:
                valid = False
                break
            bind = (matrix(accessor_values(doc, binary, skin["inverseBindMatrices"])[rigid_joint])
                    if "inverseBindMatrices" in skin else matrix())
            implied = multiply(worlds[joint_node], bind)
            error = max(abs(x - y) for x, y in zip(flatten(implied), flatten(worlds[index])))
            if error > 2e-6:
                valid = False
                break
            staged.append((index, joint_node, multiply(inverse(worlds[joint_node]), worlds[index]), error))
        if not valid:
            continue
        for index, joint_node, local, error in staged:
            if index in parents:
                nodes[parents[index]]["children"].remove(index)
            else:
                for scene in doc.get("scenes", []):
                    if index in scene.get("nodes", []):
                        scene["nodes"].remove(index)
            nodes[joint_node].setdefault("children", []).append(index)
            nodes[index].pop("skin")
            for key in ("translation", "rotation", "scale"):
                nodes[index].pop(key, None)
            nodes[index]["matrix"] = flatten(local)
            report.append({"node": nodes[index].get("name", str(index)),
                           "joint": nodes[joint_node].get("name", str(joint_node)),
                           "bindWorldMatrixMaxError": error})
        for primitive in mesh["primitives"]:
            primitive["attributes"].pop("JOINTS_0")
            primitive["attributes"].pop("WEIGHTS_0")
    return report


def accessor_references(doc):
    """Mutable holders of ordinary glTF accessor indices emitted by Blender."""
    references = []
    for mesh in doc.get("meshes", []):
        for primitive in mesh["primitives"]:
            if "indices" in primitive:
                references.append((primitive, "indices"))
            references.extend((primitive["attributes"], key) for key in primitive["attributes"])
            for target in primitive.get("targets", []):
                references.extend((target, key) for key in target)
    for skin in doc.get("skins", []):
        if "inverseBindMatrices" in skin:
            references.append((skin, "inverseBindMatrices"))
    for animation in doc.get("animations", []):
        for sampler in animation.get("samplers", []):
            references.extend(((sampler, "input"), (sampler, "output")))
    return references


def optimize_constant_animation_channels(doc, original, binary):
    """Losslessly remove constant-rest tracks and shorten other constant tracks.

    Rest-channel removal is restricted to this single-clip cat asset contract:
    omitting a rest track from one of several blended clips can change blending.
    No numeric tolerance is used. CUBICSPLINE channels are left untouched.
    """
    payloads, cache = {}, {}
    report = {"clips": [], "removedRestChannels": 0, "collapsedConstantChannels": 0}
    defaults = {"translation": [0, 0, 0], "rotation": [0, 0, 0, 1], "scale": [1, 1, 1]}
    single_clip = len(doc.get("animations", [])) == 1

    def make_accessor(source_index, rows, timing=False):
        source = original["accessors"][source_index]
        if source["componentType"] != 5126:
            raise ValueError("Animation data must use FLOAT accessors")
        fmt = "<" + "f" * COMPONENTS[source["type"]]
        payload = b"".join(struct.pack(fmt, *row) for row in rows)
        key = source["type"], payload, timing
        if key not in cache:
            accessor = copy.deepcopy(source)
            accessor.update(bufferView=None, count=len(rows))
            accessor.pop("byteOffset", None)
            accessor.pop("min", None)
            accessor.pop("max", None)
            if timing:
                accessor["min"], accessor["max"] = [rows[0][0]], [rows[-1][0]]
            index = len(doc["accessors"])
            doc["accessors"].append(accessor)
            payloads[index] = payload
            cache[key] = index
        return cache[key]

    for animation in doc.get("animations", []):
        plans = []
        for channel in animation.get("channels", []):
            sampler = animation["samplers"][channel["sampler"]]
            times = accessor_values(original, binary, sampler["input"])
            values = accessor_values(original, binary, sampler["output"])
            if not times or any(len(row) != 1 or not math.isfinite(row[0]) for row in times):
                raise ValueError("Invalid animation timeline")
            if any(a[0] >= b[0] for a, b in zip(times, times[1:])):
                raise ValueError("Animation timestamps must strictly increase")
            target = channel["target"]
            path, node_index = target.get("path"), target.get("node")
            constant = (path in defaults and sampler.get("interpolation", "LINEAR") in ("LINEAR", "STEP") and
                        len(values) == len(times) and bool(values) and
                        all(row == values[0] for row in values))
            removable = False
            if constant and single_clip and path in defaults and node_index is not None:
                node = doc["nodes"][node_index]
                if "matrix" not in node:
                    removable = tuple(node.get(path, defaults[path])) == values[0]
            plans.append({"channel": channel, "sampler": sampler, "times": times,
                          "values": values, "constant": constant, "remove": removable,
                          "anchor": False})
        if not plans:
            raise ValueError("Animation clip has no channels")
        duration = max(plan["times"][-1][0] for plan in plans)
        variable_carries_duration = any(not plan["remove"] and not plan["constant"] and
                                       plan["times"][-1][0] == duration for plan in plans)
        if not variable_carries_duration:
            # A clip's duration is inferred from surviving sample times. Keep one
            # constant endpoint pair if pruning would otherwise shorten the loop.
            anchor = next((plan for plan in plans if not plan["remove"] and plan["times"][-1][0] == duration), None)
            if anchor is None:
                anchor = next(plan for plan in plans if plan["times"][-1][0] == duration)
                anchor["remove"] = False
            anchor["anchor"] = True
        old_channels, old_samplers = len(animation["channels"]), len(animation["samplers"])
        channels, samplers, sampler_cache = [], [], {}
        for plan in plans:
            if plan["remove"]:
                report["removedRestChannels"] += 1
                continue
            sampler = copy.deepcopy(plan["sampler"])
            if plan["constant"]:
                selected = [0, len(plan["times"]) - 1] if plan["anchor"] and len(plan["times"]) > 1 else [0]
                if len(selected) < len(plan["times"]):
                    sampler["input"] = make_accessor(sampler["input"], [plan["times"][i] for i in selected], timing=True)
                    sampler["output"] = make_accessor(sampler["output"], [plan["values"][i] for i in selected])
                    report["collapsedConstantChannels"] += 1
            key = json.dumps(sampler, sort_keys=True, separators=(",", ":"))
            if key not in sampler_cache:
                sampler_cache[key] = len(samplers)
                samplers.append(sampler)
            channel = copy.deepcopy(plan["channel"])
            channel["sampler"] = sampler_cache[key]
            channels.append(channel)
        animation["channels"], animation["samplers"] = channels, samplers
        report["clips"].append({"name": animation.get("name"), "duration": duration,
                                "channelsBefore": old_channels, "channelsAfter": len(channels),
                                "samplersBefore": old_samplers, "samplersAfter": len(samplers)})
    return payloads, report


def strip_legacy_runtime_extras(doc):
    removed = {}
    def walk(value):
        if isinstance(value, dict):
            extras = value.get("extras")
            if isinstance(extras, dict):
                for key in list(extras):
                    legacy = key in ("asset_notes", "source_triangles", "runtime_decimation_ratio")
                    legacy = legacy or (key == "asset" and isinstance(extras[key], str) and
                                        extras[key].startswith("Original seated "))
                    if legacy:
                        extras.pop(key)
                        removed[key] = removed.get(key, 0) + 1
                if not extras:
                    value.pop("extras")
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)
    walk(doc)
    return removed


def image_dimensions(data):
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return struct.unpack_from(">II", data, 16)
    if not data.startswith(b"\xff\xd8"):
        raise ValueError("Only embedded PNG/JPEG cat atlases are supported")
    offset = 2
    while offset < len(data):
        if data[offset] != 255:
            raise ValueError("Invalid JPEG marker")
        while data[offset] == 255:
            offset += 1
        marker = data[offset]
        offset += 1
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            continue
        length = struct.unpack_from(">H", data, offset)[0]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                      0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            height, width = struct.unpack_from(">HH", data, offset + 3)
            return width, height
        if marker == 0xDA or length < 2:
            break
        offset += length
    raise ValueError("No JPEG size marker")


def texture_roles(doc):
    """Map each image to its named material/slot uses, independent of exporter order."""
    uses = {i: [] for i in range(len(doc.get("images", [])))}
    for material in doc.get("materials", []):
        def walk(value, trail):
            if not isinstance(value, dict):
                return
            for key, child in value.items():
                if key.endswith("Texture") and isinstance(child, dict) and "index" in child:
                    texture = doc["textures"][child["index"]]
                    uses[texture["source"]].append((material.get("name"), trail + key))
                walk(child, trail + key + ".")
        walk(material, "")
    return {tuple(sorted(role)): index for index, role in uses.items()}


def geometry_report(old_doc, old_bin, doc, binary):
    def streams(document):
        result = {}
        for mesh in document.get("meshes", []):
            for primitive in mesh["primitives"]:
                role = document["materials"][primitive["material"]].get("name")
                for name, accessor in {"indices": primitive["indices"],
                                       **primitive["attributes"]}.items():
                    if name.startswith(("JOINTS_", "WEIGHTS_")):
                        continue
                    key = role + ":" + name
                    if key in result:
                        raise ValueError("Material roles must identify one cat primitive")
                    result[key] = accessor
        return result
    old, new = streams(old_doc), streams(doc)
    added = new.keys() - old.keys()
    shin_role = "Hidden hind shins • approved coat"
    closure_role = "Anatomical closures • transferred fur"
    specifications = {
        shin_role: {"attributes": ("indices", "POSITION", "NORMAL"), "vertices": 192, "triangles": 384},
        closure_role: {"attributes": ("indices", "POSITION", "NORMAL", "COLOR_0"), "vertices": 1000, "triangles": 850},
    }
    present = {role: spec for role, spec in specifications.items() if any(key.startswith(role + ":") for key in added)}
    allowed = {role + ":" + name for role, spec in present.items() for name in spec["attributes"]}
    if old.keys() - new.keys() or added != allowed:
        raise ValueError("Baseline geometry/material attribute roles changed outside the explicit hind-shin/closure additions")
    additions = []
    for role, spec in present.items():
        position = doc["accessors"][new[role + ":POSITION"]]
        normal = doc["accessors"][new[role + ":NORMAL"]]
        indices = doc["accessors"][new[role + ":indices"]]
        if (position["type"] != "VEC3" or normal["type"] != "VEC3" or
                position["count"] != normal["count"] or not 0 < position["count"] <= spec["vertices"] or
                indices["type"] != "SCALAR" or indices["count"] % 3 or not 0 < indices["count"] // 3 <= spec["triangles"]):
            raise ValueError("Explicit added geometry exceeds its reviewed structural budget: " + role)
        addition = {"material": role, "vertices": position["count"],
                    "triangles": indices["count"] // 3,
                    "attributeSha256": {name: hashlib.sha256(accessor_bytes(doc, binary,
                        new[role + ":" + name])).hexdigest() for name in spec["attributes"]}}
        if role == closure_role:
            accessor_index = new[role + ":COLOR_0"]
            color = doc["accessors"][accessor_index]
            if (color["count"] != position["count"] or color["type"] not in ("VEC3", "VEC4") or
                    not (color["componentType"] == 5126 and not color.get("normalized") or
                         color["componentType"] in (5121, 5123) and color.get("normalized"))):
                raise ValueError("Transferred fur requires a valid per-vertex linear color attribute")
            values = accessor_values(doc, binary, accessor_index, normalized=True)
            if any(not math.isfinite(x) or not 0 <= x <= 1 for row in values for x in row):
                raise ValueError("Transferred fur colors must stay finite within zero to one")
            addition["colorAttribute"] = {"componentType": color["componentType"], "type": color["type"],
                "normalized": color.get("normalized", False), "colorSpace": "linear",
                "bytes": len(accessor_bytes(doc, binary, accessor_index))}
        additions.append(addition)
    shin_addition = next((value for value in additions if value["material"] == shin_role), None)
    allowed_morph_nodes = set()
    for mesh_index, mesh in enumerate(doc.get("meshes", [])):
        for primitive in mesh["primitives"]:
            targets = primitive.get("targets", [])
            if not targets:
                continue
            role = doc["materials"][primitive["material"]].get("name")
            if role != shin_role or shin_addition is None:
                raise ValueError("Morph targets may not change an original cat surface")
            if len(targets) != 1 or "POSITION" not in targets[0] or not set(targets[0]) <= {"POSITION", "NORMAL"}:
                raise ValueError("Only one localized POSITION/optional NORMAL calf target is allowed")
            if mesh.get("extras", {}).get("targetNames") != ["Walk calf fullness"]:
                raise ValueError("Unexpected hidden-shin morph target name")
            if mesh.get("weights", [0]) != [0]:
                raise ValueError("Calf fullness must default to zero in the seated mesh")
            target_report = {"name": "Walk calf fullness", "attributes": {}}
            for semantic, accessor_index in targets[0].items():
                accessor = doc["accessors"][accessor_index]
                if (accessor["componentType"] != 5126 or accessor["type"] != "VEC3" or
                        accessor["count"] != shin_addition["vertices"] or accessor.get("normalized")):
                    raise ValueError("Calf corrective must preserve full float per-vertex deltas")
                payload = accessor_bytes(doc, binary, accessor_index)
                values = accessor_values(doc, binary, accessor_index)
                if any(not math.isfinite(x) for row in values for x in row):
                    raise ValueError("Nonfinite calf corrective delta")
                target_report["attributes"][semantic] = {"bytes": len(payload),
                    "sha256": hashlib.sha256(payload).hexdigest(),
                    "maximumComponentDelta": max(abs(x) for row in values for x in row)}
            shin_addition["morphTargets"] = [target_report]
            shin_addition["morphBytes"] = sum(value["bytes"] for value in target_report["attributes"].values())
            shin_addition["defaultMorphWeights"] = [0]
            for index, node in enumerate(doc.get("nodes", [])):
                if node.get("mesh") == mesh_index:
                    if node.get("weights", [0]) != [0]:
                        raise ValueError("Calf fullness must default to zero on seated instances")
                    allowed_morph_nodes.add(index)
    corrective_channels = []
    for animation in doc.get("animations", []):
        for channel in animation["channels"]:
            if channel["target"].get("path") != "weights":
                continue
            if channel["target"].get("node") not in allowed_morph_nodes or animation.get("name") != "Walk":
                raise ValueError("Only Walk may animate the localized hidden-shin corrective")
            sampler = animation["samplers"][channel["sampler"]]
            accessor = doc["accessors"][sampler["output"]]
            input_accessor = doc["accessors"][sampler["input"]]
            if (accessor["type"] != "SCALAR" or accessor["componentType"] != 5126 or
                    accessor["count"] != input_accessor["count"]):
                raise ValueError("Expected one calf weight per Walk sample")
            values = [row[0] for row in accessor_values(doc, binary, sampler["output"])]
            if not values or any(not math.isfinite(x) or not 0 <= x <= 1 for x in values):
                raise ValueError("Calf corrective weights must stay within zero to one")
            corrective_channels.append({"clip": "Walk", "minimum": min(values), "maximum": max(values),
                                         "samples": len(values), "interpolation": sampler.get("interpolation", "LINEAR")})
    if allowed_morph_nodes:
        if len(corrective_channels) != 1:
            raise ValueError("Expected exactly one Walk calf corrective channel")
        shin_addition["morphAnimation"] = corrective_channels[0]
    report = {}
    for role in old:
        before = accessor_bytes(old_doc, old_bin, old[role])
        after = accessor_bytes(doc, binary, new[role])
        a, b = old_doc["accessors"][old[role]], doc["accessors"][new[role]]
        same_format = all(a.get(k) == b.get(k) for k in
                          ("count", "type", "componentType", "normalized"))
        entry = {"byteExact": same_format and before == after,
                 "baselineSha256": hashlib.sha256(before).hexdigest(),
                 "exportSha256": hashlib.sha256(after).hexdigest()}
        if same_format and a["componentType"] == 5126:
            aa = struct.unpack("<" + "f" * (len(before) // 4), before)
            bb = struct.unpack("<" + "f" * (len(after) // 4), after)
            entry["maxAbsDelta"] = max((abs(x - y) for x, y in zip(aa, bb)), default=0)
        report[role] = entry
    return report, additions


def restore_split_surface_normals(old_doc, old_bin, old_primitive, doc, binary, primitive):
    """Recover approved corner normals after duplicating contact-boundary vertices.

    The visible triangles retain their exact positions and UVs. New closing faces
    use their own UV cells, so they have no baseline match and retain their new
    normals. Never infer a match from proximity or alter positions/UVs/indices.
    """
    old_attributes, attributes = old_primitive["attributes"], primitive["attributes"]
    specifications = {"POSITION": ("VEC3", 12), "TEXCOORD_0": ("VEC2", 8), "NORMAL": ("VEC3", 12)}
    for name, (kind, _) in specifications.items():
        if name not in old_attributes or name not in attributes:
            return None
        for document, mapping in ((old_doc, old_attributes), (doc, attributes)):
            accessor = document["accessors"][mapping[name]]
            if accessor["type"] != kind or accessor["componentType"] != 5126 or accessor.get("normalized"):
                return None
    old_count = old_doc["accessors"][old_attributes["POSITION"]]["count"]
    count = doc["accessors"][attributes["POSITION"]]["count"]
    if any(old_doc["accessors"][old_attributes[name]]["count"] != old_count or
           doc["accessors"][attributes[name]]["count"] != count for name in specifications):
        raise ValueError("Normal restoration requires matching attribute vertex counts")
    before = {name: accessor_bytes(old_doc, old_bin, old_attributes[name]) for name in specifications}
    current = {name: accessor_bytes(doc, binary, attributes[name]) for name in specifications}
    def keys(streams, length):
        return [streams["POSITION"][i * 12:i * 12 + 12] + streams["TEXCOORD_0"][i * 8:i * 8 + 8]
                for i in range(length)]
    before_keys, current_keys = keys(before, old_count), keys(current, count)
    def triangles(document, data, part):
        if part.get("mode", 4) != 4:
            raise ValueError("Normal restoration requires indexed triangle primitives")
        indices = [row[0] for row in accessor_values(document, data, part["indices"])]
        if len(indices) % 3:
            raise ValueError("Incomplete triangle indices")
        return [indices[i:i + 3] for i in range(0, len(indices), 3)]
    def signature(indices, corner_keys):
        corners = tuple(corner_keys[index] for index in indices)
        # Cyclic index order is equivalent; reversed winding is deliberately not.
        return min(corners, corners[1:] + corners[:1], corners[2:] + corners[:2])
    approved_triangles = {signature(indices, before_keys)
                          for indices in triangles(old_doc, old_bin, old_primitive)}
    eligible = set()
    retained_triangles = 0
    for indices in triangles(doc, binary, primitive):
        if signature(indices, current_keys) in approved_triangles:
            eligible.update(indices)
            retained_triangles += 1
    lookup = {}
    for i in range(old_count):
        key = before_keys[i]
        raw = before["NORMAL"][i * 12:i * 12 + 12]
        lookup.setdefault(key, {})[raw] = struct.unpack("<3f", raw)
    result = bytearray(current["NORMAL"])
    report = {"method": "exactPositionUvLookup", "matchedVertices": 0,
              "restoredVertices": 0, "unmatchedNewVertices": 0,
              "excludedNewFaceVertices": 0, "retainedApprovedTriangles": retained_triangles,
              "maximumRestorationDelta": 0, "maximumCandidateCount": 0}
    for i in range(count):
        key = current_keys[i]
        candidates = lookup.get(key)
        if not candidates:
            report["unmatchedNewVertices"] += 1
            continue
        if i not in eligible:
            report["excludedNewFaceVertices"] += 1
            continue
        raw = current["NORMAL"][i * 12:i * 12 + 12]
        value = struct.unpack("<3f", raw)
        if any(not math.isfinite(x) for x in value):
            raise ValueError("Nonfinite split-surface normal")
        def distance(candidate):
            return (max(abs(a - b) for a, b in zip(value, candidates[candidate])),
                    sum((a - b) ** 2 for a, b in zip(value, candidates[candidate])), candidate)
        chosen = min(candidates, key=distance)
        delta = distance(chosen)[0]
        if delta > .002:
            raise ValueError("Matching approved surface normal differs by more than 0.002")
        result[i * 12:i * 12 + 12] = chosen
        report["matchedVertices"] += 1
        report["restoredVertices"] += int(raw != chosen)
        report["maximumRestorationDelta"] = max(report["maximumRestorationDelta"], delta)
        report["maximumCandidateCount"] = max(report["maximumCandidateCount"], len(candidates))
    report["sha256"] = hashlib.sha256(result).hexdigest()
    return bytes(result), report


def compact(raw, baseline=None, compact_normals=False):
    original, binary = parse_glb(raw)
    doc = copy.deepcopy(original)
    rigid_report = rigid_details(doc, binary)
    overrides, skin_accessors = {}, set()
    normal_restorations = set()
    override_views, quantized_normals = {}, {}
    maximum_weight_error = 0.0
    maximum_sum_error = 0.0
    skin_vertices = 0
    pairs = set()
    mesh_joint_counts = {}
    for node in doc.get("nodes", []):
        if "mesh" in node and "skin" in node:
            mesh_joint_counts.setdefault(node["mesh"], []).append(
                len(doc["skins"][node["skin"]]["joints"]))
    for mesh_id, mesh in enumerate(doc.get("meshes", [])):
        for primitive in mesh["primitives"]:
            attributes = primitive["attributes"]
            if not any(k.startswith(("JOINTS_", "WEIGHTS_")) for k in attributes):
                continue
            if any(k.startswith(("JOINTS_", "WEIGHTS_")) and not k.endswith("_0") for k in attributes):
                raise ValueError("Cat rig must use at most four influences per vertex")
            if not {"JOINTS_0", "WEIGHTS_0"}.issubset(attributes):
                raise ValueError("Incomplete skin attribute pair")
            ji, wi = attributes["JOINTS_0"], attributes["WEIGHTS_0"]
            joint_counts = mesh_joint_counts.get(mesh_id)
            if not joint_counts:
                raise ValueError("Skinned primitive is not attached to a skin")
            for index in (ji, wi):
                if doc["accessors"][index]["type"] != "VEC4":
                    raise ValueError("Skin attributes must be VEC4")
            joints = accessor_values(original, binary, ji)
            weights = accessor_values(original, binary, wi, normalized=True)
            if len(joints) != len(weights) or len(joints) != doc["accessors"][attributes["POSITION"]]["count"]:
                raise ValueError("Skin and geometry vertex counts differ")
            if any(any(x != int(x) or x < 0 or x >= min(joint_counts) or x > 255
                       for x in row) for row in joints):
                raise ValueError("Joint index is outside its skin or UBYTE range")
            if (ji, wi) in pairs:
                continue
            pairs.add((ji, wi))
            skin_vertices += len(joints)
            packed_weights = bytearray()
            for row in weights:
                if any(not math.isfinite(x) or x < -1e-7 for x in row):
                    raise ValueError("Nonfinite or negative skin weight")
                total = sum(max(x, 0) for x in row)
                maximum_sum_error = max(maximum_sum_error, abs(total - 1))
                if total <= 0 or abs(total - 1) > 1e-4:
                    raise ValueError("Input skin weights do not sum to one")
                normalized = [max(x, 0) / total for x in row]
                scaled = [x * 255 for x in normalized]
                integers = [math.floor(x) for x in scaled]
                order = sorted(range(4), key=lambda i: (-(scaled[i] - integers[i]), i))
                for index in order[:255 - sum(integers)]:
                    integers[index] += 1
                if sum(integers) != 255:
                    raise AssertionError("Quantized weight conservation failed")
                maximum_weight_error = max(maximum_weight_error,
                    max(abs(integers[i] / 255 - normalized[i]) for i in range(4)))
                packed_weights.extend(integers)
            converted = {ji: bytes(int(x) for row in joints for x in row), wi: bytes(packed_weights)}
            for index, payload in converted.items():
                if index in overrides and overrides[index] != payload:
                    raise ValueError("Shared accessor has incompatible skin roles")
                overrides[index] = payload
                accessor = doc["accessors"][index]
                accessor["componentType"] = 5121
                accessor.pop("min", None)
                accessor.pop("max", None)
                accessor.pop("byteOffset", None)
                if index == wi:
                    accessor["normalized"] = True
                else:
                    accessor.pop("normalized", None)
                accessor["bufferView"] = None
                skin_accessors.add(index)
    if not skin_accessors:
        raise ValueError("No skin attributes found")

    report = {"inputBytes": len(raw), "skinVertices": skin_vertices,
              "skinAttributeBytes": sum(len(v) for v in overrides.values()),
              "maximumWeightError": maximum_weight_error,
              "maximumInputWeightSumError": maximum_sum_error,
              "quantizedWeightSum": 255, "nonSkinPayloadsByteExact": True,
              "rigidDetails": rigid_report, "baselineNormalsRestored": []}
    image_overrides = {}
    if baseline is not None:
        old_doc, old_bin = parse_glb(baseline)
        roles_before, roles_after = texture_roles(old_doc), texture_roles(doc)
        if roles_before.keys() != roles_after.keys() or len(roles_before) != len(old_doc.get("images", [])):
            raise ValueError("Baseline atlas material roles changed or are ambiguous")
        report["baselineGeometry"], report["addedGeometry"] = geometry_report(old_doc, old_bin, original, binary)
        before_primitives = {old_doc["materials"][p["material"]]["name"]: p
                             for mesh in old_doc["meshes"] for p in mesh["primitives"]}
        for mesh in doc["meshes"]:
            for primitive in mesh["primitives"]:
                role = doc["materials"][primitive["material"]]["name"]
                key = role + ":NORMAL"
                normal = report["baselineGeometry"].get(key)
                other_streams = [v for k, v in report["baselineGeometry"].items()
                                 if k.startswith(role + ":") and k != key]
                if normal and not normal["byteExact"] and normal.get("maxAbsDelta", math.inf) <= 2e-7:
                    if other_streams and all(v["byteExact"] for v in other_streams):
                        index = primitive["attributes"]["NORMAL"]
                        overrides[index] = accessor_bytes(old_doc, old_bin,
                            before_primitives[role]["attributes"]["NORMAL"])
                        doc["accessors"][index]["bufferView"] = None
                        doc["accessors"][index].pop("byteOffset", None)
                        normal_restorations.add(index)
                        report["baselineNormalsRestored"].append({"material": role,
                            "exporterRoundingMaxDelta": normal["maxAbsDelta"],
                            "sha256": normal["baselineSha256"]})
                if normal and other_streams and not all(v["byteExact"] for v in other_streams):
                    # Contact seams duplicate vertices and add hidden closing
                    # triangles. Restore retained surface normals by exact corner
                    # identity; a whole-accessor equality test cannot cover them.
                    restored = restore_split_surface_normals(old_doc, old_bin, before_primitives[role],
                                                             original, binary, primitive)
                    if restored is not None:
                        payload, audit = restored
                        if audit["matchedVertices"]:
                            index = primitive["attributes"]["NORMAL"]
                            overrides[index] = payload
                            doc["accessors"][index]["bufferView"] = None
                            doc["accessors"][index].pop("byteOffset", None)
                            normal_restorations.add(index)
                            report["baselineNormalsRestored"].append({"material": role, **audit})
        if normal_restorations:
            report["nonSkinPayloadsByteExact"] = False
            report["nonSkinPayloadsByteExactExceptBaselineNormals"] = True
        report["baselineImages"] = []
        for role in roles_before:
            before = old_doc["images"][roles_before[role]]
            after = doc["images"][roles_after[role]]
            if "uri" in before or "uri" in after or before.get("mimeType") != after.get("mimeType"):
                raise ValueError("Atlas must retain its embedded image type")
            exact = view_bytes(old_doc, old_bin, before["bufferView"])
            current = view_bytes(original, binary, after["bufferView"])
            if image_dimensions(exact) != image_dimensions(current):
                raise ValueError("Atlas resolution changed")
            image_overrides[after["bufferView"]] = exact
            report["baselineImages"].append({"dimensions": list(image_dimensions(exact)),
                "bytes": len(exact), "sha256": hashlib.sha256(exact).hexdigest(),
                "exportImageWasExact": current == exact})

    if compact_normals:
        normal_references = {}
        references = accessor_references(doc)
        for mesh in doc.get("meshes", []):
            for primitive in mesh["primitives"]:
                attributes = primitive["attributes"]
                if "NORMAL" in attributes:
                    normal_references.setdefault(attributes["NORMAL"], []).append(attributes)
        normal_report = {"componentType": 5122, "normalized": True, "byteStride": 8,
                         "vertices": 0, "accessors": 0, "bytesSavedVsFloat": 0,
                         "maximumDecodedUnitComponentError": 0,
                         "maximumAngularErrorDegrees": 0, "sharedAccessorsSplit": 0}
        for source_index, holders in normal_references.items():
            accessor = doc["accessors"][source_index]
            if accessor["type"] != "VEC3":
                raise ValueError("Cat vertex normals must be VEC3")
            if source_index in normal_restorations:
                rows = list(struct.iter_unpack("<3f", overrides[source_index]))
            else:
                rows = accessor_values(original, binary, source_index, normalized=True)
            # An accessor can legally serve two semantics. Never quantize POSITION
            # (or any other unrelated use) merely because it shares NORMAL's data.
            index = source_index
            if any(holder[key] == source_index and key != "NORMAL" for holder, key in references):
                index = len(doc["accessors"])
                doc["accessors"].append(copy.deepcopy(accessor))
                accessor = doc["accessors"][index]
                for holder in holders:
                    holder["NORMAL"] = index
                normal_report["sharedAccessorsSplit"] += 1
            packed, unit_normals = bytearray(), []
            for row in rows:
                if any(not math.isfinite(x) for x in row):
                    raise ValueError("Nonfinite vertex normal")
                magnitude = math.sqrt(sum(x * x for x in row))
                if magnitude < 1e-12:
                    raise ValueError("Zero-length vertex normal")
                source = tuple(x / magnitude for x in row)
                integers = tuple(max(-32767, min(32767, round(x * 32767))) for x in source)
                decoded = tuple(x / 32767 for x in integers)
                decoded_length = math.sqrt(sum(x * x for x in decoded))
                normalized = tuple(x / decoded_length for x in decoded)
                error = max(abs(x - y) for x, y in zip(source, normalized))
                if error > 1 / 32767:
                    raise AssertionError("Decoded unit normal exceeds SHORT error bound")
                angle = math.degrees(math.acos(max(-1, min(1, sum(x * y for x, y in zip(source, normalized))))))
                normal_report["maximumDecodedUnitComponentError"] = max(
                    normal_report["maximumDecodedUnitComponentError"], error)
                normal_report["maximumAngularErrorDegrees"] = max(
                    normal_report["maximumAngularErrorDegrees"], angle)
                packed.extend(struct.pack("<3hxx", *integers))
                unit_normals.append(source)
            accessor.update(componentType=5122, normalized=True, bufferView=None)
            for key in ("byteOffset", "min", "max"):
                accessor.pop(key, None)
            overrides[index] = bytes(packed)
            override_views[index] = {"target": 34962, "byteStride": 8}
            quantized_normals[index] = unit_normals
            normal_report["vertices"] += len(rows)
            normal_report["accessors"] += 1
            normal_report["bytesSavedVsFloat"] += len(rows) * 4
        if quantized_normals:
            for key in ("extensionsUsed", "extensionsRequired"):
                if "KHR_mesh_quantization" not in doc.setdefault(key, []):
                    doc[key].append("KHR_mesh_quantization")
            report["normalQuantization"] = normal_report
            report["nonSkinPayloadsByteExact"] = False
            report.pop("nonSkinPayloadsByteExactExceptBaselineNormals", None)
            report["nonSkinPayloadsByteExactExceptAuditedNormals"] = True

    animation_payloads, animation_report = optimize_constant_animation_channels(doc, original, binary)
    for index, payload in animation_payloads.items():
        overrides[index] = payload
        override_views[index] = {}
    report["animationOptimization"] = animation_report
    report["legacyRuntimeExtrasRemoved"] = strip_legacy_runtime_extras(doc)

    # Rigid detail attributes have become unreachable. Drop their accessor/view
    # storage too; simply removing JOINTS from the primitive would save no bytes.
    used_accessors = {holder[key] for holder, key in accessor_references(doc)}
    for index, accessor in enumerate(doc["accessors"]):
        if index not in used_accessors:
            accessor.pop("bufferView", None)
    referenced = set()
    def collect(value):
        if isinstance(value, dict):
            for key, child in value.items():
                if key == "bufferView" and isinstance(child, int):
                    referenced.add(child)
                collect(child)
        elif isinstance(value, list):
            for child in value:
                collect(child)
    collect(doc)
    output, views, view_map = bytearray(), [], {}
    def append_view(data, view):
        output.extend(b"\0" * (-len(output) % 4))
        view = copy.deepcopy(view)
        view.update(buffer=0, byteOffset=len(output), byteLength=len(data))
        views.append(view)
        output.extend(data)
        return len(views) - 1
    for index, view in enumerate(original["bufferViews"]):
        if index in referenced:
            payload = image_overrides.get(index, view_bytes(original, binary, index))
            view_map[index] = append_view(payload, view)
    def remap(value):
        if isinstance(value, dict):
            for key, child in list(value.items()):
                if key == "bufferView" and isinstance(child, int):
                    value[key] = view_map[child]
                else:
                    remap(child)
        elif isinstance(value, list):
            for child in value:
                remap(child)
    remap(doc)
    for index, payload in sorted(overrides.items()):
        doc["accessors"][index]["bufferView"] = append_view(payload, override_views.get(index, {"target": 34962}))
    doc["bufferViews"] = views
    accessor_map = {old: new for new, old in enumerate(sorted(used_accessors))}
    for holder, key in accessor_references(doc):
        holder[key] = accessor_map[holder[key]]
    doc["accessors"] = [accessor for index, accessor in enumerate(doc["accessors"])
                        if index in used_accessors]
    result = write_glb(doc, bytes(output))
    packed_doc, packed_bin = parse_glb(result)
    for index in range(len(original["accessors"])):
        if index not in used_accessors:
            continue
        expected = overrides[index] if index in normal_restorations else accessor_bytes(original, binary, index)
        if index not in skin_accessors and index not in quantized_normals and expected != accessor_bytes(packed_doc, packed_bin, accessor_map[index]):
            raise AssertionError("Non-skin accessor payload changed")
    for index in skin_accessors:
        mapped = accessor_map[index]
        accessor = packed_doc["accessors"][mapped]
        if accessor.get("normalized"):
            if any(sum(row) != 255 for row in accessor_values(packed_doc, packed_bin, mapped)):
                raise AssertionError("Packed weight sum differs from 255")
    for index, source_normals in quantized_normals.items():
        mapped = accessor_map[index]
        view = packed_doc["bufferViews"][packed_doc["accessors"][mapped]["bufferView"]]
        if view["byteStride"] != 8 or view.get("byteOffset", 0) % 4:
            raise AssertionError("SHORT normals must retain aligned 8-byte vertex stride")
        decoded_normals = accessor_values(packed_doc, packed_bin, mapped, normalized=True)
        for source, decoded in zip(source_normals, decoded_normals):
            magnitude = math.sqrt(sum(x * x for x in decoded))
            if max(abs(x - y / magnitude) for x, y in zip(source, decoded)) > 1 / 32767:
                raise AssertionError("Packed unit normal exceeds SHORT error bound")
    for animation, audit in zip(packed_doc.get("animations", []), animation_report["clips"]):
        duration = max(accessor_values(packed_doc, packed_bin, sampler["input"])[-1][0]
                       for sampler in animation["samplers"])
        if duration != audit["duration"]:
            raise AssertionError("Animation cleanup changed clip duration")
    report.update(outputBytes=len(result), savedBytes=len(raw) - len(result),
                  outputSha256=hashlib.sha256(result).hexdigest())
    return result, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--compact-normals", action="store_true",
                        help="Encode NORMAL as normalized SHORT with KHR_mesh_quantization")
    args = parser.parse_args()
    result, report = compact(args.input.read_bytes(), args.baseline.read_bytes() if args.baseline else None,
                             compact_normals=args.compact_normals)
    args.output.write_bytes(result)
    if args.report:
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "baselineGeometry"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
