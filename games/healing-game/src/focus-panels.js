/* Keep the active garden panel and its native controls accessible to touch,
 * keyboard and screen readers. Legacy panels fade with a class; newer ones
 * toggle hidden. Both still use their original open/close and scoring code. */
(function () {
  'use strict';
  var panelSelector = '#start,#fail,#ending,#gpBook,#bfCodex,#kitLevels,#bfEnding,#kitEnding,' +
    '#journeyPanel,#starEnding,#chimeEnding,#lotusEnding,#l1cs,#l2cs,#l3cs,#l4cs,#l5cs';
  var controlSelector = 'button:not(:disabled),input:not(:disabled),[tabindex="0"]';
  var active = null, gameFocus = null;
  var managed = new Map();

  function currentPanel() {
    var front = null, highest = -Infinity;
    document.querySelectorAll(panelSelector).forEach(function (panel) {
      if (panel.hidden || panel.classList.contains('hidden')) return;
      var style = getComputedStyle(panel);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      var z = Number(style.zIndex) || 0;
      if (z >= highest) { front = panel; highest = z; }
    });
    return front;
  }
  function usable(el) {
    return el && el.isConnected && !el.disabled && !el.closest('[inert],[hidden]') &&
      el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  }
  function controls(panel) {
    return Array.from(panel.querySelectorAll(controlSelector)).filter(usable);
  }
  function release(node) {
    var prior = managed.get(node);
    if (!prior) return;
    if (!prior.inert) node.removeAttribute('inert');
    if (prior.ariaHidden === null) node.removeAttribute('aria-hidden');
    else node.setAttribute('aria-hidden', prior.ariaHidden);
    managed.delete(node);
  }
  function synchronize() {
    var prev = active, panel = currentPanel(), toHide = [];
    active = panel;
    for (var node of document.body.children) {
      if (node.matches('script,style,link')) continue;
      var blocked = node !== panel && (panel !== null || node.matches(panelSelector));
      if (!blocked) release(node);
      else if (!managed.has(node)) toHide.push(node);
    }
    if (panel) {
      if (!panel.contains(document.activeElement) || !usable(document.activeElement)) {
        var first = controls(panel)[0] || panel;
        if (first === panel) panel.tabIndex = -1;
        first.focus({ preventScroll: true });
      }
    } else if (prev) {
      var target = [gameFocus, document.getElementById('gardenTargetsToggle'),
        document.getElementById('kitLevelBtn')].find(usable);
      if (target) target.focus({ preventScroll: true });
    }
    // Move focus out first. Hiding a still-focused subtree can be rejected by
    // the browser, leaving VoiceOver and keyboard focus in different panels.
    toHide.forEach(function (el) {
      managed.set(el, { inert: el.hasAttribute('inert'), ariaHidden: el.getAttribute('aria-hidden') });
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    });
  }
  function register(panel) {
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (!panel.hasAttribute('aria-label') && !panel.hasAttribute('aria-labelledby')) {
      var title = panel.querySelector('h1,h2,h3,p');
      if (title) {
        if (!title.id) title.id = panel.id + 'Title';
        panel.setAttribute('aria-labelledby', title.id);
      }
    }
    var observer = new MutationObserver(synchronize);
    var watched = ['class', 'hidden'];
    if (panel.id === 'start' || panel.id === 'fail') watched.push('style');
    observer.observe(panel, { attributes: true, attributeFilter: watched });
    // A cutscene swaps its only visible control from Skip to Continue.
    var skip = panel.querySelector('button[id$="csSkip"]');
    if (skip) observer.observe(skip, { attributes: true, attributeFilter: ['class'] });
  }
  document.querySelectorAll(panelSelector).forEach(register);
  new MutationObserver(function (changes) {
    var refresh = false;
    changes.forEach(function (change) {
      change.removedNodes.forEach(function (node) {
        if (!node.isConnected) release(node);
        if (node === active) refresh = true;
      });
      change.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches(panelSelector)) { register(node); refresh = true; }
        else if (active && (node.matches(controlSelector) || node.querySelector(controlSelector))) refresh = true;
      });
    });
    if (refresh) synchronize();
  }).observe(document.body, { childList: true });

  document.addEventListener('focusin', function (e) {
    if (!active && !e.target.closest(panelSelector)) gameFocus = e.target;
  });
  document.addEventListener('keydown', function (e) {
    if (!active || e.key !== 'Tab') return;
    var items = controls(active), first = items[0], last = items[items.length - 1];
    if (!first || (e.shiftKey ? document.activeElement === first : document.activeElement === last)) {
      e.preventDefault();
      e.stopPropagation();
      if (first) (e.shiftKey ? last : first).focus();
    }
  }, true);
  window.GardenFocus = {
    isCurrent: function (id) { var panel = currentPanel(); return !!panel && panel.id === id; }
  };
  synchronize();
})();
