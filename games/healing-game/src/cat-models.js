/* cat-models.js — chapter-two Blender coats, with the original cats as a loading fallback.
 * Display only: movement, selection, rewards and saves remain in kittens.js.
 * Templates own their geometry/materials for the page lifetime; instances only clone the graph.
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
        if (!loader) loader = new T.GLTFLoader();
        loader.load('./cats/' + kind + '-cat.glb', function (gltf) {
          try {
            var scene = gltf.scene, box = new T.Box3().setFromObject(scene);
            var height = box.max.y - box.min.y, radius = 0, point = new T.Vector3();
            if (!(height > 0) || !isFinite(height)) { failed(); return; }
            scene.updateMatrixWorld(true);
            // Measure the actual tail/paw outline, not an overly large rectangle around it.
            scene.traverse(function (node) {
              if (!node.isMesh) return;
              (Array.isArray(node.material) ? node.material : [node.material]).forEach(displayMaterial);
              var positions = node.geometry.attributes.position;
              for (var i = 0; i < positions.count; i++) {
                point.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld);
                radius = Math.max(radius, Math.sqrt(point.x * point.x + point.z * point.z));
              }
            });
            resolve({ scene: scene, height: height, floor: box.min.y, radius: radius });
          } catch (e) { failed(); }
        }, undefined, failed);
      } catch (e) { failed(); }
    });
    return cache[kind];
  }

  function createVisual(owner, template, height) {
    var visual = new T.Group(), base = new T.Group(), model = template.scene.clone(true);
    visual.name = 'BlenderCatVisual'; model.name = 'BlenderCatModel';
    var scale = height / template.height;
    base.scale.set(scale, scale, scale); base.position.y = -template.floor * scale;
    base.add(model); visual.add(base); owner.root.add(visual);
    owner.catVisual = visual; owner.catModel = model; owner.catHeight = height;
    return scale;
  }

  function attach(k) {
    if (!active || !k || k.dead || k.catVisual || !COATS[k.kind.id]) return;
    var epoch = generation, ticket = (k.catModelTicket || 0) + 1;
    k.catModelTicket = ticket;
    load(k.kind.id).then(function (template) {
      if (!template || !active || epoch !== generation || ticket !== k.catModelTicket || k.dead || !k.root.parent || k.catVisual) return;
      var scale = createVisual(k, template, KITTEN_HEIGHT);
      k.catFootprint = template.radius * scale * k.size;
      k.inner.visible = false;
    });
  }

  function attachAmbient() {
    var cat = ambient;
    if (!active || !cat || cat.catVisual) return;
    var epoch = generation;
    load('orange').then(function (template) {
      if (!template || !active || epoch !== generation || ambient !== cat || !cat.root.parent || cat.catVisual) return;
      createVisual(cat, template, AMBIENT_HEIGHT);
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
      if (!active) return;
      attachAmbient();
      kittens.forEach(attach);
    },
    attach: attach,
    remove: function (k) {
      // Shared GPU resources belong to the cached template, never to an individual cat.
      k.catModelTicket = (k.catModelTicket || 0) + 1;
    },
    pose: function (k, t) {
      if (!k.catVisual) return false;
      var breathe = Math.sin(t * (k.state === 'sleep' ? .9 : 1.5) + k.phase);
      // Animate the complete seated model. Its pivot is on the floor; all bob offsets are positive.
      k.catVisual.scale.y = 1 + breathe * .008 - k.crouch * .025 - k.curl * .015;
      k.catVisual.position.y = k.moving ? Math.abs(Math.sin(t * 9 + k.phase)) * .012 : 0;
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
