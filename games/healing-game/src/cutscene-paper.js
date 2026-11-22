/* The five paper textures belong to their films. Warm only the current chapter's
 * texture, outside the interaction that advances its progress. */
(function (root) {
  'use strict';
  var prepared = {}, pending = {};

  function warm(level) {
    if (prepared[level] || pending[level] || root.document.hidden) return;
    var film = root['__l' + level + 'Cutscene'];
    if (!film || !film.ready() || !film.enabled()) return;
    // In these two chapters reduced motion goes straight to the ending card.
    if (level >= 4 && root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    pending[level] = true;
    function prepare() {
      delete pending[level];
      if (root.document.hidden || Number(root.document.body.getAttribute('data-garden-level')) !== level || !film.enabled()) return;
      film.preparePaper();
      prepared[level] = true;
    }
    if (root.requestIdleCallback) root.requestIdleCallback(prepare, { timeout: 1200 });
    else root.setTimeout(prepare, 80);
  }

  function consider(butterflies, cats, journey) {
    var level = cats.level;
    if (prepared[level] || pending[level]) return;
    var nearEnd = (level === 1 && !butterflies.ended && butterflies.total >= 24 && butterflies.total < 30) ||
      (level === 2 && !cats.ended && cats.total >= 16 && cats.total < 20) ||
      (level === 3 && journey.lamps.filter(Boolean).length === 2) ||
      (level === 4 && journey.chimes.round === 2) ||
      (level === 5 && journey.lotus.found.length === 5);
    if (nearEnd) warm(level);
  }

  root.GardenCutscenePaper = { consider: consider, warm: warm };
})(window);
