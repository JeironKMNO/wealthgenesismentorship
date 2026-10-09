(() => {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileNav');

  function closeMenu() {
    if (!toggle || !menu) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', event => {
      if (!menu.hidden && !header.contains(event.target)) closeMenu();
    });
  }

  function updateHeader() {
    header?.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const links = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const visible = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
      const current = sections.find(section => visible.get(section.id));
      links.forEach(link => link.classList.toggle('is-active', Boolean(current) && link.getAttribute('href') === '#' + current.id));
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  // Neón de las velas del hero: se pausa cuando el arte sale de pantalla.
  const heroArt = document.getElementById('heroArt');
  if (heroArt) {
    // Las capas de neón (y sus máscaras) entran después de la carga, sin competir con el LCP.
    const lightUp = () => (window.requestIdleCallback || setTimeout)(() => heroArt.classList.add('is-lit'));
    if (document.readyState === 'complete') lightUp();
    else window.addEventListener('load', lightUp, { once: true });
  }
  if (heroArt && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroArt.classList.toggle('is-paused', !entry.isIntersecting);
    }).observe(heroArt);
  }

  const evidenceDialog = document.getElementById('evidenceDialog');
  const evidenceImage = document.getElementById('evidenceImage');
  const evidenceCaption = document.getElementById('evidenceCaption');
  if (evidenceDialog && evidenceImage && evidenceCaption) {
    document.querySelectorAll('[data-evidence]').forEach(button => {
      button.addEventListener('click', () => {
        evidenceCaption.textContent = button.dataset.caption;
        evidenceImage.alt = button.dataset.caption;
        evidenceImage.src = button.dataset.evidence;
        evidenceDialog.showModal();
      });
    });
    evidenceDialog.querySelector('.evidence-close').addEventListener('click', () => evidenceDialog.close());
    evidenceDialog.addEventListener('click', event => {
      if (event.target !== evidenceDialog) return;
      const bounds = evidenceDialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) evidenceDialog.close();
    });
    evidenceDialog.addEventListener('close', () => evidenceImage.removeAttribute('src'));
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="https://buy.stripe.com/"]');
    if (!link) return;
    const source = (link.dataset.loc || 'other').replace(/[^a-z0-9_]/gi, '_');
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'begin_checkout', { event_category: 'conversion', currency: 'USD', value: 75, checkout_source: source, transport_type: 'beacon' });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', { content_name: 'edge33_' + source, currency: 'USD', value: 75 });
    }
  });
})();
