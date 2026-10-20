/**
 * NE3XA — Shared JavaScript
 * Navigation, cart, scroll effects, forms, etc.
 */

(function () {
  'use strict';

  // ---------- Cart (localStorage) ----------
  const CART_KEY = 'ne3xa_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    document.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  }

  function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count > 0 ? count : '';
      el.setAttribute('data-count', count);
    });
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += product.qty || 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || '',
        qty: product.qty || 1
      });
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) {
    let cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
    return cart;
  }

  function updateQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) {
      item.qty = Math.max(1, qty);
      if (item.qty < 1) return removeFromCart(id);
      saveCart(cart);
    }
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function getCartTotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  // Expose cart API
  window.NE3XA = window.NE3XA || {};
  window.NE3XA.cart = {
    get: getCart,
    add: addToCart,
    remove: removeFromCart,
    updateQty,
    clear: clearCart,
    total: getCartTotal,
    updateCount: updateCartCount
  };

  // ---------- Mobile nav ----------
  function initNav() {
    const toggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.nav-mobile');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    // Mobile dropdowns
    mobileNav.querySelectorAll('.nav-item > .nav-link').forEach(link => {
      if (link.nextElementSibling && link.nextElementSibling.classList.contains('dropdown')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          link.parentElement.classList.toggle('open');
        });
      }
    });

    // Close on outside click / resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        toggle.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // ----- Scrolling progress & back to top ------
  function initScrollUI() {
    const progress = document.querySelector('.scroll-progress');
    const backTop = document.querySelector('.back-to-top');

    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) {
        progress.style.width = height > 0 ? (scrolled / height * 100) + '%' : '0%';
      }
      if (backTop) {
        backTop.classList.toggle('visible', scrolled > 400);
      }
    }, { passive: true });

    if (backTop) {
      backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ---------- Reveal on scroll ----------
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => observer.observe(el));
  }

  // ---------- Accordion ----------
  function initAccordions() {
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        const wasOpen = item.classList.contains('open');
        // Close siblings if desired
        const parent = item.parentElement;
        parent.querySelectorAll('.accordion-item.open').forEach(i => {
          if (i !== item) i.classList.remove('open');
        });
        item.classList.toggle('open', !wasOpen);
      });
    });
  }

  // ---------- Form validation helper ----------
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const group = field.closest('.form-group');
      const value = field.value.trim();
      let fieldValid = true;
      if (!value) fieldValid = false;
      if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fieldValid = false;
      if (field.type === 'tel' && value && value.replace(/\D/g, '').length < 9) fieldValid = false;
      if (group) {
        group.classList.toggle('has-error', !fieldValid);
      }
      if (!fieldValid) valid = false;
    });
    return valid;
  }

  window.NE3XA.validateForm = validateForm;

  // ---------- Active nav link ----------
  function setActiveNav() {
    let path = window.location.pathname.split('/').pop() || 'index.html';
    if (!path || path === '') path = 'index.html';
    // Clear every active state first (removes hardcoded Home active on other pages)
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = (link.getAttribute('href') || '').split('/').pop();
      if (!href) return;
      // Exact page match only — never highlight two items
      if (href === path) {
        link.classList.add('active');
      }
    });
  }

  // ---------- Theme (light / dark) ----------
  function initTheme() {
    const stored = localStorage.getItem('ne3xa_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ne3xa_theme', next);
      });
    });
  }

  // ---------- Parallax on hero ----------
  function initParallax() {
    const layers = document.querySelectorAll('[data-parallax]');
    if (!layers.length) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        layers.forEach(el => {
          const speed = parseFloat(el.dataset.parallax) || 0.3;
          el.style.transform = 'translate3d(0, ' + (y * speed) + 'px, 0)';
        });
        ticking = false;
      });
    }, { passive: true });
  }

  // ---------- Nexa Dev shortcut: Ctrl+Alt+D ----------
  function initDevShortcut() {
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        // Resolve path relative to current page location
        var path = window.location.pathname.replace(/\\/g, '/');
        var inDev = path.indexOf('/developers/') !== -1;
        if (inDev) return;
        // From root pages: developers/index.html
        // From nested: still one level up structure is flat for public site
        var target = 'developers/index.html';
        // If already in a subfolder (unlikely), adjust
        window.location.href = target;
      }
    });
  }


  // ---------- Page loader (half-second premium tech) ----------
  function initPageLoader() {
    // Inject loader if not present
    if (!document.querySelector('.page-loader')) {
      var loader = document.createElement('div');
      loader.className = 'page-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.innerHTML = '<div class="page-loader-inner"><div class="loader-ring"></div><div class="loader-mark">NE3XA</div></div>';
      document.body.prepend(loader);
    }
    var el = document.querySelector('.page-loader');
    // Hide after ~500ms or when fully ready
    function hide() {
      if (el) el.classList.add('hidden');
    }
    if (document.readyState === 'complete') {
      setTimeout(hide, 450);
    } else {
      window.addEventListener('load', function () { setTimeout(hide, 450); });
      // Fallback
      setTimeout(hide, 800);
    }
    // Intercept internal navigations for loader feel
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank') return;
      if (a.hasAttribute('download')) return;
      // same-origin page
      if (el) {
        el.classList.remove('hidden');
      }
    });
  }

  // ---- Animated counters (up / down style) -----
  function initCounters() {
    var counters = document.querySelectorAll('.tech-counter strong[data-count]');
    if (!counters.length) return;
    var observed = new Set();
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (observed.has(el)) return;
        observed.add(el);
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var direction = el.getAttribute('data-dir') || 'up'; // up or down
        var duration = 1600;
        var start = performance.now();
        var from = direction === 'down' ? Math.max(target * 1.4, target + 20) : 0;
        function tick(now) {
          var t = Math.min(1, (now - start) / duration);
          // ease-out cubic
          var eased = 1 - Math.pow(1 - t, 3);
          var val;
          if (direction === 'down') {
            val = Math.round(from + (target - from) * eased);
          } else {
            val = Math.round(from + (target - from) * eased);
          }
          el.textContent = val + suffix;
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = target + suffix;
            el.classList.add('count-up');
          }
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.35 });
    counters.forEach(function (el) { obs.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPageLoader();
    initTheme();
    initDevShortcut();
    initNav();
    initScrollUI();
    initReveal();
    initAccordions();
    initParallax();
    initCounters();
    updateCartCount();
    setActiveNav();
  });
})();

