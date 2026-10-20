/**
 * NE3XA Digital Web Crawler #2
 * Smaller companion crawler with cyan/blue palette.
 * Runs alongside the primary red crawler.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const CONFIG = {
    size: isMobile ? 32 : 40,
    legCount: 6,
    speed: isMobile ? 24 : 30,
    pauseMin: 800,
    pauseMax: 2200,
    trailLength: isMobile ? 8 : 14,
    trailFade: 0.88,
    selectors: [
      '.card p',
      '.services-grid p',
      '.team-card h3',
      '.team-card .role',
      '.faq-item h3',
      'footer h4',
      '.section-header p',
      'blockquote',
      '.lead'
    ],
    maxTargets: isMobile ? 6 : 10,
    minTextLen: 3,
    zIndex: 39
  };

  function createSpiderSVG() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-14 -14 28 28');
    svg.setAttribute('width', CONFIG.size);
    svg.setAttribute('height', CONFIG.size);
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('ne3xa-crawler-2');
    svg.style.cssText = `
      position: absolute;
      left: 0; top: 0;
      pointer-events: none;
      overflow: visible;
      will-change: transform;
      z-index: ${CONFIG.zIndex};
      filter: drop-shadow(0 0 5px rgba(0,200,255,0.75)) drop-shadow(0 0 10px rgba(0,180,255,0.3));
    `;

    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = `
      <filter id="crawler2-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.9" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    const bodyGroup = document.createElementNS(ns, 'g');
    bodyGroup.setAttribute('class', 'crawler2-body');
    bodyGroup.innerHTML = `
      <polygon points="0,-3.6 3.1,-1.8 3.1,1.8 0,3.6 -3.1,1.8 -3.1,-1.8"
               fill="rgba(0,180,255,0.22)" stroke="var(--crawler2-line)" stroke-width="1"
               stroke-linejoin="round" filter="url(#crawler2-glow)"/>
      <circle cx="0" cy="0" r="1.6" fill="var(--crawler2-core)" stroke="var(--crawler2-accent)" stroke-width="0.8"/>
      <circle cx="0" cy="0" r="0.7" fill="var(--crawler2-accent)"/>
    `;
    svg.appendChild(bodyGroup);

    const legsGroup = document.createElementNS(ns, 'g');
    legsGroup.setAttribute('class', 'crawler2-legs');
    svg.appendChild(legsGroup);

    const legs = [];
    for (let i = 0; i < CONFIG.legCount; i++) {
      const baseAngle = (i / CONFIG.legCount) * Math.PI * 2 - Math.PI / 2;
      const leg = {
        baseAngle,
        phase: i * 0.17,
        segments: []
      };
      for (let s = 0; s < 2; s++) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('stroke', 'var(--crawler2-line)');
        line.setAttribute('stroke-width', s === 0 ? '1.3' : '1.0');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('filter', 'url(#crawler2-glow)');
        legsGroup.appendChild(line);
        leg.segments.push(line);
      }
      legs.push(leg);
    }

    return { svg, legs };
  }

  function setLeg(leg, x0, y0, x1, y1, lift) {
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2 - lift * 3.2;
    leg.segments[0].setAttribute('x1', x0);
    leg.segments[0].setAttribute('y1', y0);
    leg.segments[0].setAttribute('x2', midX);
    leg.segments[0].setAttribute('y2', midY);
    leg.segments[1].setAttribute('x1', midX);
    leg.segments[1].setAttribute('y1', midY);
    leg.segments[1].setAttribute('x2', x1);
    leg.segments[1].setAttribute('y2', y1);
  }

  function init() {
    // CSS vars for second crawler (cyan theme)
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --crawler2-line: #00c8ff;
        --crawler2-core: #0a1a24;
        --crawler2-accent: #00e5ff;
      }
      [data-theme="dark"] {
        --crawler2-line: #40d8ff;
        --crawler2-core: #021018;
        --crawler2-accent: #80f0ff;
      }
      .ne3xa-crawler2-trail {
        position: fixed;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: rgba(0, 200, 255, 0.55);
        pointer-events: none;
        z-index: 38;
        transform: translate(-50%, -50%);
      }
    `;
    document.head.appendChild(style);

    const layer = document.createElement('div');
    layer.id = 'ne3xa-crawler2-layer';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:39;overflow:hidden;';
    document.body.appendChild(layer);

    const { svg, legs } = createSpiderSVG();
    layer.appendChild(svg);

    let pos = { x: 100, y: 100 };
    let target = { x: 100, y: 100 };
    let angle = 0;
    let gaitPhase = 0;
    let path = [];
    let pathIndex = 0;
    let pauseUntil = 0;
    let moveIntensity = 0;
    const trail = [];

    function refreshTargets() {
      const candidates = [];
      CONFIG.selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          const text = (el.textContent || '').trim();
          if (text.length < CONFIG.minTextLen) return;
          const r = el.getBoundingClientRect();
          if (r.width < 30 || r.height < 12) return;
          const absX = r.left + window.scrollX + r.width * (0.2 + Math.random() * 0.6);
          const absY = r.top + window.scrollY + r.height * (0.3 + Math.random() * 0.4);
          candidates.push({ x: absX, y: absY, hop: Math.random() < 0.15 });
        });
      });
      // shuffle & limit
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      path = candidates.slice(0, CONFIG.maxTargets);
      if (path.length === 0) {
        path = [
          { x: window.innerWidth * 0.3 + window.scrollX, y: window.innerHeight * 0.4 + window.scrollY },
          { x: window.innerWidth * 0.7 + window.scrollX, y: window.innerHeight * 0.6 + window.scrollY }
        ];
      }
      pathIndex = 0;
      target = path[0];
    }

    let lastTs = performance.now();
    function step(ts) {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (ts < pauseUntil) {
        moveIntensity *= 0.92;
        updateLegs(moveIntensity);
        requestAnimationFrame(step);
        return;
      }

      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        pathIndex = (pathIndex + 1) % path.length;
        target = path[pathIndex];
        if (target.hop || Math.random() < 0.25) {
          pauseUntil = ts + CONFIG.pauseMin + Math.random() * (CONFIG.pauseMax - CONFIG.pauseMin);
          moveIntensity = 0.08;
        }
      } else {
        const speed = target.hop ? CONFIG.speed * 1.35 : CONFIG.speed;
        const stepLen = speed * dt;
        const ratio = Math.min(1, stepLen / dist);
        pos.x += dx * ratio;
        pos.y += dy * ratio;

        const desired = Math.atan2(dy, dx);
        let diff = desired - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        angle += diff * Math.min(1, 8 * dt);

        gaitPhase += dt * (speed / 11);
        moveIntensity = target.hop ? 0.8 : 1;
      }

      const vx = pos.x - window.scrollX;
      const vy = pos.y - window.scrollY;
      const half = CONFIG.size / 2;
      const bob = moveIntensity > 0.3 ? Math.sin(gaitPhase * Math.PI * 3.5) * 0.7 : 0;
      svg.style.transform = `translate(${vx - half}px, ${vy - half + bob}px) rotate(${angle}rad)`;

      updateLegs(moveIntensity);

      if (Math.random() < 0.3) {
        const dot = document.createElement('div');
        dot.className = 'ne3xa-crawler2-trail';
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
      legs.forEach((leg, i) => {
        const phase = (gaitPhase + leg.phase) % 1;
        const swing = Math.sin(phase * Math.PI * 2);
        const lift = intensity * Math.max(0, swing) * (phase < 0.55 ? 1.0 : 0.1);
        const reach = 7.2 + swing * 2.1 * intensity;
        const spread = leg.baseAngle + Math.sin(phase * Math.PI * 2 + i * 0.6) * 0.18 * intensity;
        const tx = Math.cos(spread) * reach;
        const ty = Math.sin(spread) * reach;
        setLeg(leg, 0, 0, tx, ty, lift);
      });
    }

    setTimeout(() => {
      refreshTargets();
      if (path.length) {
        pos = { x: path[0].x, y: path[0].y };
        target = path[Math.min(1, path.length - 1)];
      }
      requestAnimationFrame(step);
    }, 900);

    // Refresh targets on resize / occasional
    window.addEventListener('resize', () => { setTimeout(refreshTargets, 200); });
    setInterval(refreshTargets, 18000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
