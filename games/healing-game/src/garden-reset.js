/* Explicitly requested new journey. Never clear storage owned by another app. */
(function (root) {
  'use strict';
  function owned(key) {
    return typeof key === 'string' && (key.indexOf('healingGarden.') === 0 || key === 'hg_level2_unlocked');
  }
  function create(storage, navigate) {
    var resetting = false;
    function reset() {
      if (resetting) return false;
      var saved = [], target;
      try {
        target = storage();
        for (var i = 0; i < target.length; i++) {
          var key = target.key(i);
          if (owned(key)) saved.push([key, target.getItem(key)]);
        }
        // pagehide, visibilitychange and pending save retries must not recreate
        // the old journey between removal and navigation.
        resetting = true;
        saved.forEach(function (entry) { target.removeItem(entry[0]); });
      } catch (e) {
        // A denied removal must not pretend to be a successful fresh start.
        saved.forEach(function (entry) {
          try { if (entry[1] !== null) target.setItem(entry[0], entry[1]); } catch (ignored) { /* current game state remains in memory */ }
        });
        resetting = false;
        return false;
      }
      navigate();
      return true;
    }
    return { reset: reset, pending: function () { return resetting; } };
  }
  root.GardenReset = create(function () { return root.localStorage; }, function () {
    var url = new URL(root.location.href);
    // Development links must not unlock chapter two or replay the preview
    // immediately after a player explicitly asks for a fresh first chapter.
    url.searchParams.delete('level');
    url.searchParams.delete('cutscene');
    root.location.replace(url.href);
  });
  if (typeof module === 'object' && module.exports) module.exports = { create: create, owned: owned };
})(typeof window !== 'undefined' ? window : globalThis);
