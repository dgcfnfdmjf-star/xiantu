/* Fourth chapter progression. Pure rules shared by the scene and save migration. */
(function (root) {
  'use strict';
  var tones = [
    { id: 'sprout', name: '芽响', color: 0xa4dfb6, note: '嫩芽摇醒了第一缕风。' },
    { id: 'dewbell', name: '露铃', color: 0x9bdce6, note: '一滴露水落进清晨。' },
    { id: 'feather', name: '晨羽', color: 0xf5d794, note: '小鸟捎来一句早安。' },
    { id: 'breeze', name: '晴风', color: 0xf4b3bc, note: '风把烦恼轻轻吹远。' },
    { id: 'cloudsong', name: '云歌', color: 0xc7b7ef, note: '云朵也有自己的歌。' },
    { id: 'home', name: '归音', color: 0xf0e4b8, note: '最后一个音，落在家的方向。' }
  ];
  var songs = [
    { name: '嫩芽醒来', notes: [0, 2, 4] },
    { name: '风过云间', notes: [1, 3, 5] },
    { name: '把早安送回家', notes: [0, 3, 2, 5] }
  ];
  function bounded(value, max) { return typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= 0 && value <= max ? value : 0; }
  function normalize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var round = bounded(raw.round, songs.length), step = round < songs.length ? bounded(raw.step, songs[round].notes.length - 1) : 0;
    var found = tones.filter(function (t) { return Array.isArray(raw.found) && raw.found.indexOf(t.id) >= 0; }).map(function (t) { return t.id; });
    function remember(index) { if (found.indexOf(tones[index].id) < 0) found.push(tones[index].id); }
    for (var i = 0; i < round; i++) songs[i].notes.forEach(remember);
    if (round < songs.length) songs[round].notes.slice(0, step).forEach(remember);
    return { round: round, step: step, found: found };
  }
  function press(state, index) {
    if (typeof index !== 'number' || index !== Math.floor(index) || index < 0 || index >= tones.length) return { changed: false };
    if (state.round >= songs.length) return { changed: false, free: true };
    var song = songs[state.round];
    if (song.notes[state.step] !== index) { state.step = 0; return { changed: true, correct: false }; }
    var first = state.found.indexOf(tones[index].id) < 0;
    if (first) state.found.push(tones[index].id);
    state.step++;
    var roundComplete = state.step === song.notes.length;
    if (roundComplete) { state.round++; state.step = 0; }
    return { changed: true, correct: true, first: first, roundComplete: roundComplete, finished: state.round === songs.length };
  }
  root.ChimeRules = { tones: tones, songs: songs, normalize: normalize, press: press };
})(typeof window !== 'undefined' ? window : globalThis);