/* ========== Binary rain (What we do) ========== */
(function initBinaryRain() {
  const wrap = document.getElementById('binary-rain');
  if (!wrap) return;
  const COUNT = 120;
  for (let i = 0; i < COUNT; i++) {
    const span = document.createElement('span');
    span.textContent = Math.random() > 0.5 ? '1' : '0';
    span.style.left = (Math.random() * 100) + '%';
    span.style.fontSize = (0.65 + Math.random() * 0.9) + 'rem';
    /* faster rise: 2.5s – 6s */
    span.style.animationDuration = (2.5 + Math.random() * 3.5) + 's';
    span.style.animationDelay = (Math.random() * 4) + 's';
    wrap.appendChild(span);
  }
  setInterval(function () {
    const spans = wrap.querySelectorAll('span');
    if (!spans.length) return;
    const n = 8 + Math.floor(Math.random() * 12);
    for (let i = 0; i < n; i++) {
      const s = spans[Math.floor(Math.random() * spans.length)];
      s.textContent = Math.random() > 0.5 ? '1' : '0';
    }
  }, 400);
})();

/* ========== Team slider — horizontal scroll + auto-advance ========== */
(function initTeamSlider() {
  const slider = document.getElementById('team-slider');
  if (!slider) return;

  // Ensure continuous CSS marquee: wrap cards in .team-track and duplicate for seamless loop
  let track = slider.querySelector('.team-track');
  if (!track) {
    track = document.createElement('div');
    track.className = 'team-track';
    while (slider.firstChild) track.appendChild(slider.firstChild);
    slider.appendChild(track);
  }
  // Duplicate children once for seamless -50% translate
  if (!track.dataset.cloned) {
    const clone = track.cloneNode(true);
    Array.from(clone.children).forEach(function (c) {
      track.appendChild(c);
    });
    track.dataset.cloned = '1';
  }

  const prev = document.getElementById('team-prev');
  const next = document.getElementById('team-next');
  // Manual nudge: temporarily pause animation and shift
  function nudge(dir) {
    track.style.animationPlayState = 'paused';
    const current = getComputedStyle(track).transform;
    // fallback: scroll container
    slider.scrollBy({ left: dir * 220, behavior: 'smooth' });
    setTimeout(function () {
      track.style.animationPlayState = '';
    }, 800);
  }
  if (prev) prev.addEventListener('click', function () { nudge(-1); });
  if (next) next.addEventListener('click', function () { nudge(1); });
})();

/* ========== Disable right-click — show custom message ========== */
(function () {
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    alert('oswade boooo');
  });
})();
