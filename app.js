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

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="wa.me"]');
    if (!link) return;
    const source = (link.dataset.loc || 'other').replace(/[^a-z0-9_]/gi, '_');
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_' + source, { event_category: 'conversion', transport_type: 'beacon' });
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Contact', { content_name: 'whatsapp_' + source });
    }
  });
})();
