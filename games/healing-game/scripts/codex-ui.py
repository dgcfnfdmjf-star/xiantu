"""Start hints and the shared butterfly / kitten book in the working site."""
replace('</head>', '<style>\n' + (ROOT / 'src/codex-ui.css').read_text() + '\n</style>\n</head>')
replace('<li>👆 双指旋转 / 缩放视角</li>',
        '<li><span class="touch-camera-hint">👆 双指旋转 / 缩放视角</span>'
        '<span class="mouse-camera-hint">🖱️ 右键拖动旋转，滚轮缩放</span></li>')

replace("""    cx.innerHTML = '<div class="card glass"><h3>蝴蝶图鉴</h3><div class="gp-sub" id="bfSub"></div>' +
      '<div class="bf-grid" id="bfGrid"></div><div class="row">' +
      '<button class="btn alt" id="bfFlowers">🌸 花之图鉴</button><button class="btn" id="bfClose">合上图鉴</button></div></div>';""",
        """    cx.innerHTML = '<div class="card glass"><div class="bf-heading"><h3 id="bfTitle">蝴蝶图鉴</h3>' +
      '<button type="button" class="btn" id="bfClose">合上图鉴</button></div>' +
      '<div id="bfPages" role="region" aria-label="图鉴内容" tabindex="0">' +
      '<div id="bfSection"><div class="gp-sub" id="bfSub"></div><div class="bf-grid" id="bfGrid"></div></div>' +
      '<div class="row"><button class="btn alt" id="bfFlowers">🌸 花之图鉴</button></div></div></div>';""")
replace("var cx = $('bfCodex'), card = cx && cx.querySelector('.card');\n    if (card) {",
        "var pages = $('bfPages');\n    if (pages) {")
replace("      card.insertBefore(sec, card.querySelector('.row'));",
        "      pages.insertBefore(sec, pages.querySelector('.row'));")
replace("sec.innerHTML = '<h3>小猫图鉴</h3>", "sec.innerHTML = '<h3 id=\"kitTitle\">小猫图鉴</h3>")
replace("""    var cx = $('bfCodex'), card = cx && cx.querySelector('.card'), sec = $('kitSection');
    if (card && sec) {
      if (two) card.insertBefore(sec, card.firstChild);
      else card.insertBefore(sec, card.querySelector('.row'));
      card.classList.toggle('kit-first', two);
    }""",
        """    var pages = $('bfPages'), sec = $('kitSection');
    if (pages && sec) {
      if (two) {
        pages.prepend(sec);
        $('bfSection').prepend($('bfTitle'));
      } else {
        pages.insertBefore(sec, pages.querySelector('.row'));
        sec.prepend($('kitTitle'));
      }
      var title = two ? $('kitTitle') : $('bfTitle');
      $('bfClose').before(title);
      $('bfCodex').setAttribute('aria-labelledby', title.id);
      pages.classList.toggle('kit-first', two);
    }""")
# Only the HUD book button jumps to its chapter's leading section. The flower
# book and the later chapters' journal tabs keep their own entry handlers.
replace("nb.addEventListener('click', function () { setCodex(!codexOpen); });",
        """nb.addEventListener('click', function () {
        if (!codexOpen) nb.focus({ preventScroll: true });
        setCodex(!codexOpen);
        if (codexOpen) $('bfPages').scrollTop = 0;
      });""")
