/* Page behaviour: the ORR / ASR trade-off chart and the BibTeX copy button.
   Chart values are the averages reported in Table 1 of the paper. */

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // LLaVA-CoT. ORR: mean of MMSafetyAware and MOSSBench. ASR: mean of FigStep
  // and JailbreakV-28K Mini. Both in %, lower is better.
  var POINTS = {
    base:    { orr: 30.7, asr: 58.1 },
    vlguard: { orr: 97.4, asr: 0.5 },
    msr:     { orr: 59.6, asr: 11.7 },
    tis:     { orr: 71.7, asr: 2.8 },
    ours:    { orr: 55.9, asr: 1.7 }
  };

  var METHODS = [
    { key: 'vlguard', name: 'VLGuard', full: 'VLGuard', color: '#c0392b' },
    { key: 'tis', name: 'TIS', full: 'Think-in-Safety (TIS)', color: '#e08a1e' },
    { key: 'msr', name: 'MSR-Align', full: 'MSR-Align', color: '#8e5bb5' },
    { key: 'ours', name: 'SGSA (Ours)', full: 'SGSA (Ours)', color: '#1a9e75' },
    { key: 'base', name: 'Base model', full: 'Base model', color: '#85857e' }
  ];

  var X_RANGE = { min: 25, max: 100 };
  var Y_RANGE = { min: -10, max: 64 };

  // The chart is drawn at the container's real pixel width (viewBox width ==
  // CSS width), so text keeps its CSS size on phones instead of shrinking
  // with the whole SVG. Narrow layouts thin the ticks and tighten margins.
  function layoutFor(width) {
    var narrow = width < 560;
    var w = Math.max(300, Math.round(width));
    var h = narrow ? Math.round(w * 0.86) : Math.round(Math.min(460, w * 0.58));
    var m = narrow ? { l: 50, r: 14, t: 16, b: 52 } : { l: 72, r: 26, t: 22, b: 64 };
    return {
      narrow: narrow, w: w, h: h, m: m,
      pw: w - m.l - m.r,
      ph: h - m.t - m.b,
      xTicks: narrow ? [30, 50, 70, 90] : [30, 40, 50, 60, 70, 80, 90, 100],
      yTicks: narrow ? [0, 20, 40, 60] : [0, 10, 20, 30, 40, 50, 60],
      r: narrow ? 6 : 8,
      rOurs: narrow ? 7.5 : 10,
      labelGap: narrow ? 22 : 30
    };
  }

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  function bezier(p0, c, p1, t) {
    var u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y
    };
  }

  // Walk back along the curve until it clears the point's marker, so the
  // arrowhead lands next to the dot instead of underneath it.
  function trimmedEnd(p0, c, p1, gap) {
    for (var t = 1; t > 0.5; t -= 0.005) {
      var q = bezier(p0, c, p1, t);
      if (Math.hypot(q.x - p1.x, q.y - p1.y) >= gap) return q;
    }
    return bezier(p0, c, p1, 0.5);
  }

  function initChart(root) {
    var svg = root.querySelector('svg');
    var tooltip = root.querySelector('.tradeoff-tooltip');

    var L = null;   // current layout
    var nodes = {}; // per-method SVG elements

    function sx(orr) { return L.m.l + (orr - X_RANGE.min) / (X_RANGE.max - X_RANGE.min) * L.pw; }
    function sy(asr) { return L.m.t + (Y_RANGE.max - asr) / (Y_RANGE.max - Y_RANGE.min) * L.ph; }

    function contentWidth() {
      var host = svg.parentNode;
      var cs = window.getComputedStyle(host);
      return host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    }

    function build() {
      L = layoutFor(contentWidth());
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute('viewBox', '0 0 ' + L.w + ' ' + L.h);
      svg.classList.toggle('is-narrow', L.narrow);
      var defs = el('defs', {}, svg);

      var grid = el('g', {}, svg);
      L.xTicks.forEach(function (v) {
        el('line', { class: 'grid-line', x1: sx(v), x2: sx(v), y1: L.m.t, y2: L.m.t + L.ph }, grid);
        var t = el('text', { class: 'tick-label', x: sx(v), y: L.m.t + L.ph + (L.narrow ? 17 : 22), 'text-anchor': 'middle' }, grid);
        t.textContent = v;
      });
      L.yTicks.forEach(function (v) {
        el('line', { class: 'grid-line', x1: L.m.l, x2: L.m.l + L.pw, y1: sy(v), y2: sy(v) }, grid);
        var t = el('text', { class: 'tick-label', x: L.m.l - (L.narrow ? 8 : 12), y: sy(v) + 4.5, 'text-anchor': 'end' }, grid);
        t.textContent = v;
      });
      el('line', { class: 'axis-line', x1: L.m.l, x2: L.m.l + L.pw, y1: L.m.t + L.ph, y2: L.m.t + L.ph }, svg);
      el('line', { class: 'axis-line', x1: L.m.l, x2: L.m.l, y1: L.m.t, y2: L.m.t + L.ph }, svg);

      var xTitle = el('text', { class: 'axis-title', x: L.m.l + L.pw / 2, y: L.h - (L.narrow ? 10 : 14), 'text-anchor': 'middle' }, svg);
      xTitle.textContent = L.narrow ? 'Over-refusal, ORR (%) ↓' : 'Over-refusal rate, ORR (%) ↓';
      var yTitle = el('text', {
        class: 'axis-title', x: 0, y: 0, 'text-anchor': 'middle',
        transform: 'translate(' + (L.narrow ? 14 : 20) + ' ' + (L.m.t + L.ph / 2) + ') rotate(-90)'
      }, svg);
      yTitle.textContent = L.narrow ? 'Attack success, ASR (%) ↓' : 'Attack success rate, ASR (%) ↓';
      var hint = el('text', { class: 'better-hint', x: L.m.l + 8, y: L.m.t + L.ph - 8 }, svg);
      hint.textContent = '↙ better';

      // One arrow, dot, and label per method. Arrows go first so dots sit on top.
      var arrowLayer = el('g', {}, svg);
      var dotLayer = el('g', { role: 'list' }, svg);
      var labelLayer = el('g', { 'aria-hidden': 'true' }, svg);
      nodes = {};

      METHODS.forEach(function (m) {
        var n = { method: m, r: m.key === 'ours' ? L.rOurs : L.r };
        if (m.key !== 'base') {
          var gradId = 'grad-' + m.key;
          n.grad = el('linearGradient', { id: gradId, gradientUnits: 'userSpaceOnUse' }, defs);
          el('stop', { offset: '0', 'stop-color': m.color, 'stop-opacity': '0.08' }, n.grad);
          el('stop', { offset: '1', 'stop-color': m.color, 'stop-opacity': '0.95' }, n.grad);
          var marker = el('marker', {
            id: 'head-' + m.key, viewBox: '0 0 10 10', refX: '6', refY: '5',
            markerWidth: '5', markerHeight: '5', orient: 'auto-start-reverse'
          }, defs);
          el('path', { d: 'M0,0 L10,5 L0,10 z', fill: m.color }, marker);
          var sw = (m.key === 'ours' ? 4.2 : 3.2) * (L.narrow ? 0.75 : 1);
          n.arrow = el('path', {
            fill: 'none', stroke: 'url(#' + gradId + ')', 'stroke-width': sw,
            'stroke-linecap': 'round', 'marker-end': 'url(#head-' + m.key + ')'
          }, arrowLayer);
        }
        n.dot = el('circle', {
          class: 'point', r: n.r, fill: m.color, tabindex: '0', role: 'listitem',
          'aria-label': m.full + ': ORR ' + POINTS[m.key].orr.toFixed(1) + '%, ASR ' + POINTS[m.key].asr.toFixed(1) + '%'
        }, dotLayer);
        n.label = el('text', { class: 'point-label', fill: m.key === 'base' ? '#4a4a45' : m.color }, labelLayer);
        n.label.textContent = (L.narrow && m.key === 'ours') ? 'SGSA' : m.name;
        nodes[m.key] = n;

        n.dot.addEventListener('mouseenter', function () { showTooltip(m.key); });
        n.dot.addEventListener('mouseleave', function () { hideTooltip(m.key); });
        n.dot.addEventListener('focus', function () { showTooltip(m.key); });
        n.dot.addEventListener('blur', function () { hideTooltip(m.key); });
      });

      draw(POINTS);
    }

    function draw(values) {
      var b = values.base;
      var bp = { x: sx(b.orr), y: sy(b.asr) };
      METHODS.forEach(function (m) {
        var v = values[m.key];
        var n = nodes[m.key];
        var p = { x: sx(v.orr), y: sy(v.asr) };
        n.dot.setAttribute('cx', p.x.toFixed(1));
        n.dot.setAttribute('cy', p.y.toFixed(1));

        // Base and MSR-Align sit above the floor, so they label up and right;
        // the rest crowd the ASR floor and label underneath.
        var lx, ly, anchor;
        if (m.key === 'base' || m.key === 'msr') {
          lx = p.x + n.r + 4; ly = p.y - n.r - 5; anchor = 'start';
        } else if (v.orr > 92) {
          lx = p.x + n.r + 2; ly = p.y + L.labelGap; anchor = 'end';
        } else {
          lx = p.x; ly = p.y + L.labelGap; anchor = 'middle';
        }
        n.label.setAttribute('x', lx.toFixed(1));
        n.label.setAttribute('y', ly.toFixed(1));
        n.label.setAttribute('text-anchor', anchor);

        if (n.arrow) {
          // Bow each arrow up and to the right, like the paper's teaser.
          var c = { x: bp.x + 0.55 * (p.x - bp.x), y: bp.y + 0.18 * (p.y - bp.y) };
          var start = bezier(bp, c, p, 0.06);
          var end = trimmedEnd(bp, c, p, n.r + (L.narrow ? 5 : 7));
          var cc = { x: bp.x + 0.55 * (end.x - bp.x), y: bp.y + 0.18 * (end.y - bp.y) };
          n.arrow.setAttribute('d', 'M' + start.x.toFixed(1) + ',' + start.y.toFixed(1) +
            ' Q' + cc.x.toFixed(1) + ',' + cc.y.toFixed(1) + ' ' + end.x.toFixed(1) + ',' + end.y.toFixed(1));
          n.grad.setAttribute('x1', start.x.toFixed(1));
          n.grad.setAttribute('y1', start.y.toFixed(1));
          n.grad.setAttribute('x2', end.x.toFixed(1));
          n.grad.setAttribute('y2', end.y.toFixed(1));
        }
      });
    }

    function showTooltip(key) {
      var n = nodes[key];
      var v = POINTS[key];
      var box = svg.getBoundingClientRect();
      var host = root.getBoundingClientRect();
      var scale = box.width / L.w;
      var x = box.left - host.left + parseFloat(n.dot.getAttribute('cx')) * scale;
      var y = box.top - host.top + parseFloat(n.dot.getAttribute('cy')) * scale;
      tooltip.innerHTML = '<strong>' + n.method.full + '</strong>ORR ' + v.orr.toFixed(1) +
        '% &middot; ASR ' + v.asr.toFixed(1) + '%';
      // Keep the bubble inside the card near the left and right edges.
      var half = tooltip.offsetWidth / 2 + 6;
      tooltip.style.left = Math.min(Math.max(x, half), host.width - half) + 'px';
      tooltip.style.top = y + 'px';
      tooltip.classList.add('is-visible');
      n.dot.classList.add('is-hot');
    }

    function hideTooltip(key) {
      tooltip.classList.remove('is-visible');
      if (key && nodes[key]) nodes[key].dot.classList.remove('is-hot');
    }

    var lastWidth = contentWidth();
    var pending = null;
    window.addEventListener('resize', function () {
      if (pending) window.clearTimeout(pending);
      pending = window.setTimeout(function () {
        var width = contentWidth();
        if (Math.abs(width - lastWidth) < 2) return;
        lastWidth = width;
        hideTooltip();
        build();
      }, 120);
    });

    build();
  }

  function initCopy(button) {
    var target = document.getElementById(button.getAttribute('data-copy-target'));
    if (!target) return;
    var idle = button.textContent;

    function done(ok) {
      button.textContent = ok ? 'Copied!' : 'Press Ctrl+C';
      button.classList.toggle('is-copied', ok);
      window.setTimeout(function () {
        button.textContent = idle;
        button.classList.remove('is-copied');
      }, 1600);
    }

    function fallback() {
      var range = document.createRange();
      range.selectNodeContents(target);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      done(ok);
    }

    button.addEventListener('click', function () {
      var text = target.textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var chart = document.getElementById('tradeoff-chart');
    if (chart) initChart(chart);
    document.querySelectorAll('[data-copy-target]').forEach(initCopy);
  });
})();
