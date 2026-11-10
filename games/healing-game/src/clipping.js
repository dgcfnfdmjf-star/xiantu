/* ==================================================================
 * clipping.js — shared footprints and push-out helpers that stop models
 * passing through each other. All coordinates are island-local unless noted.
 * Display only: never reads or writes save data. Loaded with journey.js.
 * Plain ES5. No external resources.
 * ================================================================== */
(function (window) {
  'use strict';
  var TOP_Y = 0.25, TREE = { x: -2.5, z: -1.7 }, CAT = { x: 1.25, z: 2.45 };
  var LAMPS = [[-3.7, .7], [0, 3.8], [3.7, .7]];
  var BUSHES = [[-1.2, 2.7], [3.3, 1.5], [-3.6, .9], [.7, -3.3], [1.9, 3.3], [-1.5, -.1]];
  // Radii measured from the meshes: canopy blobs reach 1.4 from their shared centre, bushes .56, lamp rings/bases .48
  var CANOPY_Y = 1.95, CANOPY_R = 1.4, LAMP_R = .48, BUSH_R = .56, CAT_R = .55, FLOWER_R = .3;
  var chime = { x: 3.3, z: -2.1, on: false };
  var butterflyForward = null;

  // Moves (x, z) on p out of a circle. Continuous at the rim, so nothing visibly pops.
  function pushCircle(p, cx, cz, r, share) {
    var dx = p.x - cx, dz = p.z - cz, d = Math.sqrt(dx * dx + dz * dz);
    if (d >= r) return false;
    if (d < 1e-4) { p.x += r * (share || 1); return true; }
    var k = (r - d) * (share || 1) / d;
    p.x += dx * k; p.z += dz * k;
    return true;
  }
  function pushSphere(p, cx, cy, cz, r, share) {
    var dx = p.x - cx, dy = p.y - cy, dz = p.z - cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d >= r) return false;
    if (d < 1e-4) { p.y += r * (share || 1); return true; }
    var k = (r - d) * (share || 1) / d;
    p.x += dx * k; p.y += dy * k; p.z += dz * k;
    return true;
  }
  function near(x, z, cx, cz, r) { var dx = x - cx, dz = z - cz; return dx * dx + dz * dz < r * r; }
  function anyNear(list, x, z, r) {
    for (var i = 0; i < list.length; i++) if (near(x, z, list[i][0], list[i][1], r)) return true;
    return false;
  }

  window.GardenClip = {
    chime: chime,
    // Static ground dressing (tufts, pebbles) exists on every level, so it avoids every level's props
    groundClear: function (x, z, pad) {
      return !near(x, z, TREE.x, TREE.z, .25 + pad) && !near(x, z, CAT.x, CAT.z, .7 + pad) && !near(x, z, chime.x, chime.z, .05 + pad) &&
        !anyNear(LAMPS, x, z, LAMP_R + pad) && !anyNear(BUSHES, x, z, BUSH_R + pad);
    },
    // Tap planting only. canPlant() also filters saved flowers on load, so tightening it would delete them from old saves.
    plantBlocked: function (x, z, level, flowers) {
      var r = LAMP_R + FLOWER_R;
      if ((level === 3 && anyNear(LAMPS, x, z, r)) || (level === 2 && anyNear(BUSHES, x, z, BUSH_R + FLOWER_R)) || (chime.on && near(x, z, chime.x, chime.z, .35))) return '这里有点挤，换个地方吧';
      for (var i = 0; i < flowers.length; i++) if (near(x, z, flowers[i].root.position.x, flowers[i].root.position.z, .6)) return '这里有点挤，换个地方吧';
      return null;
    },
    // Flowers from older saves can stand where this level's props are. Move them on screen only; the save keeps their spot.
    syncFlowers: function (flowers, level) {
      var list = level === 3 ? LAMPS : (level === 2 ? BUSHES : []), r = (level === 3 ? LAMP_R : BUSH_R) + FLOWER_R;
      flowers.forEach(function (f) {
        var p = f.root.position;
        if (!f.home) f.home = { x: p.x, z: p.z };
        p.x = f.home.x; p.z = f.home.z;
        for (var i = 0; i < list.length; i++) pushCircle(p, list[i][0], list[i][1], r);
        if (chime.on) pushCircle(p, chime.x, chime.z, .35);
      });
    },
    kittenFree: function (x, z, flowers) {
      if (anyNear(BUSHES, x, z, BUSH_R + .3) || near(x, z, CAT.x, CAT.z, CAT_R + .3) || (chime.on && near(x, z, chime.x, chime.z, .35))) return false;
      for (var i = 0; i < flowers.length; i++) if (near(x, z, flowers[i].root.position.x, flowers[i].root.position.z, FLOWER_R + .2)) return false;
      return true;
    },
    settleKitten: function (k, kittens, flowers) {
      var i, p, pinned = k.state === 'play' || k.state === 'sleep'; // a kitten busy with its yarn or asleep stays put; others walk round it
      for (i = 0; i < kittens.length; i++) {
        p = kittens[i];
        if (p === k || p.dead) continue;
        if (p.yarn && !pinned) pushCircle(k, p.yarn.position.x, p.yarn.position.z, .45);
        if (!pinned && p.state !== 'hug') pushCircle(k, p.x, p.z, .62, p.state === 'play' || p.state === 'sleep' ? 1 : .5);
      }
      for (i = 0; i < flowers.length; i++) { p = flowers[i].root.position; pushCircle(k, p.x, p.z, FLOWER_R + .2); }
      if (chime.on) pushCircle(k, chime.x, chime.z, .35);
      pushCircle(k, CAT.x, CAT.z, CAT_R + .25);
      for (i = 0; i < BUSHES.length; i++) pushCircle(k, BUSHES[i][0], BUSHES[i][1], BUSH_R + .3);
    },
    // World space: butterflies live in the scene, so island-local props are shifted by the island's bob
    settleButterfly: function (p, list, self, iy, flowers) {
      var top = TOP_Y + iy, i, q;
      for (i = 0; i < list.length; i++) if (list[i] !== self) { q = list[i].pos; pushSphere(p, q.x, q.y, q.z, .7, .5); }
      for (i = 0; i < flowers.length; i++) { q = flowers[i].root.position; pushSphere(p, q.x, top + .72, q.z, .5); }
      if (chime.on) pushSphere(p, chime.x, top + 1.3, chime.z, 1);
      pushSphere(p, CAT.x, top + .25, CAT.z, CAT_R + .3);
      pushSphere(p, TREE.x, top + CANOPY_Y, TREE.z, CANOPY_R + .3);
    },
    settleWisp: function (w, wisps) {
      var p = w.g.position, i, q;
      // Orbits are recomputed from scratch every frame, so a full push here cannot build up or jitter
      // Two passes: a prop can push a wisp back onto its neighbour, and the second pass slides it along the prop instead
      for (var pass = 0; pass < 2; pass++) {
        for (i = 0; i < wisps.length; i++) if (wisps[i] !== w && wisps[i].g.visible) { q = wisps[i].g.position; pushSphere(p, q.x, q.y, q.z, .9); }
        if (this.boat && this.boat.visible) pushSphere(p, this.boat.position.x, this.boat.position.y, this.boat.position.z, 1.1);
        if (chime.on) pushSphere(p, chime.x, TOP_Y + 1.3, chime.z, 1);
        for (i = 0; i < LAMPS.length; i++) pushSphere(p, LAMPS[i][0], TOP_Y + .91, LAMPS[i][1], .35 + .45);
        pushSphere(p, TREE.x, TOP_Y + CANOPY_Y, TREE.z, CANOPY_R + .45);
      }
    },
    lanternSpawn: function (x, z, flowers) {
      var p = { x: x, z: z };
      for (var i = 0; i < flowers.length; i++) pushCircle(p, flowers[i].root.position.x, flowers[i].root.position.z, .4);
      pushCircle(p, TREE.x, TREE.z, CANOPY_R + .2);
      return p;
    },
    settleLantern: function (L, lanterns) {
      var p = L.g.position;
      for (var i = 0; i < lanterns.length; i++) if (lanterns[i] !== L) {
        var q = lanterns[i].g.position;
        if (Math.abs(q.y - p.y) < .5) pushCircle(p, q.x, q.z, .5, .5);
      }
      if (p.y < TOP_Y + 3.6) pushCircle(p, TREE.x, TREE.z, CANOPY_R + .2);
    },
    // Butterflies retain their collision-safe flight position. Near the camera
    // they taper away instead of being pushed through the tree or other props.
    // A sphere alone cannot protect a near plane while orbiting: use view depth.
    keepButterflyFromCamera: function (g, camera) {
      var p = g.position, c = camera.position;
      if (!butterflyForward) butterflyForward = p.clone();
      camera.getWorldDirection(butterflyForward);
      var dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z;
      var depth = dx * butterflyForward.x + dy * butterflyForward.y + dz * butterflyForward.z;
      g.visible = depth > 3.2;
      if (!g.visible) { g.scale.set(0, 0, 0); return; }
      // .70 encloses the .62 x .62 hinged wing, including every flap/bank.
      // Bound its perspective size even off axis and at portrait aspect ratios.
      var tangent = Math.tan(camera.fov * Math.PI / 360) / (camera.zoom || 1) * Math.min(1, camera.aspect);
      var side = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - depth * depth));
      var limit = .28 * tangent;
      var maxScale = depth * limit / (1 + side / depth + limit) / .70;
      var fade = Math.min(1, (depth - 3.2) / 1.3);
      var scale = Math.min(g.scale.x, maxScale) * fade;
      g.scale.set(scale, scale, scale);
    },
    // World-position sphere clearance remains useful for the distant clouds.
    keepFromCamera: function (p, cam, r) { pushSphere(p, cam.x, cam.y, cam.z, r); }
  };
})(window);
