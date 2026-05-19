/* =====================================================
   SAINT LATTE — main.js
   ===================================================== */

/* ── Wait for GSAP + Lenis to load ─────────────────── */
window.addEventListener('DOMContentLoaded', () => {

  /* ── LENIS SMOOTH SCROLL ──────────────────────────── */
  const lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  /* ── GSAP SETUP ───────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── HERO ENTRANCE ────────────────────────────────── */
  const heroTl = gsap.timeline({ delay: 0.2 });

  heroTl
    .to('#heroEyebrow', {
      opacity: 1, y: 0,
      duration: .85,
      ease: 'power3.out',
    })
    .to('#heroLogo', {
      opacity: 1,
      scale: 1,
      duration: 1.1,
      ease: 'power3.out',
    }, '-=.5')
    .to('#heroTagline', {
      opacity: 1, y: 0,
      duration: .9,
      ease: 'power3.out',
    }, '-=.65')
    .to('#heroSub', {
      opacity: .55, y: 0,
      duration: .7,
      ease: 'power3.out',
    }, '-=.55')
    .to('#heroCta', {
      opacity: 1, y: 0,
      duration: .65,
      ease: 'power3.out',
    }, '-=.5');

  /* ── SCROLL REVEALS ───────────────────────────────── */
  // Generic reveal for elements with .reveal class
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0,
      duration: .9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 82%',
      },
    });
  });

  // Menu section header
  gsap.from('.menu-header .section-label', {
    opacity: 0, y: 20, duration: .7, ease: 'power3.out',
    scrollTrigger: { trigger: '.menu-header', start: 'top 80%' },
  });
  gsap.from('.menu-title', {
    opacity: 0, y: 60, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.menu-header', start: 'top 78%' },
    delay: .15,
  });

  // Menu cards stagger
  ScrollTrigger.create({
    trigger: '.menu-grid',
    start: 'top 80%',
    onEnter: () => {
      gsap.from('.menu-card:not([style*="display: none"])', {
        opacity: 0, y: 30,
        stagger: .06,
        duration: .6,
        ease: 'power2.out',
      });
    },
  });

  // About section
  gsap.from('.about-text .section-label', {
    opacity: 0, x: -30, duration: .7,
    scrollTrigger: { trigger: '.about-text', start: 'top 80%' },
  });
  gsap.from('.about-title', {
    opacity: 0, y: 60, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-title', start: 'top 82%' },
  });
  gsap.from('.about-body', {
    opacity: 0, y: 30, duration: .8,
    stagger: .15,
    scrollTrigger: { trigger: '.about-body', start: 'top 82%' },
  });
  gsap.from('.about-visual', {
    opacity: 0, x: 60, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.about-visual', start: 'top 78%' },
  });

  // Gallery strip
  gsap.from('.gallery-img-wrap', {
    opacity: 0, scaleY: .85,
    stagger: .08,
    duration: .8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.section-gallery', start: 'top 80%' },
  });

  // Location
  gsap.from('.location-title', {
    opacity: 0, y: 60, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.location-title', start: 'top 82%' },
  });
  gsap.from('.location-detail', {
    opacity: 0, x: -30,
    stagger: .12,
    duration: .65,
    scrollTrigger: { trigger: '.location-info', start: 'top 78%' },
  });
  gsap.from('.location-map-wrap', {
    opacity: 0, y: 50, duration: .9,
    scrollTrigger: { trigger: '.location-map-wrap', start: 'top 80%' },
  });

  /* ── CUSTOM CURSOR ────────────────────────────────── */
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');

  if (!cursor || !ring) return; // mobile: hidden via CSS, skip JS

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  (function trackRing() {
    rx += (mx - rx) * .13;
    ry += (my - ry) * .13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(trackRing);
  })();

  const hoverEls = document.querySelectorAll('a, button, .menu-card, .gallery-img-wrap');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('is-hover');
      ring.classList.add('is-hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-hover');
      ring.classList.remove('is-hover');
    });
  });

  /* ── NAV SCROLL STATE ─────────────────────────────── */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ── HAMBURGER MENU ───────────────────────────────── */
  const btn        = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  btn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    lenis[isOpen ? 'stop' : 'start']();
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lenis.start();
    });
  });

  /* ── MENU TABS ────────────────────────────────────── */
  const tabs  = document.querySelectorAll('.menu-tab');
  const cards = document.querySelectorAll('.menu-card');

  function filterMenu(cat) {
    cards.forEach(card => {
      const show = card.dataset.cat === cat;
      card.style.display = show ? '' : 'none';
    });
    // Re-animate visible cards
    gsap.fromTo(
      [...cards].filter(c => c.style.display !== 'none'),
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: .045, duration: .4, ease: 'power2.out' }
    );
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('menu-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('menu-tab--active');
      tab.setAttribute('aria-selected', 'true');
      filterMenu(tab.dataset.cat);
    });
  });

  // Init: show first category
  filterMenu('caliente');

  /* ── HERO LOGO FALLBACK SHOW ──────────────────────── */
  const logoFallback = document.getElementById('logoFallback');
  if (logoFallback && logoFallback.style.display === 'block') {
    logoFallback.style.display = 'flex';
  }

});
