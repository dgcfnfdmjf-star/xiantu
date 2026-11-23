/* One opaque surface per Blender primitive. The authored seat and the corrected,
 * skinned Walk share topology and UVs, but have different bind coordinates. */
(function (window) {
  'use strict';
  var T = window.THREE, surfaces = new WeakMap();

  function geometryFor(seated, walk) {
    var g = surfaces.get(walk);
    if (g) return g;
    g = new T.BufferGeometry();
    g.setIndex(walk.index);
    Object.keys(walk.attributes).forEach(function (name) { g.setAttribute(name, walk.attributes[name]); });
    g.morphAttributes = walk.morphAttributes;
    g.morphTargetsRelative = walk.morphTargetsRelative;
    g.setAttribute('l2SeatPosition', seated.attributes.position);
    g.setAttribute('l2SeatNormal', seated.attributes.normal);
    g.setAttribute('catAnatomy', window.GardenCatPose.weights(seated.attributes.position));
    surfaces.set(walk, g);
    return g;
  }

  function materialFor(src, pose) {
    var m = src.clone(), previous = src.onBeforeCompile, key = src.customProgramCacheKey();
    m.onBeforeCompile = function (shader, renderer) {
      previous.call(m, shader, renderer);
      shader.uniforms.catStand = pose.stand;
      shader.uniforms.catHead = pose.uHeadMatrix;
      shader.uniforms.catMotion = pose.uMotion;
      shader.uniforms.catEars = pose.uEars;
      shader.vertexShader = 'uniform float catStand;\nattribute vec3 l2SeatPosition;\nattribute vec3 l2SeatNormal;\n' +
        window.GardenCatPose.vertexShader + '\n' + shader.vertexShader
          .replace('#include <skinnormal_vertex>', '#include <skinnormal_vertex>\nif (catStand < 1.) objectNormal = mix(catSeatNormal(l2SeatPosition, l2SeatNormal), objectNormal, catStand);')
          .replace('#include <skinning_vertex>', '#include <skinning_vertex>\nif (catStand < 1.) transformed = mix(catSeatPoint(l2SeatPosition), transformed, catStand);');
    };
    m.customProgramCacheKey = function () { return key + '|garden-cat-pose'; };
    return m;
  }

  function copyTransform(to, from) {
    to.position.copy(from.position); to.quaternion.copy(from.quaternion); to.scale.copy(from.scale);
  }

  function create(owner) {
    var model = owner.catModel, parts = [], bones = {}, shapes = window.GardenCatGeometry;
    if (!model || !shapes) return null;
    model.traverse(function (node) {
      if (node.isBone) bones[node.name.replace(/[^a-zA-Z]/g, '')] = node;
      if (node.isSkinnedMesh && !Array.isArray(node.material)) parts.push(node);
    });
    var head = bones.Head;
    if (!head || !bones.Body || !bones.TailRoot || !bones.FrontPawL || !bones.FrontPawR ||
        !bones.FrontLowerL || !bones.FrontLowerR || !parts.length) return null;
    var pose = { bones: bones, head: head, body: bones.Body, tailRoot: bones.TailRoot, tailMid: bones.TailMid, tailTip: bones.TailTip,
      stand: { value: 0 }, uMotion: { value: new T.Vector4(0, 0, 0, 0) }, uEars: { value: new T.Vector2() }, uHeadMatrix: { value: new T.Matrix4() },
      parts: parts, face: [], eyes: [], materials: [], seatHead: new T.Object3D(), capturedHead: new T.Object3D() };
    head.updateMatrix();
    pose.inverseBindHead = head.matrix.clone().invert();
    shapes.setWalk(model, false);
    var seated = parts.map(function (p) { return { geometry: p.geometry, material: p.material, visible: p.visible }; });
    pose.original = seated;
    var prepared;
    try {
      shapes.setWalk(model, true);
      prepared = parts.map(function (p, i) {
        var geometry = geometryFor(seated[i].geometry, p.geometry), material = materialFor(p.material, pose);
        pose.materials.push(material);
        return geometry;
      });
    } catch (e) {
      pose.materials.forEach(function (m) { m.dispose(); });
      return null;
    } finally {
      shapes.setWalk(model, false);
    }
    parts.forEach(function (p, i) {
      p.geometry = prepared[i]; p.material = pose.materials[i];
      p.l2stand = pose.stand; p.l2seatVisible = seated[i].visible;
    });
    // Rigid eye/nose/whisker children use model-space coordinates offset by
    // the bind Head. Give them the same interpolated transform as the fur.
    pose.seatHead.name = 'CatPoseHead';
    head.parent.add(pose.seatHead);
    head.children.slice().forEach(function (part) {
      if (!part.isMesh || (owner.cutscene && /catchlight/i.test(part.name))) return;
      pose.seatHead.add(part); pose.face.push(part);
      if (!owner.cutscene && /eye|catchlight/i.test(part.name)) {
        var shine = /catchlight/i.test(part.name);
        if (!shine) {
          if (!part.geometry.boundingBox) part.geometry.computeBoundingBox();
          var bb = part.geometry.boundingBox;
          pose.eyeLine = part.position.y + part.scale.y * (bb.min.y + bb.max.y) * .5;
        }
        pose.eyes.push({ mesh: part, y: part.position.y, sy: part.scale.y, shine: shine });
      }
    });
    captureSeat(pose); blend(pose, 0);
    return pose;
  }

  function captureSeat(pose) {
    copyTransform(pose.capturedHead, pose.head);
    pose.head.updateMatrix();
    pose.uHeadMatrix.value.multiplyMatrices(pose.head.matrix, pose.inverseBindHead);
  }

  function blend(pose, stand) {
    pose.stand.value = stand;
    for (var i = 0; i < pose.parts.length; i++) pose.parts[i].visible = pose.parts[i].l2seatVisible || stand > 0;
    var face = pose.seatHead, walk = pose.head;
    copyTransform(face, pose.capturedHead);
    face.position.lerp(walk.position, stand); face.scale.lerp(walk.scale, stand); face.quaternion.slerp(walk.quaternion, stand);
  }

  function blink(pose, lid) {
    if (pose.eyeLine === undefined) return;
    for (var i = 0; i < pose.eyes.length; i++) {
      var eye = pose.eyes[i], mesh = eye.mesh, open = 1 - .96 * lid;
      mesh.scale.y = eye.sy * open;
      mesh.position.y = eye.y + (pose.eyeLine - eye.y) * (1 - open);
      if (eye.shine) mesh.visible = lid < .90;
    }
  }

  function dispose(pose) {
    blink(pose, 0);
    pose.face.forEach(function (p) { pose.head.add(p); });
    pose.head.parent.remove(pose.seatHead);
    pose.parts.forEach(function (p, i) {
      var original = pose.original[i];
      p.geometry = original.geometry; p.material = original.material; p.visible = original.visible;
      delete p.l2stand; delete p.l2seatVisible;
    });
    pose.materials.forEach(function (m) { m.dispose(); });
  }

  window.GardenCatSurface = { create: create, captureSeat: captureSeat, blend: blend, blink: blink, dispose: dispose };
})(window);
