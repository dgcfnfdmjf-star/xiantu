/* Display poses for the four authored coats. Rest coordinates are in glTF metres,
 * +Y up, +Z forward. Every idle gesture can be sampled at any timeline second. */
(function (window) {
  'use strict';
  var TAU = 2 * Math.PI, T = window.THREE;

  function smooth(lo, hi, x) {
    var u = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
    return u * u * (3 - 2 * u);
  }

  // One event at a jittered offset inside each slot. Seeking backwards produces
  // the same ears/eyelids and consumes none of the game's random numbers.
  function noise(slot, salt) {
    var n = Math.sin(slot * 46.37 + salt * 17.61) * 43758.5453;
    return n - Math.floor(n);
  }
  function eventTime(t, period, phase, salt) {
    var time = t + 1.3 * phase, slot = Math.floor(time / period);
    return time - period * (slot + .08 + .46 * noise(slot, phase + salt));
  }
  function sample(t, phase) {
    var blinkTime = eventTime(t, 4.1, phase, 2), flickTime = eventTime(t, 3.5, phase, 9);
    var flick = flickTime > 0 && flickTime < .27 ? Math.sin(Math.PI * flickTime / .27) : 0;
    var curiosity = eventTime(t, 8.6, phase, 17);
    var turn = Math.floor((t + 1.3 * phase) / 8.6), hold = 1 + noise(turn, phase + 31);
    var tilt = smooth(0, .48, curiosity) * (1 - smooth(.48 + hold, 1.06 + hold, curiosity));
    var left = noise(Math.floor((t + 1.3 * phase) / 3.5), phase + 4) > .5;
    var lean = noise(0, phase + 6), pawSide = lean > .5 ? 1 : -1;
    return {
      breath: Math.sin(t * (1.48 + .14 * Math.sin(phase)) + phase),
      yaw: .15 * Math.sin(t * (.49 + .04 * Math.sin(phase)) + phase),
      tilt: (lean - .5) * .16 + tilt * (noise(turn, phase + 19) > .5 ? .15 : -.15),
      earPulse: flick,
      earL: .055 + .12 * lean + (left ? .24 * flick : 0),
      earR: -.04 - .13 * (1 - lean) - (left ? 0 : .25 * flick),
      paw: pawSide * (.015 + .016 * noise(0, phase + 13)),
      tail: Math.sin(t * 1.13 + phase),
      tailTip: Math.sin(t * 1.13 + phase - .82),
      blink: blinkTime > 0 && blinkTime < .19 ? Math.sin(Math.PI * blinkTime / .19) : 0
    };
  }

  // Resting tail centreline from the Blender sculpt, also used by the authored
  // Walk weights. Nearest-segment distance makes the field continuous where the
  // fused sitting mesh was split into separate body parts for the walking pose.
  var tail = [
    [.155,.137,-.113], [.225,.100,-.105], [.278,.065,-.028], [.292,.044,.092],
    [.270,.036,.213], [.200,.037,.276], [.132,.044,.273], [.111,.056,.239]
  ];
  function tailWeight(x, y, z) {
    if (y > .19 || x < .05) return 0;
    var nearest = Infinity, along = 0;
    for (var i = 1; i < tail.length; i++) {
      var a = tail[i - 1], b = tail[i], dx = b[0]-a[0], dy = b[1]-a[1], dz = b[2]-a[2];
      var u = Math.max(0, Math.min(1, ((x-a[0])*dx + (y-a[1])*dy + (z-a[2])*dz) / (dx*dx+dy*dy+dz*dz)));
      var d = Math.hypot(x-a[0]-u*dx, y-a[1]-u*dy, z-a[2]-u*dz);
      if (d < nearest) { nearest = d; along = (i - 1 + u) / (tail.length - 1); }
    }
    return along * (1 - smooth(.027, .057, nearest));
  }

  // Shared per template. One attribute supplies both the shader and the existing
  // stage's posed-vertex bounds probe. The paws and pelvis stay below the breath.
  function weights(position) {
    var data = new Float32Array(position.count * 4);
    for (var i = 0; i < position.count; i++) {
      var x = position.getX(i), y = position.getY(i), z = position.getZ(i), at = i * 4;
      var tailFraction = tailWeight(x, y, z);
      var fore = (1 - smooth(.12, .32, y)) * smooth(.054, .120, z)
        * (1 - smooth(.044, .085, Math.abs(Math.abs(x) - .077)));
      data[at] = smooth(.21, .395, y) * (1 - smooth(.52, .625, y));
      data[at + 1] = smooth(.754, .841, y) * smooth(.036, .083, Math.abs(x));
      data[at + 2] = Math.sign(x) * fore * (1 - smooth(.08, .6, tailFraction));
      data[at + 3] = tailFraction;
    }
    return new T.BufferAttribute(data, 4);
  }

  var vertexShader = [
    'attribute vec4 catAnatomy;',
    'uniform vec4 catMotion;', // chest expansion, forepaw lead, tail base, tail tip
    'uniform vec2 catEars; uniform mat4 catHead;',
    'mat2 catEarTurn(vec3 p) {',
    '  float a = (p.x < 0.0 ? catEars.x : catEars.y) * catAnatomy.y;',
    '  float c = cos(a), s = sin(a); return mat2(c,s,-s,c);',
    '}',
    'vec3 catSeatPoint(vec3 p) {',
    '  float neck = smoothstep(.49,.612,p.y), chest = catAnatomy.x * catMotion.x;',
    '  vec2 ear = vec2(sign(p.x)*.094,.747);',
    '  p.xy = ear + catEarTurn(p) * (p.xy - ear);',
    '  p += chest * vec3(.06*p.x, .009, .09*p.z-.006);',
    '  p.z += max(0.0, catAnatomy.z*catMotion.y);',
    '  float f = catAnatomy.w;',
    '  p.x += f * mix(catMotion.z,catMotion.w,f);',
    '  p.y += f*f * (.009+.22*catMotion.w);',
    '  return mix(p,(catHead*vec4(p,1.0)).xyz,neck);',
    '}',
    'vec3 catSeatNormal(vec3 p, vec3 n) {',
    '  float neck = smoothstep(.49,.612,p.y), chest = catAnatomy.x * catMotion.x;',
    '  n.xy = catEarTurn(p) * n.xy;',
    '  n.xz /= 1.0 + vec2(.06,.09) * chest;',
    '  return normalize(mix(n,mat3(catHead)*n,neck));',
    '}'
  ].join('\n');

  // CPU counterpart to catSeatPoint for measuring bounds of the surface drawn
  // by the GPU. Only called by existing on-demand cutscene inspection.
  var point = null;
  function seatPoint(pose, p, mask, i) {
    var motion = pose.uMotion.value, ears = pose.uEars.value;
    var chest = mask.getX(i) * motion.x, neck = smooth(.49,.612,p.y);
    var pivot = Math.sign(p.x) * .094, angle = (p.x < 0 ? ears.x : ears.y) * mask.getY(i);
    var c = Math.cos(angle), s = Math.sin(angle), x = p.x - pivot, y = p.y - .747;
    p.x = pivot + c*x - s*y; p.y = .747 + s*x + c*y;
    p.x += chest * .06 * p.x;
    p.y += chest * .009;
    p.z += chest * (.09*p.z-.006) + Math.max(0, mask.getZ(i)*motion.y);
    var f = mask.getW(i);
    p.x += f * (motion.z + (motion.w-motion.z)*f);
    p.y += f*f * (.009+.22*motion.w);
    if (neck) {
      if (!point) point = new T.Vector3();
      p.lerp(point.copy(p).applyMatrix4(pose.uHeadMatrix.value), neck);
    }
    return p;
  }

  var q, euler, rump;
  function turn(x, y, z) {
    if (!q) { q = new T.Quaternion(); euler = new T.Euler(); rump = new T.Vector3(); }
    return q.setFromEuler(euler.set(x, y, z, 'YXZ'));
  }

  // Called on the seated endpoint from rest (after any directed stage action).
  function seat(pose, motion, gazeStrength, motionStrength) {
    if (gazeStrength === undefined) gazeStrength = 1;
    if (motionStrength === undefined) motionStrength = 1;
    var breath = motion.breath * motionStrength;
    pose.head.quaternion.multiply(turn(0, motion.yaw*gazeStrength, motion.tilt*gazeStrength));
    pose.body.scale.x *= 1 + .06*breath;
    pose.body.scale.z *= 1 + .09*breath;
    var side = motion.paw > 0 ? 'R' : 'L';
    pose.bones['FrontPaw' + side].position.z += Math.abs(motion.paw);
    pose.bones['FrontLower' + side].position.z += Math.abs(motion.paw)*.4;
    pose.uEars.value.set(motion.earL * motionStrength, motion.earR * motionStrength);
    pose.uMotion.value.set(breath, motion.paw, .011 * motion.tail * motionStrength, .039 * motion.tailTip * motionStrength);
    window.GardenCatSurface.captureSeat(pose);
  }

  // Flat glTF bones are siblings. Rotate about the Walk's planted rump and carry
  // the tip about the middle joint before applying its own delayed bend.
  function gait(pose, cycle, strength) {
    if (strength === undefined) strength = 1;
    var phase = cycle*TAU, bob = Math.sin(2 * phase);
    var rotation = turn(.033 * bob * strength, 0, .015 * Math.sin(phase) * strength);
    var body = pose.body;
    rump.set(0, -.135, -.113).multiply(body.scale).applyQuaternion(body.quaternion);
    body.position.add(rump);
    body.position.sub(rump.applyQuaternion(rotation));
    body.quaternion.premultiply(rotation);
    pose.head.position.y += .005 * bob * strength;
    var mid = pose.tailMid, tip = pose.tailTip;
    if (!mid || !tip) return; // previous coats had only TailRoot
    rotation = turn(.04 * Math.sin(phase-.7) * strength, .14 * Math.sin(phase-.8) * strength, .10 * Math.sin(phase-.6) * strength);
    tip.position.sub(mid.position).applyQuaternion(rotation).add(mid.position);
    mid.quaternion.premultiply(rotation);
    tip.quaternion.premultiply(rotation);
    tip.quaternion.premultiply(turn(.055 * Math.sin(phase-1.4) * strength, .22 * Math.sin(phase-1.65) * strength, .12 * Math.sin(phase-1.2) * strength));
    // Carry the curve slightly higher at the rump so the tip sweeps inside the
    // authored walk radius. The three flat sibling joints rotate together.
    rotation = turn(.12 * strength, 0, 0);
    var base = pose.tailRoot;
    mid.position.sub(base.position).applyQuaternion(rotation).add(base.position);
    tip.position.sub(base.position).applyQuaternion(rotation).add(base.position);
    base.quaternion.premultiply(rotation);
    mid.quaternion.premultiply(rotation);
    tip.quaternion.premultiply(rotation);
  }

  window.GardenCatPose = {
    sample: sample, weights: weights, vertexShader: vertexShader, seatPoint: seatPoint, seat: seat, gait: gait,
    create: function (owner) {
      if (owner.catPose) return owner.catPose;
      var pose = window.GardenCatSurface.create(owner);
      if (pose) { pose.owner = owner; owner.catPose = pose; }
      return pose;
    },
    blend: function (pose, amount) { window.GardenCatSurface.blend(pose, amount); },
    blink: function (pose, lid) { window.GardenCatSurface.blink(pose, lid); },
    dispose: function (pose) {
      if (!pose || !pose.owner) return;
      window.GardenCatSurface.dispose(pose);
      pose.owner.catPose = null;
      pose.owner = null;
    }
  };
})(window);
