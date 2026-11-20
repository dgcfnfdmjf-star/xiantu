/* One journal of expected storage values per document. A tab that observes another
 * writer keeps its in-memory scene, but can no longer commit that scene to disk. */
(function (root) {
  'use strict';
  var GENERATION = 'healingGarden.resetGeneration';
  var LOCK = 'healingGarden.progress';
  var PENDING = 'healingGarden.pending.';
  var RECORDS = ['healingGarden.journey.v1', 'healingGarden.kittens.v1', 'healingGarden.butterflies.v1', 'healingGarden.v3', 'hg_level2_unlocked'];
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function kittenSave(d) {
    return ['total', 'caught', 'companions', 'ended', 'level'].some(function (k) { return k in d; }) &&
      (d.total === undefined || (Number.isFinite(d.total) && d.total >= 0)) &&
      (d.level === undefined || Number.isInteger(d.level)) &&
      (d.ended === undefined || typeof d.ended === 'boolean') &&
      [d.caught, d.companions].every(function (counts) {
        return counts === undefined || (object(counts) && Object.values(counts).every(function (v) { return Number.isFinite(v) && v >= 0; }));
      });
  }
  function parse(raw, valid) {
    if (raw === null) return null;
    try { var d = JSON.parse(raw); if (object(d) && (!valid || valid(d))) return d; } catch (_) {}
    return undefined;
  }

  // A readwrite transaction also serializes cooperating tabs on HTTP origins
  // where Web Locks require HTTPS. Player records stay in their existing keys.
  function transactionLocks(indexedDB) {
    var database;
    function connect() {
      if (!database) database = new Promise(function (resolve, reject) {
        var request = indexedDB.open('healingGarden.saveLock', 1);
        request.onupgradeneeded = function () { request.result.createObjectStore('writes'); };
        request.onsuccess = function () {
          var db = request.result;
          db.onversionchange = function () { db.close(); database = null; };
          resolve(db);
        };
        request.onerror = function () { database = null; reject(request.error); };
      });
      return database;
    }
    return { request: function (name, run) {
      return connect().then(function (db) {
        return new Promise(function (resolve, reject) {
          var transaction = db.transaction('writes', 'readwrite'), result, error;
          transaction.objectStore('writes').get(name).onsuccess = function () {
            try { result = run(); } catch (e) { error = e; transaction.abort(); }
          };
          transaction.oncomplete = function () { resolve(result); };
          transaction.onabort = function () { reject(error || transaction.error); };
        });
      });
    } };
  }

  function create(getStorage, locks, notify, hidden) {
    var slots = [], stale = false, generation, retry = null, scheduled = false;
    var ticket = PENDING + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    var recovery, recoveryKey;
    function exclusive(run) {
      try { return locks ? locks.request(LOCK, run) : Promise.resolve(run()); }
      catch (error) { return Promise.reject(error); }
    }
    function backupAllowed(key, raw) {
      return key !== 'hg_level2_unlocked' && !!parse(raw, key === 'healingGarden.kittens.v1' ? kittenSave : null);
    }
    function writeRaw(storage, key, previous, next) {
      storage.setItem(key, next);
      if (backupAllowed(key, previous)) { try { storage.setItem(key + '.bak', previous); } catch (_) {} }
    }
    function matches(storage, change) {
      return object(change) && change.epoch === storage.getItem(GENERATION) &&
        object(change.before) && object(change.after) &&
        Object.keys(change.after).every(function (key) {
          return RECORDS.indexOf(key) >= 0 && Object.prototype.hasOwnProperty.call(change.before, key) &&
            (key === 'hg_level2_unlocked' ? change.after[key] === '1' :
              !!parse(change.after[key], key === 'healingGarden.kittens.v1' ? kittenSave : null));
        }) && Object.keys(change.before).every(function (key) {
          if (RECORDS.indexOf(key) < 0) return false;
          var value = storage.getItem(key);
          return value === change.before[key] || value === change.after[key];
        });
    }
    // A navigation may discard this document before an asynchronous lock is
    // granted. Read a matching handoff synchronously; reconcile the same bytes
    // under the lock before any new gameplay writes from this document.
    function lookForHandoff() {
      var storage = getStorage(), keys = [];
      for (var i = 0; i < storage.length; i++) {
        var key = storage.key(i);
        if (key && key.indexOf(PENDING) === 0) keys.push(key);
      }
      keys.sort().some(function (key) {
        var change = parse(storage.getItem(key));
        if (!matches(storage, change)) { storage.removeItem(key); return false; }
        recovery = change; recoveryKey = key; return true;
      });
      if (recovery) exclusive(function () {
        if (matches(storage, recovery)) {
          Object.keys(recovery.after).forEach(function (key) {
            var previous = storage.getItem(key), next = recovery.after[key];
            if (previous !== next) writeRaw(storage, key, previous, next);
          });
        } else { stale = true; }
        storage.removeItem(recoveryKey);
      }).catch(function () { stale = true; notify(); });
    }
    try { lookForHandoff(); } catch (_) { /* open() distinguishes denied reads */ }
    function message() {
      if (stale) return '另一页已保存新进度或重新开始。请刷新本页以继续保存。';
      if (slots.some(function (s) { return s.readError; })) return '未能读取原存档。请检查存储权限后刷新本页。';
      if (slots.some(function (s) { return s.failed; })) return '浏览器未能保存进度，请检查存储空间或隐私设置。';
      if (slots.some(function (s) { return s.invalid; })) return '检测到损坏的存档。原文已保留。';
      return '';
    }
    function current(storage) {
      if (generation !== storage.getItem(GENERATION) || slots.some(function (s) {
        return !s.readError && storage.getItem(s.key) !== s.raw;
      })) {
        stale = true;
        notify();
      }
      return !stale;
    }
    function quarantine(storage, slot) {
      if (slot.corruptKey) return;
      var prefix = slot.key + '.corrupt-', index = 0, key, existing;
      // Reloading a damaged save reuses its quarantine without filling storage.
      do {
        key = prefix + (++index);
        existing = storage.getItem(key);
      } while (existing !== null && existing !== slot.raw);
      if (existing === null) storage.setItem(key, slot.raw);
      slot.corruptKey = key;
    }
    function nextRaw(storage, slot) {
      if (slot.flag) return slot.pending;
      if (slot.invalid) quarantine(storage, slot);
      var value = JSON.parse(slot.pending);
      value.saveRevision = slot.revision + 1;
      return JSON.stringify(value);
    }
    function commit(storage, slot) {
      var next = nextRaw(storage, slot);
      writeRaw(storage, slot.key, slot.raw, next);
      slot.raw = next; slot.baseline = slot.pending; slot.pending = null;
      slot.revision++; slot.failed = false; slot.invalid = false;
    }
    function leaving() {
      if (!slots.some(function (s) { return s.pending !== null; })) return;
      try {
        var storage = getStorage();
        if (!current(storage)) return;
        var change = { epoch: generation, before: {}, after: {} };
        slots.forEach(function (s) {
          if (!s.readError) change.before[s.key] = s.raw;
          if (s.pending !== null) change.after[s.key] = nextRaw(storage, s);
        });
        storage.setItem(ticket, JSON.stringify(change));
      } catch (_) { onError(); }
      flush();
    }
    function drain() {
      var storage = getStorage();
      if (!current(storage)) return;
      slots.forEach(function (s) {
        if (s.pending === null) return;
        try { commit(storage, s); } catch (_) { s.failed = true; }
      });
      if (!slots.some(function (s) { return s.pending !== null; }) && storage.getItem(ticket) !== null) storage.removeItem(ticket);
      notify();
    }
    function finish() {
      scheduled = false;
      if (stale || !slots.some(function (s) { return s.pending !== null; })) return;
      if (slots.some(function (s) { return s.pending !== null && !s.failed; })) { flush(); return; }
      if (!hidden() && retry === null) {
        retry = setTimeout(function () { retry = null; flush(); }, 3000);
      }
    }
    function onError() {
      slots.forEach(function (s) { if (s.pending !== null) s.failed = true; });
      notify();
    }
    function flush() {
      if (scheduled || stale || !slots.some(function (s) { return s.pending !== null; })) return;
      scheduled = true;
      if (locks) {
        // Same-origin tabs can run in separate processes. Serialize the compare,
        // main write and backup rotation, including confirmed new journeys.
        locks.request(LOCK, drain).catch(onError).finally(finish);
      } else {
        try { drain(); } catch (_) { onError(); } finally { finish(); }
      }
    }
    function open(key, valid, flag) {
      var s = { key: key, flag: flag, raw: null, baseline: null, pending: null, revision: 0,
        restored: false, invalid: false, readError: false, corruptKey: null, failed: false };
      slots.push(s);
      var data = null;
      try {
        var storage = getStorage(), epoch = storage.getItem(GENERATION);
        if (generation === undefined) generation = epoch;
        if (epoch !== generation) stale = true;
        s.raw = recovery && recovery.epoch === epoch && Object.prototype.hasOwnProperty.call(recovery.after, key) ? recovery.after[key] : storage.getItem(key);
        if (flag) {
          data = s.raw;
          s.baseline = s.raw;
        } else {
          data = parse(s.raw, valid);
          if (data === undefined) {
            s.invalid = true;
            try { quarantine(storage, s); } catch (_) { /* original stays in place */ }
          }
          if (!data) {
            data = parse(storage.getItem(key + '.bak'), valid) || null;
            s.restored = !!data;
          }
          s.revision = data && Number.isSafeInteger(data.saveRevision) && data.saveRevision > 0 ? data.saveRevision : 0;
        }
      } catch (_) { s.readError = true; }
      return {
        data: data,
        remember: function (state) { s.baseline = JSON.stringify(state); },
        flagValue: function () { return s.pending === null ? s.raw : s.pending; },
        write: function (state, auto) {
          if (stale || s.readError || (s.invalid && auto)) return false;
          var json = flag ? state : JSON.stringify(state);
          s.pending = json === s.baseline ? null : json;
          flush();
          return true;
        },
        status: function () { return { readError: s.readError, loadFailed: s.readError || (s.invalid && !s.restored),
          restored: s.restored, corruptKey: s.corruptKey, stale: stale, revision: s.revision }; }
      };
    }
    return { open: open, flush: flush, leaving: leaving, message: message,
      changed: function (key) {
        if (key === null || key === GENERATION || slots.some(function (s) { return key === s.key; })) {
          try { current(getStorage()); } catch (_) { /* each write checks again */ }
        }
      },
      exclusive: exclusive
    };
  }
  if (typeof module === 'object' && module.exports) module.exports = { create: create, kittenSave: kittenSave, generation: GENERATION };
  if (!root.document) return;
  var locks;
  try { locks = root.navigator.locks || (root.indexedDB && transactionLocks(root.indexedDB)); } catch (_) {}
  var manager = root.GardenSaves = create(function () { return root.localStorage; }, locks, function () {
    var journey = root.GardenJourney;
    if (journey) {
      if (manager.message()) journey.saveWarning('progress');
      else journey.saveOk('progress');
    }
  }, function () { return root.document.hidden; });
  manager.kittenSave = kittenSave;
  manager.generation = GENERATION;
  root.addEventListener('storage', function (e) { manager.changed(e.key); });
  root.addEventListener('pagehide', manager.leaving);
  root.document.addEventListener('visibilitychange', function () { if (root.document.hidden) manager.leaving(); else manager.flush(); });
})(typeof window !== 'undefined' ? window : globalThis);
