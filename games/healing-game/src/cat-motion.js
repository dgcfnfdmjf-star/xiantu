/* Pose the two surfaces of a Blender cat without changing its game actor.
 * The seated sculpt and corrected Walk have different binds. Keep the action
 * at full weight and blend the rendered endpoints over 0.4 seconds. */
(function (window) {
  'use strict';
  var P = window.GardenCatPose;
  var DURATION = .4;
  var strength = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? .3 : 1;

  function motionOf(k) {
    if (k.catMotion !== undefined) return k.catMotion;
    var pose = P.create(k);
    if (!pose) return (k.catMotion = null);
    // Only these bones receive offsets on top of the clip. The mixer skips
    // unchanged tracks, so restore its previous output before sampling again.
    var bones = [];
    k.catModel.traverse(function (b) {
      if (!b.isBone || !/^(Body|Head|Front(Paw|Lower)\.?[LR]|Tail(Root|Mid|Tip))$/.test(b.name)) return;
      bones.push({ bone: b, p: b.position.clone(), q: b.quaternion.clone(), s: b.scale.clone(),
        walkP: b.position.clone(), walkQ: b.quaternion.clone(), walkS: b.scale.clone() });
    });
    return (k.catMotion = { pose: pose, bones: bones, progress: 0, running: false });
  }

  function restore(m, clip) {
    for (var i = 0; i < m.bones.length; i++) {
      var b = m.bones[i];
      b.bone.position.copy(clip ? b.walkP : b.p);
      b.bone.quaternion.copy(clip ? b.walkQ : b.q);
      b.bone.scale.copy(clip ? b.walkS : b.s);
    }
  }

  function render(k, m, t, stand, scale, dt, cycle, strength) {
    var action = k.catWalkAction, duration = action.getClip().duration;
    var sample = P.sample(t, k.phase);
    if (stand === 0 && m.running) {
      action.stop();
      m.running = false;
    }
    if (stand < 1) {
      restore(m, false);
      var curl = k.curl || 0;
      P.seat(m.pose, sample, strength * (1 - .85 * curl), strength * (1 - .5 * curl));
    }
    if (stand > 0) {
      restore(m, m.running);
      if (!m.running) {
        action.reset().play();
        action.time = (k.phase / (Math.PI * 2) % 1) * duration;
        m.running = true;
      }
      action.setEffectiveTimeScale(scale);
      if (cycle !== undefined) action.time = (cycle % 1) * duration;
      k.catMixer.update(dt);
      for (var i = 0; i < m.bones.length; i++) {
        var b = m.bones[i];
        b.walkP.copy(b.bone.position); b.walkQ.copy(b.bone.quaternion); b.walkS.copy(b.bone.scale);
      }
      P.gait(m.pose, action.time / duration, strength);
    }
    P.blend(m.pose, stand);
    P.blink(m.pose, Math.max(sample.blink, k.curl || 0));
    k.catStand = stand;
  }

  function step(k, moving, speed, dt, t) {
    if (!k || !k.catMixer || !k.catWalkAction) return false;
    var m = motionOf(k);
    if (!m) return false;
    t = Number.isFinite(t) ? t : (m.time || 0) + dt;
    m.time = t;
    m.progress = Math.max(0, Math.min(1, m.progress + (moving ? dt : -dt) / DURATION));
    if (m.progress < 1e-8) m.progress = 0;
    if (m.progress > 1 - 1e-8) m.progress = 1;
    var stand = m.progress * m.progress * (3 - 2 * m.progress);
    var stride = k.catWalkStride * k.catWalkScale * k.size;
    render(k, m, t, stand, speed * k.catWalkAction.getClip().duration / stride, dt, undefined, strength);
    // The gameplay footprint still switches at the original movement boundary.
    k.catWalkWeight = moving ? 1 : 0;
    k.catWalkActive = moving;
    return true;
  }

  function reset(k) {
    var m = k.catMotion;
    if (!m) return;
    m.progress = 0;
    k.catWalkActive = false; k.catWalkWeight = 0;
    render(k, m, m.time || 0, 0, 0, 0, undefined, strength);
  }

  // Cinematic seeks provide both endpoints and the distance absolutely. The
  // resulting gait, face and posture are independent of the previous frame.
  function seek(k, t, stand, cycle, strength) {
    var m = motionOf(k);
    if (!m) return;
    render(k, m, t, stand, 0, 0, cycle, strength);
    k.catWalkActive = m.running;
    k.catWalkWeight = stand;
  }

  window.GardenCatMotion = { step: step, reset: reset, seek: seek };
})(window);
