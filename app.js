/* ============================================================
   WEALTH GENESIS MENTORSHIP — app.js
   Financial Precision Luxury
   ============================================================ */

(function () {
  'use strict';

  // ── Scroll Progress Bar ──
  const scrollBar = document.createElement('div');
  scrollBar.className = 'scroll-bar';
  document.body.prepend(scrollBar);

  function updateScrollBar() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.width = Math.min((window.scrollY / max) * 100, 100) + '%';
  }

  // ── Site Header: compact on scroll ──
  const siteHeader = document.getElementById('siteHeader');

  function updateHeader() {
    if (window.scrollY > 90) {
      siteHeader.classList.add('compact');
    } else {
      siteHeader.classList.remove('compact');
    }
  }

  // ── Mobile Nav ──
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');

  // Create mobile nav from existing desktop nav
  const navMobile = document.createElement('div');
  navMobile.className = 'nav-mobile';
  navMobile.id = 'navMobile';
  const ulMobile = document.createElement('ul');

  navLinks.querySelectorAll('a').forEach(link => {
    const li = document.createElement('li');
    const a  = link.cloneNode(true);
    li.appendChild(a);
    ulMobile.appendChild(li);
  });

  navMobile.appendChild(ulMobile);
  document.querySelector('.navbar').appendChild(navMobile);

  navToggle.addEventListener('click', () => {
    const isOpen = navMobile.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navMobile.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMobile.classList.remove('open');
      navToggle.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ── Smooth Anchor Scroll ──
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const headerH = siteHeader ? siteHeader.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  // ── Reveal Animation (IntersectionObserver) ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      // Stagger siblings in the same parent
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
      const idx = siblings.indexOf(entry.target);
      const delay = idx >= 0 ? idx * 90 : 0;

      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);

      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -44px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── Hero Image Parallax ──
  const heroImg = document.getElementById('heroImg');
  let heroBottom = 0;

  function updateParallax() {
    if (!heroImg) return;
    if (!heroBottom) {
      const hero = document.getElementById('hero');
      if (hero) heroBottom = hero.offsetTop + hero.offsetHeight;
    }
    if (window.scrollY < heroBottom) {
      heroImg.style.transform = `translateY(${window.scrollY * 0.07}px)`;
    }
  }

  // ── Card Hover 3D Tilt ──
  function addTilt(selector) {
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-5px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.45s ease, border-color 0.3s';
        setTimeout(() => { card.style.transition = ''; }, 450);
      });
    });
  }

  addTilt('.feat-item');
  addTilt('.market-card');

  // ── Passive Scroll Handler ──
  window.addEventListener('scroll', () => {
    updateScrollBar();
    updateHeader();
    updateParallax();
  }, { passive: true });

  // ── Init ──
  updateScrollBar();
  updateHeader();

  // ── Console Branding ──
  console.log(
    '%c⬡ WEALTH GENESIS MENTORSHIP',
    'color:#C9A55A;font-family:monospace;font-size:13px;font-weight:700;'
  );
  console.log(
    '%cDomina los Mercados. Crea Tu Riqueza.',
    'color:#635C50;font-family:monospace;font-size:10px;'
  );

})();
