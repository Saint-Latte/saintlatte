/* =====================================================
   SAINT LATTE — main.js
   Shared across all pages
   ===================================================== */

window.addEventListener('DOMContentLoaded', () => {

  /* ── PRELOADER (index only) ───────────────────── */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('done');
      setTimeout(() => { preloader.style.display = 'none'; }, 1000);
    }, 800);
  }

  /* ── LENIS SMOOTH SCROLL ──────────────────────── */
  const lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  /* ── GSAP SETUP ───────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── NAV SCROLL ───────────────────────────────── */
  const nav = document.getElementById('nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── HAMBURGER ────────────────────────────────── */
  const btn        = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (btn && mobileMenu) {
    btn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
      open ? lenis.stop() : lenis.start();
    });
    mobileMenu.querySelectorAll('.mobile-link').forEach(l => {
      l.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        lenis.start();
      });
    });
  }

  /* ── CUSTOM CURSOR ────────────────────────────── */
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  if (cursor && ring && window.matchMedia('(pointer: fine)').matches) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
    });
    (function trackRing() {
      rx += (mx - rx) * .12;
      ry += (my - ry) * .12;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(trackRing);
    })();
    document.querySelectorAll('a, button, .menu-card, .gallery-img-wrap, .week-card, .page-nav-card, .agenda-item, .playlist-album, .share-img-slot, .valor-card').forEach(el => {
      el.addEventListener('mouseenter', () => { cursor.classList.add('is-hover');    ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', () => { cursor.classList.remove('is-hover'); ring.classList.remove('is-hover'); });
    });
  }

  /* ── HERO ANIMATION (index only) ─────────────── */
  const heroLines = document.querySelectorAll('.hero__line span, .hero__line em');
  const heroRight = document.getElementById('heroRight');
  if (heroLines.length && heroRight) {
    const tl = gsap.timeline({ delay: preloader ? .9 : .2 });
    tl.to(heroLines, {
      y: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: .12,
    }).to(heroRight, {
      opacity: 1,
      x: 0,
      duration: .9,
      ease: 'power3.out',
    }, '-=.6');
  }

  /* ── PAGE HERO ANIMATION (subpages) ──────────── */
  const pageHeroTitle = document.querySelector('.page-hero__title, .nos-hero__title');
  if (pageHeroTitle && !heroLines.length) {
    gsap.from(pageHeroTitle, {
      opacity: 0, y: 60, duration: 1.1, ease: 'power3.out', delay: .15,
    });
  }

  /* ── SCROLL REVEALS ───────────────────────────── */

  // Week cards
  gsap.from('.week-card', {
    opacity: 0, y: 50,
    stagger: .1, duration: .8, ease: 'power3.out',
    scrollTrigger: { trigger: '.week-grid', start: 'top 80%' },
  });

  // Vibe mosaic
  gsap.from('.vibe-cell', {
    opacity: 0, scale: .95,
    stagger: .07, duration: .7, ease: 'power2.out',
    scrollTrigger: { trigger: '.vibe-mosaic', start: 'top 80%' },
  });

  // Manifesto
  const manifestoQuote = document.querySelector('.manifesto__quote, .nos-manifesto__pull blockquote');
  if (manifestoQuote) {
    gsap.from(manifestoQuote, {
      opacity: 0, x: -50, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: manifestoQuote, start: 'top 80%' },
    });
  }

  // Page nav cards
  gsap.from('.page-nav-card', {
    opacity: 0, y: 60,
    stagger: .1, duration: .8, ease: 'power3.out',
    scrollTrigger: { trigger: '.page-nav-grid', start: 'top 80%' },
  });

  // Agenda items
  gsap.from('.agenda-item', {
    opacity: 0, x: -40,
    stagger: .12, duration: .75, ease: 'power3.out',
    scrollTrigger: { trigger: '.agenda-list', start: 'top 80%' },
  });

  // Bean section
  gsap.from('.bean-visual', {
    opacity: 0, x: -60, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.bean-section', start: 'top 75%' },
  });
  gsap.from('.bean-info', {
    opacity: 0, x: 60, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.bean-section', start: 'top 75%' },
  });
  gsap.from('.bean-detail', {
    opacity: 0, y: 20, stagger: .08, duration: .6,
    scrollTrigger: { trigger: '.bean-details', start: 'top 80%' },
  });

  // Artist grid
  gsap.from('.artist-card--main', {
    opacity: 0, x: -60, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.artist-grid', start: 'top 80%' },
  });
  gsap.from('.artist-cta-card', {
    opacity: 0, x: 60, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.artist-grid', start: 'top 80%' },
  });

  // Playlist tracks
  gsap.from('.playlist-track', {
    opacity: 0, x: -20, stagger: .08, duration: .5, ease: 'power2.out',
    scrollTrigger: { trigger: '.playlist-tracks', start: 'top 80%' },
  });

  // Share grid
  gsap.from('.share-img-slot', {
    opacity: 0, scale: .9, stagger: .07, duration: .6, ease: 'power2.out',
    scrollTrigger: { trigger: '.share-grid', start: 'top 80%' },
  });

  // Valores cards
  gsap.from('.valor-card', {
    opacity: 0, y: 40, stagger: .1, duration: .8, ease: 'power3.out',
    scrollTrigger: { trigger: '.valores-grid', start: 'top 80%' },
  });

  // Nosotros images
  gsap.from('.specialty-explainer__img-col img', {
    opacity: 0, y: 40, stagger: .1, duration: .8,
    scrollTrigger: { trigger: '.specialty-explainer__grid', start: 'top 80%' },
  });

  // Location rows
  gsap.from('.nos-loc-row', {
    opacity: 0, x: -30, stagger: .1, duration: .6,
    scrollTrigger: { trigger: '.nos-location__info', start: 'top 80%' },
  });

  // Generic section titles
  document.querySelectorAll('.vibe-title, .agenda-title, .bean-title, .artist-title, .playlist-title, .share-title, .nos-location__title').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 60, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
  });

  // Section labels
  document.querySelectorAll('.section-label').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 16, duration: .6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

});
