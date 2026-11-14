/* cat-models.js — chapter-two Blender coats, with the original cats as a loading fallback.
 * Display only: movement, selection, rewards and saves remain in kittens.js.
 * Templates own geometry/materials; each actor owns its skeleton and animation mixer.
 */
(function (window) {
  'use strict';
  var T = window.THREE, cache = {}, loader = null, active = false, generation = 0, ambient = null;
  var COATS = { orange: true, calico: true, black: true, tabby: true };
  // The procedural cats were about .708 units tall before their existing 1.2–1.4 size.
  // Normalize the .885m asset once, keeping the same final .85–.99 island height.
  var KITTEN_HEIGHT = .708, AMBIENT_HEIGHT = .9;

  function displayMaterial(material) {
    // The legacy island renders directly with LinearEncoding. glTF lighting is linear too,
    // so its final pixels need an sRGB conversion to retain the atlas's intended coat colours.
    // Scope this to imported cat materials; changing the renderer would recolour the island.
    material.onBeforeCompile = function (shader, renderer) {
      if (renderer.outputEncoding === T.LinearEncoding) {
        shader.fragmentShader = shader.fragmentShader.replace('#include <encodings_fragment>', 'gl_FragColor = LinearTosRGB( gl_FragColor );');
      }
    };
    material.customProgramCacheKey = function () { return 'garden-cat-display-v1'; };
  }

  function load(kind) {
    if (cache[kind]) return cache[kind];
    cache[kind] = new Promise(function (resolve) {
      if (!T || !T.GLTFLoader) { resolve(null); return; }
      function failed() { resolve(null); }
      try {
        if (!loader) {
          loader = new T.GLTFLoader();
          // The official decoder is bundled with this page, including its WASM.
          // Decode/load failures still leave the original procedural cat visible.
          if (window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);
        }
        loader.load('./cats/' + kind + '-cat.glb', function (gltf) {
          try {
            var scene = gltf.scene, box = new T.Box3().makeEmpty();
            if (window.GardenCatGeometry) window.GardenCatGeometry.prepare(scene);
            var radius = 0, point = new T.Vector3(), stride = 0, walkRadius = 0;
            var walk = T.AnimationClip.findByName(gltf.animations || [], 'Walk');
            scene.updateMatrixWorld(true);
            // Measure the actual tail/paw outline, not an overly large rectangle around it.
            scene.traverse(function (node) {
              if (node.userData.catWalkStride > 0) stride = Number(node.userData.catWalkStride);
              if (node.userData.catWalkRadius > 0) walkRadius = Number(node.userData.catWalkRadius);
              if (!node.isMesh) return;
              (Array.isArray(node.material) ? node.material : [node.material]).forEach(displayMaterial);
              var positions = node.geometry.attributes.position;
              if (positions.normalized) throw new Error('Cat geometry decoder is missing');
              for (var i = 0; i < positions.count; i++) {
                point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld);
                box.expandByPoint(point);
                radius = Math.max(radius, Math.sqrt(point.x * point.x + point.z * point.z));
              }
            });
            // Geometry.boundingBox includes the corrective morph extremes in r128.
            // Normalize the actual seated vertices, including the unchanged paws.
            var height = box.max.y - box.min.y;
            if (!(height > 0) || !isFinite(height)) { failed(); return; }
            // A stale/static or incomplete asset must not bring back seated sliding.
            if (!walk || !(walk.duration > 0) || !walk.tracks.length || !(stride > 0) || !isFinite(stride) || !(walkRadius > 0) || !isFinite(walkRadius)) { failed(); return; }
            if (window.GardenCatGeometry) window.GardenCatGeometry.specialize(scene);
            resolve({ scene: scene, height: height, floor: box.min.y, radius: radius, walk: walk, stride: stride, walkRadius: Math.max(radius, walkRadius) });
          } catch (e) { failed(); }
        }, undefined, failed);
      } catch (e) { failed(); }
    });
    return cache[kind];
  }

  function cloneModel(source) {
    var model = source.clone(true), clones = new Map(), sources = new Map(), skeletons = new Map();
    function pair(a, b) {
      clones.set(a, b); sources.set(b, a);
      for (var i = 0; i < a.children.length; i++) pair(a.children[i], b.children[i]);
    }
    pair(source, model);
    model.traverse(function (node) {
      if (!node.isSkinnedMesh) return;
      var original = sources.get(node), skeleton = skeletons.get(original.skeleton);
      if (!skeleton) {
        skeleton = original.skeleton.clone();
        skeleton.bones = original.skeleton.bones.map(function (bone) {
          var copy = clones.get(bone);
          if (!copy) throw new Error('Cat skeleton bone is outside its scene');
          return copy;
        });
        skeletons.set(original.skeleton, skeleton);
      }
      node.bind(skeleton, original.bindMatrix);
      // Three r128 culls a skinned mesh using its seated, undeformed bounds.
      // The handful of island cats must keep their moving paws/tails visible.
      node.frustumCulled = false;
    });
    return { model: model, skeletons: Array.from(skeletons.values()) };
  }

  function createVisual(owner, template, height, animate) {
    var visual = new T.Group(), base = new T.Group(), clone = cloneModel(template.scene), model = clone.model;
    visual.name = 'BlenderCatVisual';
    var scale = height / template.height;
    // Finish all fallible rig/action setup before attaching anything or hiding
    // the original cat, so a malformed asset leaves a complete fallback.
    var mixer = animate ? new T.AnimationMixer(model) : null;
    var action = mixer ? mixer.clipAction(template.walk) : null;
    if (action) action.setLoop(T.LoopRepeat, Infinity);
    base.scale.set(scale, scale, scale); base.position.y = -template.floor * scale;
    base.add(model); visual.add(base); owner.root.add(visual);
    owner.catVisual = visual; owner.catModel = model; owner.catHeight = height;
    owner.catSkeletons = clone.skeletons;
    if (animate) {
      owner.catMixer = mixer; owner.catWalkAction = action;
      owner.catWalkStride = template.stride; owner.catWalkScale = scale;
      owner.catRestRadius = template.radius; owner.catWalkRadius = template.walkRadius;
      owner.catWalkWeight = 0; owner.catWalkActive = false;
      owner.catWalkX = owner.x; owner.catWalkZ = owner.z;
      owner.catStillTime = 0;
      updateFootprint(owner);
    }
    return scale;
  }

  function updateFootprint(k, weight) {
    // The standing tail/paws reach farther than the seated mesh. Feed the
    // exported extent into the existing prop/actor push-out.
    if (weight === undefined) weight = k.catWalkWeight;
    k.catFootprint = (k.catRestRadius + (k.catWalkRadius - k.catRestRadius) * weight) * k.catWalkScale * k.size;
  }

  function stopWalk(k) {
    if (!k.catWalkAction) return;
    // stop() restores the original properties saved by AnimationMixer: the exact
    // approved seated bind pose, rather than an arbitrary frame of the walk clip.
    k.catWalkAction.stop(); k.catWalkActive = false; k.catWalkWeight = 0;
    if (window.GardenCatGeometry) window.GardenCatGeometry.setWalk(k.catModel, false);
    updateFootprint(k);
  }

  function poseWalk(k, dt) {
    if (!k.catMixer) return;
    var action = k.catWalkAction;
    var special = k.state === 'hop' || k.state === 'hug' || k.state === 'sleep' || k.state === 'play';
    var moving = k.moving && !special;
    dt = isFinite(dt) ? Math.max(0, Math.min(dt, .1)) : 0;
    var traveled = isFinite(k.catWalkX) && isFinite(k.catWalkZ) ? Math.hypot(k.x - k.catWalkX, k.z - k.catWalkZ) : 0;
    k.catWalkX = k.x; k.catWalkZ = k.z;
    // stepTo can be shortened or completely stopped by the existing push-out.
    // Advance by what the displayed root actually covered, never its requested
    // speed. Brief stalls hold the planted pose; a sustained stop returns to
    // sitting without changing the gameplay state or collision reservation.
    k.catWalkActualSpeed = moving && dt > 0 ? traveled / dt : 0;
    k.catStillTime = moving && k.catWalkActualSpeed < .015 ? k.catStillTime + dt : 0;
    if (k.catStillTime > .18) moving = false;
    if (moving) {
      if (!k.catWalkActive) {
        if (window.GardenCatGeometry) window.GardenCatGeometry.setWalk(k.catModel, true);
        action.reset();
        action.time = ((k.phase || 0) / (Math.PI * 2) % 1) * action.getClip().duration;
        action.play(); k.catWalkActive = true;
      }
      action.paused = false;
      k.catWalkWeight = 1;
      action.setEffectiveWeight(1);
      // The exported stride includes both alternating steps, in model units.
      var distance = k.catWalkStride * k.catWalkScale * k.size;
      action.setEffectiveTimeScale(k.catWalkActualSpeed * action.getClip().duration / distance);
      k.catMixer.update(dt);
    } else if (k.catWalkActive) {
      stopWalk(k);
    }
    updateFootprint(k, k.moving && !special ? 1 : undefined);
  }

  function attach(k) {
    if (!active || !k || k.dead || k.catVisual || !COATS[k.kind.id]) return;
    var epoch = generation, ticket = (k.catModelTicket || 0) + 1;
    k.catModelTicket = ticket;
    load(k.kind.id).then(function (template) {
      if (!template || !active || epoch !== generation || ticket !== k.catModelTicket || k.dead || !k.root.parent || k.catVisual) return;
      try {
        createVisual(k, template, KITTEN_HEIGHT, true);
        k.inner.visible = false;
      } catch (e) { /* Keep the original, interactive cat if a malformed rig cannot clone. */ }
    });
  }

  function attachAmbient() {
    var cat = ambient;
    if (!active || !cat || cat.catVisual) return;
    var epoch = generation;
    load('orange').then(function (template) {
      if (!template || !active || epoch !== generation || ambient !== cat || !cat.root.parent || cat.catVisual) return;
      try { createVisual(cat, template, AMBIENT_HEIGHT, false); }
      catch (e) { return; }
      // The former decorative cat faced +X; exported models face +Z.
      cat.catVisual.rotation.y = Math.PI / 2;
      cat.body.visible = false; cat.head.visible = false; cat.tail.visible = false;
      cat.root.children.forEach(function (child) {
        if (child.userData.gp && child.userData.gp.kind === 'cat') child.position.y = AMBIENT_HEIGHT * .5;
      });
    });
  }

  window.GardenCatModels = {
    setLevel: function (level, kittens) {
      active = level === 2; generation++;
      if (!active) { kittens.forEach(stopWalk); return; }
      attachAmbient();
      kittens.forEach(attach);
    },
    attach: attach,
    prepareWalk: function (k, dt) {
      if (!active || !k.catMixer) return;
      // stepTo calls this before its existing push-out. Reserve the complete
      // walking footprint without advancing the action twice.
      updateFootprint(k, 1);
    },
    remove: function (k) {
      // Shared GPU resources belong to the cached template, never to an individual cat.
      k.catModelTicket = (k.catModelTicket || 0) + 1;
      stopWalk(k);
      if (k.catMixer) k.catMixer.uncacheRoot(k.catModel);
      k.catMixer = null; k.catWalkAction = null;
      if (k.catSkeletons) k.catSkeletons.forEach(function (skeleton) { skeleton.dispose(); });
      k.catSkeletons = null;
    },
    pose: function (k, t, dt) {
      if (!k.catVisual) return false;
      if (!active) return true;
      poseWalk(k, dt);
      var breathe = Math.sin(t * (k.state === 'sleep' ? .9 : 1.5) + k.phase);
      // The Walk clip supplies leg, body and tail motion; retain only the existing
      // breath/crouch and play feedback outside it. Root movement still belongs to kittens.js.
      k.catVisual.scale.y = k.catWalkActive ? 1 : 1 + breathe * .008 - k.crouch * .025 - k.curl * .015;
      k.catVisual.position.y = 0;
      if (k.state === 'play') k.catVisual.position.y += (1 + Math.sin(t * 4 + k.phase)) * .004;
      return true;
    },
    hitPoint: function (k, out) {
      if (!k.catVisual) { k.root.getWorldPosition(out); out.y += .3; return; }
      out.set(0, k.catHeight * .5 * k.catVisual.scale.y + k.catVisual.position.y, 0);
      k.root.localToWorld(out);
    },
    registerAmbient: function (cat) { ambient = cat; attachAmbient(); },
    poseAmbient: function (cat, t) {
      if (!cat.catVisual) return;
      cat.catVisual.scale.y = 1 + Math.sin(t * 1.6) * .008 * (1 - cat.k) + cat.k * .012;
    },
    ambientHead: function (cat, out) {
      if (!cat.catVisual) { cat.head.getWorldPosition(out); return; }
      out.set(0, AMBIENT_HEIGHT * .77 * cat.catVisual.scale.y, 0);
      cat.root.localToWorld(out);
    }
  };
})(window);
