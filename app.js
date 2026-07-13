/* ============================================================
   WEALTH GENESIS MENTORSHIP — app.js
   Financial Precision Luxury
   ============================================================ */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════
     ANALYTICS & CONVERSION TRACKING

     👉 PEGA TUS IDs REALES AQUÍ ABAJO.
     Mientras tengan las "X", NO se carga nada (cero requests rotos).
     Cuando pongas los IDs reales, GA4 y el Pixel se activan solos y
     cada clic en un CTA de WhatsApp dispara un evento de conversión.
     ════════════════════════════════════════════════════════════════ */
  const ANALYTICS = {
    GA4_ID:        'G-XXXXXXXXXX',    // Google Analytics 4 — Measurement ID
    META_PIXEL_ID: 'XXXXXXXXXXXXXXX'  // Meta (Facebook/Instagram) — Pixel ID
  };

  const isConfigured = (id) =>
    typeof id === 'string' && id.length > 4 && !/X{3,}/i.test(id);

  // Google Analytics 4
  if (isConfigured(ANALYTICS.GA4_ID)) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS.GA4_ID);
  }

  // Meta Pixel
  if (isConfigured(ANALYTICS.META_PIXEL_ID)) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', ANALYTICS.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // Un solo listener delegado para conversiones: CTA de WhatsApp y botón de pago Stripe.
  document.addEventListener('click', (e) => {
    // Pago directo (Stripe) → inicio de checkout.
    const pay = e.target.closest('#payNow');
    if (pay) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'begin_checkout', { event_category: 'conversion' });
      }
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout');
      }
      return;
    }

    // CTA de WhatsApp → contacto.
    const wa = e.target.closest('a[href*="wa.me"]');
    if (!wa) return;
    const label = (wa.textContent || 'whatsapp').trim().slice(0, 60);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_click', {
        event_category: 'conversion',
        event_label: label,
        transport_type: 'beacon'
      });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Contact', { content_name: label });
    }
  });

  // ── Lead Capture (STUB — sin proveedor conectado) ──
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    const emailInput = document.getElementById('leadEmail');
    const leadMsg = document.getElementById('leadMsg');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (emailInput.value || '').trim();

      if (!emailRe.test(email)) {
        leadMsg.textContent = 'Escribe un correo válido.';
        leadMsg.className = 'lead-msg lead-msg--error';
        emailInput.focus();
        return;
      }

      // TODO: conectar a un proveedor de email (Mailchimp / ConvertKit / Beehiiv…)
      //       y entregar el PDF de la guía. Por ahora solo confirma en el front,
      //       NO se envía el email a ningún lado.
      leadMsg.textContent = '¡Listo! En breve recibes la guía en tu correo.';
      leadMsg.className = 'lead-msg lead-msg--ok';
      leadForm.reset();

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'lead_submit', { event_category: 'conversion' });
      }
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
      }
    });
  }

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
      // Se escribe como CSS custom property (no como transform directo) para que
      // el keyframe float-gentle pueda componer ambos efectos vía calc().
      heroImg.style.setProperty('--parallax-y', `${window.scrollY * 0.07}px`);
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
