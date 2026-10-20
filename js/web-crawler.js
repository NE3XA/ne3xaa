/**
 * NE3XA Digital Web Crawler
 * Geometric robotic spider that crawls across text & UI surfaces.
 * Black / white / red palette, articulated legs, theme-aware.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const CONFIG = {
    size: isMobile ? 42 : 56,
    legCount: 8,
    speed: isMobile ? 32 : 42,
    pauseMin: 500,
    pauseMax: 1600,
    trailLength: isMobile ? 12 : 22,
    trailFade: 0.9,
    selectors: [
      '.hero-content h1',
      '.hero-content .lead',
      '.hero-eyebrow',
      '.section-header h2',
      '.section-eyebrow',
      '.section-header .lead',
      '.tech-counter strong',
      '.card h3',
      '.services-grid h3',
      'h2',
      'h3'
    ],
    maxTargets: isMobile ? 8 : 14,
    minTextLen: 4,
    zIndex: 40
  };

  // ─── Spider SVG (wireframe, articulated) ───────────────────────────────
  function createSpiderSVG() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-16 -16 32 32');
    svg.setAttribute('width', CONFIG.size);
    svg.setAttribute('height', CONFIG.size);
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('ne3xa-crawler');
    svg.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      pointer-events: none;
      overflow: visible;
      will-change: transform;
      z-index: ${CONFIG.zIndex};
      filter: drop-shadow(0 0 6px rgba(227,6,19,0.85)) drop-shadow(0 0 12px rgba(227,6,19,0.35)) drop-shadow(0 0 2px rgba(255,255,255,0.5));
    `;

    // Soft glow filter
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = `
      <filter id="crawler-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    // Body (angular hexagon + core)
    const bodyGroup = document.createElementNS(ns, 'g');
    bodyGroup.setAttribute('class', 'crawler-body');
    bodyGroup.innerHTML = `
      <polygon points="0,-4.2 3.6,-2.1 3.6,2.1 0,4.2 -3.6,2.1 -3.6,-2.1"
               fill="rgba(227,6,19,0.25)" stroke="var(--crawler-line)" stroke-width="1.1"
               stroke-linejoin="round" filter="url(#crawler-glow)"/>
      <circle cx="0" cy="0" r="1.9" fill="var(--crawler-core)" stroke="var(--crawler-accent)" stroke-width="0.9"/>
      <circle cx="0" cy="0" r="0.85" fill="var(--crawler-accent)"/>
    `;
    svg.appendChild(bodyGroup);

    // Legs: 8 legs, each with femur + tibia
    // Angles roughly spider-like (front to back, left/right pairs)
    const baseAngles = [
      -55, -25, 25, 55,          // right side front→back
      125, 155, -155, -125       // left side front→back
    ];
    const legs = [];

    for (let i = 0; i < CONFIG.legCount; i++) {
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'crawler-leg');
      g.dataset.index = i;

      const femur = document.createElementNS(ns, 'line');
      femur.setAttribute('x1', '0');
      femur.setAttribute('y1', '0');
      femur.setAttribute('x2', '0');
      femur.setAttribute('y2', '0');
      femur.setAttribute('stroke', 'var(--crawler-line)');
      femur.setAttribute('stroke-width', '1.15');
      femur.setAttribute('stroke-linecap', 'round');
      femur.setAttribute('class', 'leg-femur');

      const tibia = document.createElementNS(ns, 'line');
      tibia.setAttribute('x1', '0');
      tibia.setAttribute('y1', '0');
      tibia.setAttribute('x2', '0');
      tibia.setAttribute('y2', '0');
      tibia.setAttribute('stroke', 'var(--crawler-line)');
      tibia.setAttribute('stroke-width', '1.0');
      tibia.setAttribute('stroke-linecap', 'round');
      tibia.setAttribute('class', 'leg-tibia');

      const tip = document.createElementNS(ns, 'circle');
      tip.setAttribute('r', '0.75');
      tip.setAttribute('fill', 'var(--crawler-accent)');
      tip.setAttribute('class', 'leg-tip');

      g.appendChild(femur);
      g.appendChild(tibia);
      g.appendChild(tip);
      svg.appendChild(g);

      legs.push({
        group: g,
        femur,
        tibia,
        tip,
        baseAngle: baseAngles[i] * Math.PI / 180,
        side: i < 4 ? 1 : -1,
        phase: (i % 4) * 0.25 + (i < 4 ? 0 : 0.12)
      });
    }

    return { svg, legs, bodyGroup };
  }

  // ─── CSS variables for theme ───────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ne3xa-crawler-styles')) return;
    const style = document.createElement('style');
    style.id = 'ne3xa-crawler-styles';
    style.textContent = `
      :root {
        /* Light theme: black structure + red accent */
        --crawler-line: #0d0d0d;
        --crawler-core: #1a1a1a;
        --crawler-accent: #E30613;
        --crawler-trail: rgba(227, 6, 19, 0.5);
      }
      [data-theme="dark"] {
        /* Dark theme: white structure + red accent */
        --crawler-line: #f1f3f5;
        --crawler-core: #ffffff;
        --crawler-accent: #FF1A2E;
        --crawler-trail: rgba(255, 26, 46, 0.55);
      }
      .ne3xa-crawler-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: ${CONFIG.zIndex};
      }
      .ne3xa-crawler-trail {
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--crawler-trail);
        box-shadow: 0 0 6px var(--crawler-trail);
        pointer-events: none;
        transform: translate(-50%, -50%);
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Free roaming across page regions (not along text lines) ───────────
  function collectRegions() {
    const selectors = [
      '.hero',
      '.hero-content',
      '.counters-section',
      '.section',
      '.section-header',
      '.services-grid',
      '.card',
      '.tech-counter',
      'main section',
      '.container'
    ];
    const regions = [];
    const seen = new Set();

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (seen.has(el)) return;
        if (el.closest('header, .nav-mobile, .site-footer, button, a.btn, .theme-toggle, .scroll-progress')) return;
        const r = el.getBoundingClientRect();
        if (r.width < 80 || r.height < 40) return;
        if (r.bottom < -100 || r.top > window.innerHeight * 3) return;
        seen.add(el);
        regions.push(el);
      });
    });

    // Prefer larger, more spread-out regions
    return regions
      .sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return (rb.width * rb.height) - (ra.width * ra.height);
      })
      .slice(0, CONFIG.maxTargets);
  }

  // Build a free path that wanders across the page UI (cards, sections, empty space)
  function buildPath(regions) {
    const points = [];
    const pageW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
    const pageH = Math.max(document.documentElement.scrollHeight, window.innerHeight * 2);

    // Collect bounding boxes in document coordinates
    const boxes = regions.map(el => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: r.width,
        h: r.height,
        el
      };
    }).filter(b => b.w > 40 && b.h > 30);

    // Sort roughly top-to-bottom, left-to-right
    boxes.sort((a, b) => a.y - b.y || a.x - b.x);

    if (!boxes.length) {
      // Fallback roam around viewport center
      const cx = window.scrollX + window.innerWidth * 0.5;
      const cy = window.scrollY + window.innerHeight * 0.4;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        points.push({
          x: cx + Math.cos(ang) * 180,
          y: cy + Math.sin(ang) * 100,
          hop: i % 3 === 0
        });
      }
      return points;
    }

    boxes.forEach((box, idx) => {
      // Several waypoints scattered inside each region (not on text baselines)
      const pads = 0.12;
      const spots = [
        [pads, pads],
        [0.5, pads * 1.2],
        [1 - pads, pads],
        [1 - pads, 0.5],
        [0.5, 0.55],
        [pads, 0.5],
        [pads, 1 - pads],
        [0.5, 1 - pads],
        [1 - pads, 1 - pads]
      ];
      // Shuffle order a bit based on index so paths feel organic
      const order = spots.slice().sort((a, b) => {
        const ha = Math.sin((a[0] + idx) * 12.3) + Math.cos(a[1] * 7.1);
        const hb = Math.sin((b[0] + idx) * 12.3) + Math.cos(b[1] * 7.1);
        return ha - hb;
      });

      order.slice(0, 5).forEach(([fx, fy], si) => {
        points.push({
          x: box.x + box.w * fx,
          y: box.y + box.h * fy,
          hop: si === 0 && idx > 0
        });
      });

      // Diagonal hop toward next region
      if (idx < boxes.length - 1) {
        const next = boxes[idx + 1];
        points.push({
          x: next.x + next.w * 0.35,
          y: next.y + next.h * 0.25,
          hop: true
        });
      }
    });

    // Soft loop back near start
    if (points.length > 6) {
      points.push({ x: points[0].x, y: points[0].y, hop: true });
    }
    return points;
  }

  // ─── Leg inverse kinematics (simple 2-segment) ─────────────────────────
  function setLeg(leg, hipX, hipY, targetX, targetY, lift) {
    const dx = targetX - hipX;
    const dy = targetY - hipY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
    const maxLen = 12;
    const len = Math.min(dist, maxLen);
    const femurLen = 5.8;
    const tibiaLen = 6.0;

    // Angle to target
    let angle = Math.atan2(dy, dx);
    // Lift offset (up when stepping)
    const liftY = lift * -3.6;

    // Simple bend: place knee roughly midway with outward bias
    const midX = hipX + Math.cos(angle) * femurLen;
    const midY = hipY + Math.sin(angle) * femurLen + liftY * 0.4;

    // Foot
    const footX = hipX + Math.cos(angle) * len;
    const footY = hipY + Math.sin(angle) * len + liftY;

    leg.femur.setAttribute('x1', hipX.toFixed(2));
    leg.femur.setAttribute('y1', hipY.toFixed(2));
    leg.femur.setAttribute('x2', midX.toFixed(2));
    leg.femur.setAttribute('y2', midY.toFixed(2));

    leg.tibia.setAttribute('x1', midX.toFixed(2));
    leg.tibia.setAttribute('y1', midY.toFixed(2));
    leg.tibia.setAttribute('x2', footX.toFixed(2));
    leg.tibia.setAttribute('y2', footY.toFixed(2));

    leg.tip.setAttribute('cx', footX.toFixed(2));
    leg.tip.setAttribute('cy', footY.toFixed(2));
  }

  // ─── Main controller ───────────────────────────────────────────────────
  function init() {
    injectStyles();

    const layer = document.createElement('div');
    layer.className = 'ne3xa-crawler-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const { svg, legs } = createSpiderSVG();
    layer.appendChild(svg);

    let surfaces = collectRegions();
    let path = buildPath(surfaces);
    if (path.length < 4) {
      // Fallback: roam a few fixed points near hero
      const hero = document.querySelector('.hero-content') || document.body;
      const r = hero.getBoundingClientRect();
      path = [
        { x: r.left + window.scrollX + 40, y: r.top + window.scrollY + 60 },
        { x: r.left + window.scrollX + r.width * 0.6, y: r.top + window.scrollY + 80 },
        { x: r.left + window.scrollX + r.width * 0.3, y: r.top + window.scrollY + 140 },
        { x: r.left + window.scrollX + 80, y: r.top + window.scrollY + 100 }
      ];
    }

    let pathIndex = 0;
    let pos = { x: path[0].x, y: path[0].y };
    let target = path[1] || path[0];
    let angle = 0;
    let pauseUntil = 0;
    let gaitPhase = 0;
    let lastTs = performance.now();
    let visible = true;
    let moveIntensity = 1;
    const trail = [];

    function intensityOfWalk() {
      return moveIntensity;
    }

    function refreshTargets() {
      surfaces = collectRegions();
      path = buildPath(surfaces);
      if (path.length < 2) return;
      // Keep current progress roughly
      pathIndex = Math.min(pathIndex, path.length - 2);
      target = path[pathIndex + 1] || path[0];
    }

    // Resize / layout observers
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refreshTargets, 180);
    }, { passive: true });

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refreshTargets, 200);
      });
      surfaces.forEach(el => ro.observe(el));
    }

    document.addEventListener('visibilitychange', () => {
      visible = document.visibilityState === 'visible';
    });

    // Theme changes – colors update via CSS vars automatically
    const themeObserver = new MutationObserver(() => {
      // force a tiny redraw if needed
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function step(ts) {
      if (!visible) {
        requestAnimationFrame(step);
        return;
      }

      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (ts < pauseUntil) {
        // Idle leg micro-movement
        moveIntensity = 0.12;
        gaitPhase += dt * 1.1;
        updateLegs(0.12);
        const half = CONFIG.size / 2;
        const vx = pos.x - window.scrollX;
        const vy = pos.y - window.scrollY;
        svg.style.transform = `translate(${vx - half}px, ${vy - half}px) rotate(${angle}rad)`;
        requestAnimationFrame(step);
        return;
      }

      // Move toward target
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        // Arrived – next waypoint or pause
        pathIndex = (pathIndex + 1) % path.length;
        target = path[pathIndex];
        if (target.hop || Math.random() < 0.2) {
          pauseUntil = ts + CONFIG.pauseMin + Math.random() * (CONFIG.pauseMax - CONFIG.pauseMin);
          moveIntensity = 0.1;
        }
      } else {
        const speed = target.hop ? CONFIG.speed * 1.4 : CONFIG.speed;
        const stepLen = speed * dt;
        const ratio = Math.min(1, stepLen / dist);
        pos.x += dx * ratio;
        pos.y += dy * ratio;

        // Body rotation toward movement
        const desired = Math.atan2(dy, dx);
        let diff = desired - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        angle += diff * Math.min(1, 9 * dt);

        gaitPhase += dt * (speed / 13);
        moveIntensity = target.hop ? 0.85 : 1;
      }

      // Convert document coords → viewport (layer is position:fixed)
      const vx = pos.x - window.scrollX;
      const vy = pos.y - window.scrollY;
      const half = CONFIG.size / 2;
      const bob = moveIntensity > 0.3
        ? Math.sin(gaitPhase * Math.PI * 4) * 0.9
        : 0;
      svg.style.transform = `translate(${vx - half}px, ${vy - half + bob}px) rotate(${angle}rad)`;

      updateLegs(moveIntensity);

      // Trail
      if (Math.random() < 0.35) {
        const dot = document.createElement('div');
        dot.className = 'ne3xa-crawler-trail';
        dot.style.left = vx + 'px';
        dot.style.top = vy + 'px';
        layer.appendChild(dot);
        trail.push({ el: dot, life: 1 });
        if (trail.length > CONFIG.trailLength) {
          const old = trail.shift();
          old.el.remove();
        }
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].life *= CONFIG.trailFade;
        trail[i].el.style.opacity = trail[i].life;
        if (trail[i].life < 0.04) {
          trail[i].el.remove();
          trail.splice(i, 1);
        }
      }

      requestAnimationFrame(step);
    }

    function updateLegs(intensity) {
      // Alternating tetrapod gait — opposite legs in phase
      legs.forEach((leg, i) => {
        const phase = (gaitPhase + leg.phase) % 1;
        // Smooth lift: peaks mid-swing
        const swing = Math.sin(phase * Math.PI * 2);
        const lift = intensity * Math.max(0, swing) * (phase < 0.55 ? 1.05 : 0.12);

        // Reach varies: plant then lift & extend
        const reach = 8.5 + swing * 2.6 * intensity;
        const spread = leg.baseAngle + Math.sin(phase * Math.PI * 2 + i * 0.7) * 0.22 * intensity;

        const tx = Math.cos(spread) * reach;
        const ty = Math.sin(spread) * reach;

        setLeg(leg, 0, 0, tx, ty, lift);
      });
    }

    // Start slightly delayed so layout is settled
    setTimeout(() => {
      refreshTargets();
      if (path.length) {
        pos = { x: path[0].x, y: path[0].y };
        target = path[Math.min(1, path.length - 1)];
      }
      requestAnimationFrame(step);
    }, 600);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
