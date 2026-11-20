/* A second input path for the moving targets. Each chapter supplies its live
 * creatures and the same action that it uses for a pointer hit. */
(function (window, document) {
  'use strict';
  var chapters = {}, current, panel, list, empty, buttons = [], timer;

  function available() {
    return !document.hidden && panel.getClientRects().length > 0 && !window.GardenJourney.blocked() && current.enabled();
  }

  function refresh() {
    if (!panel || !panel.open || !current) return;
    var count = 0, enabled = available();
    buttons.forEach(function (row) {
      var target = enabled && current.find(row.kind);
      if (target) {
        var name = current.label(row.kind, target);
        if (row.button.textContent !== name) row.button.textContent = name;
        count++;
      }
      // A caught creature can disappear while VoiceOver or Tab is on it.
      // Keep that control in place until focus moves or the species returns.
      row.button.hidden = !target && row.button !== document.activeElement;
      if (target) row.button.removeAttribute('aria-disabled');
      else row.button.setAttribute('aria-disabled', 'true');
    });
    empty.hidden = count !== 0;
  }

  function mount(n) {
    var chapter = chapters[n];
    if (!panel) {
      panel = document.createElement('details'); panel.id = 'sceneTargets';
      panel.innerHTML = '<summary>场景目标</summary><div class="target-list"></div><p>暂时没有可操作的目标</p>';
      list = panel.querySelector('.target-list'); empty = panel.querySelector('p');
      panel.addEventListener('toggle', function () {
        clearInterval(timer);
        if (panel.open) { refresh(); timer = setInterval(refresh, 300); }
      });
      panel.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && panel.open) {
          panel.open = false; panel.querySelector('summary').focus(); event.preventDefault();
        }
      });
    }
    panel.open = false; panel.remove(); current = chapter;
    if (!chapter) return;
    list.textContent = '';
    buttons = chapter.kinds.map(function (kind) {
      var button = document.createElement('button'); button.type = 'button'; button.hidden = true;
      button.addEventListener('click', function () {
        // Recheck the chapter, panel and creature at activation, including stale clicks.
        if (current !== chapter || !panel.open || !available()) return;
        var target = chapter.find(kind);
        if (target) chapter.act(target);
        refresh();
      });
      list.appendChild(button);
      return { kind: kind, button: button };
    });
    document.getElementById(chapter.hud).appendChild(panel);
  }

  window.GardenTargets = {
    register: function (n, chapter) { chapters[n] = chapter; },
    mount: mount
  };
})(window, document);
