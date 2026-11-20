/* Named alternatives to aiming at moving animals. Keep each button and its
 * focus stable while the corresponding objects enter, leave, or change state. */
(function (window, document) {
  'use strict';
  var chapters = {}, current, container, toggle, panel, status, buttons = [];
  var hudIds = { 1: 'bfHud', 2: 'kitHud', 3: 'starHud' };
  var names = { 1: '捕蝶', 2: '猫咪', 3: '拾萤' };

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) status.textContent = '';
  }

  function refresh() {
    if (!current || !panel || panel.hidden) return;
    var chapter = chapters[current];
    if (document.hidden || window.GardenJourney.blocked() || !chapter.actions.ready()) {
      var hadFocus = panel.contains(document.activeElement);
      setOpen(false);
      if (hadFocus && !document.hidden && !window.GardenJourney.blocked()) toggle.focus();
      return;
    }
    buttons.forEach(function (button, i) {
      var sp = chapter.species[i], label = chapter.actions.label(sp);
      var available = !!chapter.actions.pick(sp);
      if (button.textContent !== label) button.textContent = label;
      if (button.getAttribute('aria-disabled') !== String(!available)) {
        button.setAttribute('aria-disabled', String(!available));
        button.tabIndex = available ? 0 : -1;
      }
    });
  }

  function activate(i) {
    var chapter = chapters[current], button = buttons[i];
    if (!chapter || !button || panel.hidden || document.hidden || window.GardenJourney.blocked() || !chapter.actions.ready()) return;
    var sp = chapter.species[i], actor = chapter.actions.pick(sp);
    // A scene tap or a chapter update may have changed an invitation since the last refresh.
    if (!actor || button.textContent !== chapter.actions.label(sp) || button.getAttribute('aria-disabled') === 'true') {
      refresh();
      status.textContent = sp.name + '的状态已变化，请重新选择目标';
      return;
    }
    status.textContent = chapter.actions.use(actor);
    refresh();
  }

  function build() {
    container = document.createElement('div');
    container.id = 'gardenTargets';
    container.innerHTML = '<button type="button" id="gardenTargetsToggle" aria-expanded="false" aria-controls="gardenTargetsPanel"></button>' +
      '<div id="gardenTargetsPanel" role="group" aria-labelledby="gardenTargetsToggle" hidden>' +
      '<div class="garden-target-options"></div><p role="status" aria-live="polite" aria-atomic="true"></p></div>';
    toggle = container.firstElementChild;
    panel = toggle.nextElementSibling;
    status = panel.lastElementChild;
    toggle.onclick = function () {
      if (!panel.hidden) { setOpen(false); return; }
      if (!current || document.hidden || window.GardenJourney.blocked()) return;
      if (current === 1) {
        var net = document.querySelector('#modes [data-mode="net"]');
        if (!net.classList.contains('on')) net.click();
      }
      if (!chapters[current].actions.ready()) return;
      setOpen(true);
      refresh();
    };
    container.addEventListener('keydown', function (e) {
      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); return; }
      if (e.key === 'Escape' && !panel.hidden) {
        e.stopPropagation(); e.preventDefault(); setOpen(false); toggle.focus();
      }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && !panel.hidden) setOpen(false); });
  }

  function onLevel(level) {
    if (current === level) return;
    if (!container) build();
    setOpen(false);
    current = level;
    buttons = [];
    var options = panel.firstElementChild;
    options.textContent = '';
    if (!chapters[level]) { container.remove(); return; }
    toggle.textContent = '选择' + names[level] + '目标';
    chapters[level].species.forEach(function (sp, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.targetKind = sp.id;
      b.onclick = function () { activate(i); };
      options.appendChild(b);
      buttons.push(b);
    });
    document.getElementById(hudIds[level]).appendChild(container);
  }

  window.GardenTargets = {
    register: function (level, species, actions) { chapters[level] = { species: species, actions: actions }; },
    onLevel: onLevel,
    refresh: refresh
  };
})(window, document);
