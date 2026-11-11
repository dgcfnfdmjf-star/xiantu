/* The GLBs use standard glTF quantized attributes. Three r128's CPU attribute
 * readers predate normalized integer positions/weights; expand those once when
 * a template loads so bounds, picking and skinning agree with its GPU rendering.
 */
(function (window) {
  'use strict';
  var T = window.THREE, poseGeometries = new WeakMap(), poseMaterials = new WeakMap(), hiddenAtRest = new WeakSet();

  function decoded(attribute) {
    if (!attribute || !attribute.normalized) return attribute;
    var interleaved = attribute.isInterleavedBufferAttribute;
    var array = interleaved ? attribute.data.array : attribute.array, divisor, signed = false;
    if (array instanceof Int16Array) { divisor = 32767; signed = true; }
    else if (array instanceof Uint16Array) divisor = 65535;
    else if (array instanceof Int8Array) { divisor = 127; signed = true; }
    else if (array instanceof Uint8Array) divisor = 255;
    else throw new Error('Unsupported normalized cat attribute');
    var values = new Float32Array(attribute.count * attribute.itemSize);
    var stride = interleaved ? attribute.data.stride : attribute.itemSize;
    var offset = interleaved ? attribute.offset : 0;
    for (var i = 0; i < attribute.count; i++) for (var j = 0; j < attribute.itemSize; j++) {
      var value = array[i * stride + offset + j] / divisor;
      values[i * attribute.itemSize + j] = signed ? Math.max(-1, value) : value;
    }
    return new T.BufferAttribute(values, attribute.itemSize);
  }

  function sameSkeleton(a, b) {
    if (a.bones.length !== b.bones.length) return false;
    for (var i = 0; i < a.bones.length; i++) {
      if (a.bones[i] !== b.bones[i]) return false;
      var x = a.boneInverses[i].elements, y = b.boneInverses[i].elements;
      for (var j = 0; j < 16; j++) if (x[j] !== y[j]) return false;
    }
    return true;
  }

  function prepare(scene) {
    var geometries = new Set(), skeletons = [];
    scene.traverse(function (node) {
      if (!node.isMesh) return;
      var geometry = node.geometry;
      if (!geometries.has(geometry)) {
        geometries.add(geometry);
        ['position', 'uv', 'uv2', 'skinWeight'].forEach(function (name) {
          var attribute = geometry.getAttribute(name);
          if (attribute) geometry.setAttribute(name, decoded(attribute));
        });
        if (geometry.morphAttributes.position) geometry.morphAttributes.position = geometry.morphAttributes.position.map(decoded);
        geometry.boundingBox = null; geometry.boundingSphere = null;
      }
      if (!node.isSkinnedMesh) return;
      var shared = skeletons.find(function (candidate) { return sameSkeleton(candidate, node.skeleton); });
      if (shared) node.bind(shared, node.bindMatrix);
      else skeletons.push(node.skeleton);
      node.frustumCulled = false;
    });
    return scene;
  }

  function seatedBounds(scene) {
    var box = new T.Box3().makeEmpty(), point = new T.Vector3();
    scene.updateMatrixWorld(true);
    scene.traverse(function (node) {
      if (!node.isMesh) return;
      var positions = node.geometry.attributes.position;
      if (positions.normalized) throw new Error('Prepare cat attributes before measuring its pose');
      for (var i = 0; i < positions.count; i++) box.expandByPoint(point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld));
    });
    return box;
  }

  function fixedSurface(original, walking) {
    var geometry = new T.BufferGeometry();
    geometry.setIndex(original.index);
    Object.keys(original.attributes).forEach(function (name) { geometry.setAttribute(name, original.attributes[name]); });
    original.groups.forEach(function (group) { geometry.addGroup(group.start, group.count, group.materialIndex); });
    if (walking) ['position', 'normal'].forEach(function (name) {
      var delta = original.morphAttributes[name] && original.morphAttributes[name][0];
      if (!delta) return;
      var basis = decoded(original.attributes[name]), values = new Float32Array(basis.count * 3);
      for (var i = 0; i < basis.count; i++) {
        values[i * 3] = basis.getX(i) + delta.getX(i);
        values[i * 3 + 1] = basis.getY(i) + delta.getY(i);
        values[i * 3 + 2] = basis.getZ(i) + delta.getZ(i);
      }
      geometry.setAttribute(name, new T.BufferAttribute(values, 3));
    });
    return geometry;
  }

  function specialize(scene) {
    // These two surfaces use a constant 0/1 completion, never an in-between pose.
    // Materialize both once per coat. Walking still uses the same skeleton and
    // exact full corrective coordinates/normals, without thousands of redundant
    // per-vertex morph additions or another morph shader on every game frame.
    scene.traverse(function (node) {
      if (!node.isMesh || !node.morphTargetDictionary) return;
      if (node.morphTargetDictionary['Walk calf phase 0'] === 0) {
        hiddenAtRest.add(node.geometry); node.visible = false;
      }
      if (node.morphTargetDictionary['Walk surface completion'] !== 0 || node.morphTargetInfluences.length !== 1) return;
      var original = node.geometry, pair = poseGeometries.get(original);
      if (!pair) {
        pair = { rest: fixedSurface(original, false), walk: fixedSurface(original, true) };
        poseGeometries.set(pair.rest, pair); poseGeometries.set(pair.walk, pair); poseGeometries.set(original, pair);
        // This small primitive is the previously hidden anatomical closure;
        // the 5,254-triangle original fur is always visible.
        if (original.index && original.index.count / 3 < 1000) {
          hiddenAtRest.add(pair.rest); hiddenAtRest.add(pair.walk);
        }
      }
      node.geometry = pair.rest;
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(function (material) {
        // r128 selects the morph shader from material flags, not from the
        // geometry's attribute list. Disable both for this fixed surface.
        material.morphTargets = false; material.morphNormals = false; material.needsUpdate = true;
      });
    });
    scene.traverse(function (node) {
      if (!node.isSkinnedMesh) return;
      var walking = node.material, pair = poseMaterials.get(walking);
      if (!pair) {
        var seated = walking.clone(); seated.skinning = false;
        seated.onBeforeCompile = walking.onBeforeCompile;
        seated.customProgramCacheKey = walking.customProgramCacheKey;
        pair = { rest: seated, walk: walking };
        poseMaterials.set(seated, pair); poseMaterials.set(walking, pair);
      }
      node.material = pair.rest;
      if (hiddenAtRest.has(node.geometry)) node.visible = false;
    });
  }

  function setWalk(scene, walking) {
    scene.traverse(function (node) {
      if (!node.isMesh) return;
      var pair = poseGeometries.get(node.geometry);
      if (pair) node.geometry = walking ? pair.walk : pair.rest;
      var materials = poseMaterials.get(node.material);
      if (materials) node.material = walking ? materials.walk : materials.rest;
      if (hiddenAtRest.has(node.geometry)) node.visible = walking;
    });
  }

  window.GardenCatGeometry = Object.freeze({ prepare: prepare, seatedBounds: seatedBounds, specialize: specialize, setWalk: setWalk });
})(window);
