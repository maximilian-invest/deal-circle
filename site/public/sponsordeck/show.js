/* ============================================================
   Immo Intense 2026 — Sponsor Show · horizontal engine (v4)
   Vertical scroll → horizontal track on desktop; vertical stack on
   mobile/touch. Reveal choreography + parallax + count-up + dots.
   Runs synchronously on scroll so the slideshow tracks precisely.
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement, body = document.body;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- hero venue crossfade slideshow (independent of scroll engine) ---- */
  (function heroSlides() {
    var wrap = document.getElementById("heroSlides");
    if (!wrap) return;
    var slides = [].slice.call(wrap.querySelectorAll(".hero-slide"));
    if (slides.length < 2) return;
    slides.forEach(function (s) {           // preload for smooth crossfade
      var m = (s.style.backgroundImage || "").match(/url\(["']?(.*?)["']?\)/);
      if (m && m[1]) { var im = new Image(); im.src = m[1]; }
    });
    if (reduce) return;                     // hold first frame for reduced motion
    var i = 0;
    setInterval(function () {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 4600);
  })();

  var horizontal = window.matchMedia && window.matchMedia("(min-width: 1001px) and (pointer: fine)").matches && !reduce;

  var hstage = document.getElementById("hstage");
  var hpin = hstage ? hstage.querySelector(".hpin") : null;
  var htrack = document.getElementById("htrack");
  var panels = [].slice.call(document.querySelectorAll(".panel"));
  var progress = document.getElementById("progress");
  var topbar = document.getElementById("topbar");
  var dotsWrap = document.getElementById("dots");
  var pxLayers = [].slice.call(document.querySelectorAll("[data-px]")).map(function (el) {
    return { el: el, panel: el.closest(".panel"), amp: (parseFloat(el.getAttribute("data-px")) || 0.16) * 280 };
  });
  var vw = window.innerWidth, vh = window.innerHeight, distance = 0, hstageTop = 0;

  if (horizontal) root.classList.add("hori");

  /* ---- dots ---- */
  if (dotsWrap) {
    panels.forEach(function (p, i) {
      var b = document.createElement("b");
      b.setAttribute("data-i", i);
      b.title = p.getAttribute("data-screen-label") || ("Panel " + (i + 1));
      b.addEventListener("click", function () { scrollToPanel(i); });
      dotsWrap.appendChild(b);
    });
  }
  var dots = dotsWrap ? [].slice.call(dotsWrap.children) : [];

  /* ---- count-up ---- */
  function fmt(v, dec) { return dec > 0 ? v.toFixed(dec).replace(".", ",") : Math.round(v).toLocaleString("de-DE"); }
  function runCount(el) {
    if (el._done) return; el._done = true;
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suf = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = fmt(target, dec) + suf; return; }
    var dur = 1600, start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(target, dec) + suf;
    }
    requestAnimationFrame(step);
  }

  function showPanel(p) {
    if (!body.classList.contains("go")) return;   // wait for the loader to finish
    if (p.classList.contains("show")) return;
    p.classList.add("show");
    var cs = p.querySelectorAll("[data-count]");
    for (var i = 0; i < cs.length; i++) runCount(cs[i]);
    var cmp = p.querySelector(".cmp"); if (cmp) { cmp.classList.add("armed"); cmp.classList.add("is-rev"); }
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function fitPanels() {
    if (!horizontal) return;
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      if (panel.classList.contains("p-hero") || panel.classList.contains("p-finale")) continue;
      var inner = panel.querySelector(".panel-inner");
      if (!inner) continue;
      inner.style.transform = ""; inner.style.transformOrigin = "center center";
      var h = inner.offsetHeight, avail = (window.innerHeight || vh) - 6;
      if (h > avail) inner.style.transform = "scale(" + (avail / h).toFixed(4) + ")";
    }
  }

  function layout() {
    vw = window.innerWidth; vh = window.innerHeight;
    if (horizontal && hstage && htrack) {
      htrack.style.width = (panels.length * vw) + "px";
      distance = (panels.length - 1) * vw;
      hstage.style.height = (distance + vh) + "px";
      hstageTop = hstage.offsetTop;
      fitPanels();
    } else if (hstage) {
      hstage.style.height = ""; htrack.style.width = "";
      for (var i = 0; i < panels.length; i++) { var inr = panels[i].querySelector(".panel-inner"); if (inr) inr.style.transform = ""; }
    }
  }

  function scrollToPanel(i) {
    if (horizontal) window.scrollTo({ top: hstageTop + i * vw, behavior: "smooth" });
    else if (panels[i]) window.scrollTo({ top: panels[i].getBoundingClientRect().top + (window.pageYOffset || 0) - 0, behavior: "smooth" });
  }

  function setActiveDot(idx) {
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("active", i === idx);
  }

  function update() {
    var y = window.pageYOffset || root.scrollTop || 0;
    var active = 0;

    if (horizontal && htrack) {
      var scrolled = clamp(y - hstageTop, 0, distance);
      htrack.style.transform = "translate3d(" + (-scrolled) + "px,0,0)";
      if (progress) progress.style.transform = "scaleX(" + (distance > 0 ? scrolled / distance : 0) + ")";
      active = Math.round(scrolled / vw);
      for (var i = 0; i < panels.length; i++) {
        var t = (i * vw - scrolled) / vw;          // 0 = centered
        if (Math.abs(t) < 0.62) showPanel(panels[i]);
      }
      for (var p = 0; p < pxLayers.length; p++) {
        var o = pxLayers[p]; if (!o.panel) continue;
        var idx = panels.indexOf(o.panel);
        var tt = (idx * vw - scrolled) / vw;
        o.el.style.transform = "translateX(" + (-tt * o.amp) + "px)";
      }
      if (topbar) topbar.classList.toggle("is-on", scrolled > vw * 0.5);
      if (dotsWrap) dotsWrap.classList.toggle("is-on", scrolled > vw * 0.4);
    } else {
      var max = root.scrollHeight - vh;
      if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      var best = 1e9;
      for (var j = 0; j < panels.length; j++) {
        var r = panels[j].getBoundingClientRect();
        if (r.top < vh * 0.62 && r.bottom > 0) showPanel(panels[j]);
        var dc = Math.abs(r.top + r.height / 2 - vh / 2);
        if (dc < best) { best = dc; active = j; }
        var oy = pxLayers.length;
      }
      for (var q = 0; q < pxLayers.length; q++) {
        var lo = pxLayers[q]; var lr = lo.el.getBoundingClientRect();
        var off = lr.top + lr.height / 2 - vh / 2;
        lo.el.style.transform = "translateY(" + (-off * 0.08) + "px)";
      }
      if (topbar) topbar.classList.toggle("is-on", y > vh * 0.6);
    }
    setActiveDot(active);
  }

  function onScroll() { update(); }

  /* ---- mobile rotate hint ---- */
  (function () {
    var hint = document.getElementById("rotateHint");
    if (!hint) return;
    if (window.matchMedia("(max-width: 760px)").matches) {
      hint.classList.add("show-hint");
      var close = document.getElementById("hintClose");
      if (close) close.addEventListener("click", function () { hint.classList.remove("show-hint"); });
      setTimeout(function () { hint.classList.remove("show-hint"); }, 7000);
    }
  })();

  /* ---- init ---- */
  layout();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { layout(); update(); });

  function start() { layout(); update(); }
  window.addEventListener("introdone", start);
  if (body.classList.contains("go")) start();
  // safety passes
  start();
  setTimeout(start, 200);
  setTimeout(fitPanels, 500);
  setTimeout(fitPanels, 1200);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitPanels(); }).catch(function () {});
  // re-fit whenever a panel's content box changes (font swap, reflow)
  if (horizontal && "ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { fitPanels(); });
    for (var ri = 0; ri < panels.length; ri++) {
      var inr = panels[ri].querySelector(".panel-inner");
      if (inr) ro.observe(inr);
    }
  }
  window.addEventListener("load", function () { layout(); update(); });
})();
