/* Deal Circle — Site Script · Release 03
   Vanilla JS · keine Dependencies · taste-skill-konform
   - Reveal-on-scroll (IntersectionObserver)
   - Parallax-Hero (rAF)
   - Magnetic CTA (cursor-follow)
   - Number-Counter (auf-Sicht)
   - Cursor-Companion (mix-blend-mode dot)
   - Sticky-Nav-State
*/
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Reveal-on-scroll ----------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-revealed'));
  }

  // ---------- Parallax-Hero ----------
  if (!reduced) {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        parallaxEls.forEach(el => {
          const factor = parseFloat(el.dataset.parallax) || 0.2;
          el.style.transform = `translate3d(0, ${y * factor * -1}px, 0)`;
        });
        ticking = false;
      });
      ticking = true;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Sticky Nav-State ----------
  const nav = document.querySelector('.nav');
  if (nav) {
    const onNav = () => nav.classList.toggle('is-stuck', window.scrollY > 24);
    addEventListener('scroll', onNav, { passive: true });
    onNav();
  }

  // ---------- Magnetic CTA ----------
  if (!reduced && isFinePointer) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      let raf;
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) * 0.18;
        const dy = (e.clientY - cy) * 0.22;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate3d(${dx}px, ${dy - 2}px, 0)`;
        });
      };
      const reset = () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', reset);
    });
  }

  // ---------- Cursor Companion ----------
  if (!reduced && isFinePointer) {
    const dot = document.querySelector('.cursor-dot');
    if (dot) {
      let tx = -100, ty = -100, x = -100, y = -100;
      addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
      const tick = () => {
        x += (tx - x) * 0.18;
        y += (ty - y) * 0.18;
        dot.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
        requestAnimationFrame(tick);
      };
      tick();

      // hover state on CTAs / links
      const ctaLike = 'a, button, .cta, [data-magnetic], .listing__media';
      document.querySelectorAll(ctaLike).forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('is-hovering-cta'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('is-hovering-cta'));
      });
    }
  }

  // ---------- Number-Counter ----------
  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length && 'IntersectionObserver' in window && !reduced) {
    const ease = t => 1 - Math.pow(1 - t, 3);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        if (isNaN(target)) { io.unobserve(el); return; }
        const duration = 1400;
        const start = performance.now();
        const initial = target > 100 ? Math.max(0, target - 60) : 0;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const v = Math.round(initial + (target - initial) * ease(t));
          el.textContent = v.toLocaleString('de-AT');
          if (t < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString('de-AT');
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    countEls.forEach(el => io.observe(el));
  } else {
    countEls.forEach(el => { el.textContent = parseInt(el.dataset.count, 10).toLocaleString('de-AT'); });
  }

  // ---------- Live Clock im Page-Tag ----------
  const clock = document.querySelector('[data-clock]');
  const yearEl = document.querySelector('[data-clock-year]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('de-AT', { month: 'long', year: 'numeric' });
    const update = () => {
      const d = new Date();
      clock.textContent = fmt.format(d);
      if (yearEl) yearEl.textContent = d.getFullYear();
    };
    update();
    setInterval(update, 60_000);
  }

  // ---------- Form-Submit (no-op demo) ----------
  document.querySelectorAll('form.form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"] span');
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = 'Senden …';
      setTimeout(() => {
        btn.textContent = 'Danke — wir melden uns';
        setTimeout(() => { btn.textContent = original; form.reset(); }, 3200);
      }, 800);
    });
  });
})();
