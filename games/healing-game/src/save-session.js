/* Persistence for the working game. Keep existing save keys and payloads readable by older builds. */
(function (root) {
  'use strict';
  var HEAD = 'healingGarden.saveHead.v1';
  var CAT = 'healingGarden.kittens.v1', FLAG = 'hg_level2_unlocked';
  var KEYS = ['healingGarden.v3', 'healingGarden.butterflies.v1', CAT, FLAG, 'healingGarden.journey.v1'];

  function decode(key, raw) {
    if (raw === null) return null;
    if (key === FLAG) return raw;
    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
      if (key === CAT) {
        function counts(table) {
          return table && typeof table === 'object' && !Array.isArray(table) &&
            Object.keys(table).every(function (k) { return Number.isSafeInteger(table[k]) && table[k] >= 0; });
        }
        if (!['total','level','ended','caught','companions'].some(function (key) {
          return Object.prototype.hasOwnProperty.call(data, key);
        })) return undefined;
        if ((data.total !== undefined && (!Number.isSafeInteger(data.total) || data.total < 0)) ||
            (data.ended !== undefined && typeof data.ended !== 'boolean') ||
            (data.level !== undefined && (!Number.isInteger(data.level) || data.level < 1 || data.level > 5)) ||
            (data.caught !== undefined && !counts(data.caught)) ||
            (data.companions !== undefined && !counts(data.companions))) return undefined;
      }
      return data;
    } catch (e) { return undefined; }
  }

  function create(host) {
    var slots = {}, head, generation, revision, stale = false, resetPending = false, headIssue = '';
    var pending = {}, scheduled = false, retryTimer = null;
    var writer = host.crypto && host.crypto.randomUUID ? host.crypto.randomUUID() :
      Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    function storage() { return host.localStorage; }
    // Use content-derived names so reopening a damaged slot never fills the quota with copies.
    function quarantine(key, raw) {
      var hash = 2166136261;
      for (var i = 0; i < raw.length; i++) hash = Math.imul(hash ^ raw.charCodeAt(i), 16777619);
      var base = key + '.corrupt-' + raw.length + '-' + (hash >>> 0).toString(16), id = base;
      for (var n = 1; ; n++) {
        var previous = storage().getItem(id);
        if (previous === raw) return id;
        if (previous === null) { storage().setItem(id, raw); return id; }
        id = base + '-' + n;
      }
    }
    function loadHead() {
      head = storage().getItem(HEAD);
      var h = head === null ? {generation:'legacy', revision:0} : JSON.parse(head);
      if (!h || typeof h.generation !== 'string' || !Number.isSafeInteger(h.revision) || h.revision < 0) throw Error('Invalid save revision');
      generation = h.generation; revision = h.revision;
    }
    try { loadHead(); } catch (e) { headIssue = '无法读取存档版本，请恢复浏览器存储后刷新。本页暂不保存。'; }
    KEYS.forEach(function (key) {
      var s = slots[key] = { raw:null, data:null, state:'missing', corruptKey:null, restored:false };
      try {
        s.raw = storage().getItem(key); s.data = decode(key, s.raw);
        if (s.data != null) { s.state = 'loaded'; return; }
        if (s.data === undefined) {
          s.state = 'corrupt';
          // Never replace a damaged original until its verbatim copy has succeeded.
          try { s.corruptKey = quarantine(key, s.raw); } catch (e) { s.corruptKey = null; }
        }
        if (key !== FLAG) {
          var backup = decode(key, storage().getItem(key + '.bak'));
          if (backup) { s.data = backup; s.restored = true; }
        }
      } catch (e) { s.state = 'unreadable'; s.data = null; }
    });
    function status(key) {
      var s = slots[key];
      return { state:s.state, loadFailed:s.state === 'unreadable' || (s.state === 'corrupt' && !s.restored),
        restored:s.restored, corruptKey:s.corruptKey, stale:stale, generation:generation, revision:revision };
    }
    function message() {
      if (stale) return '另一页面已更新或重新开始旅程。本页已停止保存，请刷新后继续。';
      if (headIssue) return headIssue;
      for (var i=0; i<KEYS.length; i++) {
        var key = KEYS[i], s = slots[key], name = key === CAT ? '猫咪存档' : '存档';
        if (s.state === 'unreadable') return name + '暂时无法读取，请检查存储权限后刷新。本页会保留原档。';
        if (s.failed) return '浏览器未能保存进度，请先不要关闭页面；检查浏览器存储空间或隐私设置。';
        if (s.state === 'corrupt') {
          if (s.restored) return name + '损坏，已从备份恢复。';
          return name + (s.corruptKey ? '内容损坏，已隔离原文。' : '内容损坏，原文仍保留在原位置。');
        }
      }
      return '';
    }
    function notify() {
      if (host.GardenJourney && host.GardenJourney.refreshSaveNotice) host.GardenJourney.refreshSaveNotice();
    }
    function stillCurrent() {
      if (stale || headIssue) return false;
      var externalChange = storage().getItem(HEAD) !== head || KEYS.some(function (key) {
        var slot = slots[key];
        return slot.state !== 'unreadable' && storage().getItem(key) !== slot.raw;
      });
      if (externalChange) { stale = true; pending = {}; stage(); notify(); }
      return !externalChange;
    }
    function stamp(gen, rev) {
      var value = JSON.stringify({generation:gen, revision:rev, writer:writer});
      storage().setItem(HEAD, value); head = value; generation = gen; revision = rev;
    }
    var lockDatabase;
    function openLockDatabase() {
      if (!lockDatabase) lockDatabase = new Promise(function (resolve, reject) {
        var request = host.indexedDB.open('healingGarden.saveLock', 1);
        request.onupgradeneeded = function () { request.result.createObjectStore('writers'); };
        request.onsuccess = function () {
          var db = request.result;
          db.onversionchange = function () { db.close(); lockDatabase = null; };
          resolve(db);
        };
        request.onerror = function () { reject(request.error); };
      }).catch(function (error) { lockDatabase = null; throw error; });
      return lockDatabase;
    }
    function serial(action, failed) {
      if (host.navigator && host.navigator.locks) {
        host.navigator.locks.request('healingGarden.save', action).catch(failed);
      } else if (host.indexedDB) {
        // readwrite transactions on the same object store cannot overlap across tabs.
        openLockDatabase().then(function (db) {
          var tx = db.transaction('writers', 'readwrite');
          tx.onabort = function () { failed(tx.error); };
          tx.objectStore('writers').get('guard').onsuccess = function () {
            try { action(); } catch (error) { failed(error); }
          };
        }).catch(failed);
      } else {
        headIssue = '浏览器无法安全协调多个页面的存档。请使用支持本地存储的浏览器后重试。';
        failed();
      }
    }
    function writeOne(key) {
      var s = slots[key], json = pending[key];
      if (s.state === 'unreadable') return;
      var prev = storage().getItem(key);
      if (prev !== s.raw) { stale = true; pending = {}; return; }
      if (s.state === 'corrupt' && !s.corruptKey) {
        s.corruptKey = quarantine(key, prev);
      }
      if (prev !== json) {
        // Record the revision first. A failed payload write may leave a gap in revision
        // numbers, but can never leave new game data carrying the previous revision.
        stamp(generation, revision + 1);
        storage().setItem(key, json);
        if (key !== FLAG && decode(key, prev)) {
          try { storage().setItem(key + '.bak', prev); } catch (e) { /* retain the previous backup at quota */ }
        }
      }
      s.raw = json; s.data = decode(key, json); s.state = 'loaded'; s.failed = false; delete pending[key];
    }
    function retryLater() {
      if (retryTimer || stale || resetPending || !Object.keys(pending).length || host.document.hidden) return;
      retryTimer = host.setTimeout(function () { retryTimer = null; flush(); }, 3000);
    }
    // A navigation can destroy a document before the asynchronous origin lock is granted.
    // Stage the latest local changes in this tab only; a reload rechecks the original revision.
    var stagedKey = 'healingGarden.pending.v1';
    function stage() {
      try {
        if (Object.keys(pending).length && !stale && !resetPending) {
          var base = {};
          Object.keys(pending).forEach(function (key) { base[key] = slots[key].raw; });
          host.sessionStorage.setItem(stagedKey, JSON.stringify({head:head, base:base, values:pending}));
        } else host.sessionStorage.removeItem(stagedKey);
      } catch (e) { /* the normal persistent write can still succeed without sessionStorage */ }
    }
    function restoreStage() {
      try {
        var staged = JSON.parse(host.sessionStorage.getItem(stagedKey));
        if (staged && staged.head === head && !headIssue && staged.base && staged.values) KEYS.forEach(function (key) {
          var value = staged.values[key], slot = slots[key];
          if (typeof value === 'string' && slot.raw === staged.base[key] && slot.state !== 'unreadable' && decode(key,value) != null) pending[key] = value;
        });
        stage();
      } catch (e) { /* there is no recoverable pending write */ }
    }
    var afterWrites = [];
    function finishAttempt() {
      scheduled = false; stage(); notify(); retryLater();
      // Failed storage still allows local play. Its pending data and persistent warning
      // remain available for retry; on successful storage, the callback sees committed bytes.
      afterWrites.splice(0).forEach(function (callback) { callback(); });
    }
    function flush() {
      if (scheduled || resetPending || stale || headIssue || !Object.keys(pending).length) return;
      scheduled = true;
      function failure() { Object.keys(pending).forEach(function (key) { slots[key].failed = true; }); finishAttempt(); }
      serial(function () {
        if (!resetPending && stillCurrent()) Object.keys(pending).some(function (key) {
          try { writeOne(key); } catch (e) { slots[key].failed = true; }
          return stale;
        });
        finishAttempt();
      }, failure);
    }
    function write(key, json) {
      var s = slots[key];
      if (resetPending || stale || headIssue || s.state === 'unreadable') { notify(); return; }
      if (s.raw === json && !s.failed) { delete pending[key]; stage(); return; }
      pending[key] = json; stage(); flush();
    }
    function read(key) {
      var s = slots[key];
      if (Object.prototype.hasOwnProperty.call(pending,key)) return decode(key,pending[key]);
      return s.data;
    }
    function check() { try { stillCurrent(); } catch (e) { /* retry when storage returns */ } }
    host.addEventListener('storage', function (e) { if (e.key === HEAD || e.key === null || KEYS.indexOf(e.key) >= 0) check(); });
    host.addEventListener('pagehide', flush);
    host.document.addEventListener('visibilitychange', function () { check(); flush(); });
    restoreStage(); flush();
    return { read:read, write:write, status:status, message:message, flush:flush, headKey:HEAD,
      waitingForFilm:function () { return afterWrites.length > 0; },
      afterWrite:function (callback) { if (scheduled) afterWrites.push(callback); else callback(); },
      nextGeneration:function () { stamp(writer + '-' + Date.now().toString(36), 0); pending = {}; stage(); },
      reset:function (removeAndNavigate, done) {
        if (resetPending) return;
        resetPending = true;
        function end(ok) { resetPending = !!ok; if (!ok) flush(); done(!!ok); }
        serial(function () { end(stillCurrent() && removeAndNavigate()); }, function () { end(false); });
      } };
  }
  if (typeof module === 'object' && module.exports) module.exports = {create:create, headKey:HEAD};
  if (root.document) root.GardenSaves = create(root);
})(typeof window !== 'undefined' ? window : globalThis);
