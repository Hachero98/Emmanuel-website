/* ═══════════════════════════════════════════════════════════════════════════
   Emmanuel Hackman — Portfolio  |  script.js  (Round 4 — Academic Upgrade)
   ─────────────────────────────────────────────────────────────────────────
   Changes from Round 3:
   · initBibTeXCopy()  — clipboard copy for BibTeX panels
   · initPubToggles()  — smooth maxHeight expand/collapse for abstract+BibTeX
   · initPublicationTabs() — data-filter tab switching for pub entries
   · getParticleCount() — responsive 80/140/260 based on viewport width
   · resizeCanvas()    — DPR-aware (retina / high-DPI support)
   · rafLoop()         — isDark() cached once per frame, passed to draw fns
   · drawFieldArrows() — accepts dark param (no per-call isDark check)
   · updateRipples()   — accepts dark param
   · buildArrowGrid()  — cached {px,py} positions, only rebuilt on resize
   · highlightActiveSection — includes 'teaching' section
   · Cursor interactables expanded to include pub-tabs, bibtex buttons
   ─────────────────────────────────────────────────────────────────────────
   Sections:
   0.  Utilities
   1.  Theme
   2.  Scroll Progress
   3.  Navbar
   4.  Hamburger Menu
   5.  Custom Cursor
   6.  Scroll Reveals
   7.  Vector Field
   8.  Streamline Particles
   9.  Field Arrow Grid
   10. Ripple Wave System
   11. Field Probe HUD
   12. Hero Mouse Parallax
   13. Equation Scan-Line
   14. Canvas Main Loop
   15. 3D Card Tilt
   16. SVG Path Self-Draw
   17. Orb Scroll Parallax
   18. KaTeX Guard
   19. Publication Tabs
   20. Publication Toggles (abstract / BibTeX panels)
   21. BibTeX Copy
   22. Init
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── 0. Utilities ──────────────────────────────────────────────────────── */

const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = (lo, hi) => lo + Math.random() * (hi - lo);

/* ─── 1. Theme ──────────────────────────────────────────────────────────── */

const THEME_KEY = 'eh-theme';

function getStoredTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}
function setStoredTheme(t) {
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setStoredTheme(theme);
  window._themeChanged = true;
}

function initTheme() {
  // Always start in light mode — the portfolio is designed as a light experience.
  applyTheme('light');

  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      // Only follow system if user hasn't made an explicit choice
      if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
    });
}

/* ─── 2. Scroll Progress ────────────────────────────────────────────────── */

function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  // CSS uses scaleX transform approach — ensure transform-origin matches
  bar.style.transformOrigin = 'left center';

  const update = () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? scrolled / total : 0})`;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ─── 3. Navbar ─────────────────────────────────────────────────────────── */

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const links  = document.querySelectorAll('.nav-links a[data-section]');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    highlightActiveSection();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navbar.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('navLinks')?.classList.remove('open');
        document.getElementById('hamburger')?.setAttribute('aria-expanded', 'false');
      }
    });
  });

  function highlightActiveSection() {
    // Include all navigable sections in order
    const sections = ['hero', 'about', 'research', 'publications', 'teaching', 'contact'];
    let active = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 120) active = id;
    });
    links.forEach(a => {
      a.classList.toggle('active', a.dataset.section === active);
    });
  }
}

/* ─── 4. Hamburger Menu ─────────────────────────────────────────────────── */

function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ─── 5. Custom Cursor ──────────────────────────────────────────────────── */

function initCursor() {
  const ring = document.getElementById('cursor-ring');
  const dot  = document.getElementById('cursor-dot');
  if (!ring || !dot) return;

  let mx = -200, my = -200;
  let rx = -200, ry = -200;
  let cursorReady = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
    if (!cursorReady) {
      document.body.classList.add('cursor-ready');
      cursorReady = true;
    }
  });

  // Spring-follow animation for the ring
  (function animateRing() {
    rx = lerp(rx, mx, 0.10);
    ry = lerp(ry, my, 0.10);
    ring.style.transform = `translate(${rx - 20}px, ${ry - 20}px)`;
    requestAnimationFrame(animateRing);
  })();

  // Extended interactables for Round 4 — pub tabs, bibtex, toggles
  const interactables = [
    'a', 'button',
    '.research-card', '.contact-card', '.icon-link', '.tag',
    '.pub-tab', '.pub-toggle-btn', '.bibtex-copy-btn', '.course-card',
  ].join(', ');

  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactables)) ring.classList.add('large');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactables)) ring.classList.remove('large');
  });

  document.documentElement.classList.add('custom-cursor');
}

/* ─── 6. Scroll Reveals ─────────────────────────────────────────────────── */

function initScrollReveals() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el    = entry.target;
        const delay = parseInt(el.dataset.delay || 0, 10);
        setTimeout(() => {
          el.classList.add('revealed');
          if (el.id === 'heroEq') triggerEqScan();
        }, delay);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ─── 7. Vector Field (Hamiltonian / divergence-free) ───────────────────── */
/*
   Stream function:
     ψ(x,y,t) = Σ A_k sin(k_x·x + φ_x + ω_x·t)
                   + B_k sin(k_y·y + φ_y + ω_y·t)
   Velocity:
     v = ∇⊥ψ = (∂ψ/∂y, −∂ψ/∂x)  — divergence-free by construction.
*/

const FIELD_MODES = 5;
const fieldModes  = [];

function initFieldModes() {
  fieldModes.length = 0;
  for (let i = 0; i < FIELD_MODES; i++) {
    fieldModes.push({
      kx  : rand(0.3, 1.8),
      ky  : rand(0.3, 1.8),
      phiX: rand(0, Math.PI * 2),
      phiY: rand(0, Math.PI * 2),
      A   : rand(0.6, 1.2),
      B   : rand(0.6, 1.2),
      wX  : rand(-0.12, 0.12),
      wY  : rand(-0.12, 0.12),
    });
  }
}

function fieldAt(nx, ny, t) {
  const TWO_PI = Math.PI * 2;
  let vx = 0, vy = 0;

  for (const m of fieldModes) {
    const x = nx * TWO_PI;
    const y = ny * TWO_PI;
    const dpsiDx = m.kx * m.A * Math.cos(m.kx * x + m.phiX + m.wX * t);
    const dpsiDy = m.ky * m.B * Math.cos(m.ky * y + m.phiY + m.wY * t);
    vx += dpsiDy;
    vy -= dpsiDx;
  }

  const scale = 0.55 / FIELD_MODES;
  return { vx: vx * scale, vy: vy * scale };
}

/* ─── 8. Streamline Particle System ──────────────────────────────────────── */

/* Responsive particle count — reduce on small screens for performance */
function getParticleCount() {
  const w = window.innerWidth;
  if (w < 480) return 80;
  if (w < 900) return 140;
  return 260;
}

const particles = [];
let   pCanvas, pCtx;
let   canvasW = 0, canvasH = 0;

function makeParticle() {
  return {
    x     : Math.random(),
    y     : Math.random(),
    px    : null,
    py    : null,
    age   : rand(0, 120),
    maxAge: rand(180, 420),
    speed : rand(0.7, 1.3),
  };
}

function resetParticle(p) {
  p.x      = Math.random();
  p.y      = Math.random();
  p.px     = null;
  p.py     = null;
  p.age    = 0;
  p.maxAge = rand(180, 420);
  p.speed  = rand(0.7, 1.3);
}

function initParticles() {
  const count = getParticleCount();
  particles.length = 0;
  for (let i = 0; i < count; i++) {
    particles.push(makeParticle());
  }
}

function isDark() {
  return document.documentElement.getAttribute('data-theme') !== 'light';
}

/* dark param passed from rafLoop — no per-call isDark() call */
function updateAndDrawParticles(t, dt, dark) {
  const speed = 0.00028 * dt;

  // Light mode: deep navy particles, visible on white
  pCtx.lineWidth   = 1.2;
  pCtx.strokeStyle = dark
    ? 'rgba(96, 165, 250, 0.55)'
    : 'rgba(30, 64, 175, 0.55)';

  pCtx.beginPath();

  for (const p of particles) {
    p.age++;

    if (p.age > p.maxAge) {
      resetParticle(p);
      continue;
    }

    const { vx, vy } = fieldAt(p.x, p.y, t);

    // Ripple impulse — particles near the wavefront get a radial kick
    let rx = 0, ry = 0;
    for (const rp of ripples) {
      if (rp.alpha <= 0) continue;
      const dx    = p.x - rp.x / canvasW;
      const dy    = p.y - rp.y / canvasH;
      const dist  = Math.sqrt(dx * dx + dy * dy);
      const waveR = rp.r / canvasW;
      const band  = 0.04;
      const diff  = Math.abs(dist - waveR);
      if (diff < band && dist > 0.001) {
        const strength = (1 - diff / band) * rp.alpha * 0.012;
        rx += (dx / dist) * strength;
        ry += (dy / dist) * strength;
      }
    }

    const nx = p.x + (vx + rx) * p.speed * speed;
    const ny = p.y + (vy + ry) * p.speed * speed;

    p.px = p.x;
    p.py = p.y;
    p.x  = (nx + 1) % 1;
    p.y  = (ny + 1) % 1;

    // Skip if particle wrapped (would draw a line across the whole canvas)
    const pixDx = (p.x - p.px) * canvasW;
    const pixDy = (p.y - p.py) * canvasH;
    if (Math.abs(pixDx) > 30 || Math.abs(pixDy) > 30) continue;

    const sx = p.px * canvasW;
    const sy = p.py * canvasH;
    const ex = p.x  * canvasW;
    const ey = p.y  * canvasH;

    // Fade in at birth, fade out near death
    const lr    = p.age / p.maxAge;
    const alpha = lr < 0.08
      ? lr / 0.08
      : lr > 0.85
        ? 1 - (lr - 0.85) / 0.15
        : 1;

    pCtx.globalAlpha = alpha;
    pCtx.moveTo(sx, sy);
    pCtx.lineTo(ex, ey);
  }

  pCtx.globalAlpha = 1;
  pCtx.stroke();
}

/* ─── 9. Field Arrow Grid ───────────────────────────────────────────────── */
/*
   Arrow grid positions are cached in buildArrowGrid() and only recomputed
   on canvas resize — saves significant per-frame computation.
*/

let arrowFrameCount = 0;
let arrowGrid  = [];   // [{px, py}, ...]
let arrowGridW = 0;
let arrowGridH = 0;

function buildArrowGrid() {
  const spacing = 62;
  arrowGrid  = [];
  arrowGridW = canvasW;
  arrowGridH = canvasH;

  const cols = Math.ceil(canvasW / spacing) + 1;
  const rows = Math.ceil(canvasH / spacing) + 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      arrowGrid.push({
        px: (c + 0.5) * spacing,
        py: (r + 0.5) * spacing,
      });
    }
  }
}

/* dark param passed from rafLoop */
function drawFieldArrows(t, dark) {
  arrowFrameCount++;
  if (arrowFrameCount % 4 !== 0) return; // update every 4 frames (~15 fps)

  // Rebuild position cache if canvas was resized
  if (arrowGridW !== canvasW || arrowGridH !== canvasH) buildArrowGrid();

  const arrowLen = 14;

  pCtx.save();
  pCtx.strokeStyle = dark
    ? 'rgba(147, 197, 253, 0.055)'
    : 'rgba(37, 99, 235, 0.18)';
  pCtx.lineWidth = 0.9;

  for (const { px, py } of arrowGrid) {
    const { vx, vy } = fieldAt(px / canvasW, py / canvasH, t);
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag < 0.001) continue;

    const ux  = vx / mag;
    const uy  = vy / mag;
    const len = arrowLen * clamp(mag * 3, 0.3, 1.0);

    const ex = px + ux * len * 0.5;
    const ey = py + uy * len * 0.5;
    const bx = px - ux * len * 0.5;
    const by = py - uy * len * 0.5;

    const angle = Math.atan2(uy, ux);
    const a1    = angle + Math.PI * 0.75;
    const a2    = angle - Math.PI * 0.75;
    const hLen  = 5;

    pCtx.beginPath();
    pCtx.moveTo(bx, by);
    pCtx.lineTo(ex, ey);
    pCtx.moveTo(ex + Math.cos(a1) * hLen, ey + Math.sin(a1) * hLen);
    pCtx.lineTo(ex, ey);
    pCtx.lineTo(ex + Math.cos(a2) * hLen, ey + Math.sin(a2) * hLen);
    pCtx.stroke();
  }

  pCtx.restore();
}

/* ─── 10. Ripple Wave System ────────────────────────────────────────────── */

const ripples     = [];
const MAX_RIPPLES = 6;

function addRipple(cx, cy) {
  if (ripples.length >= MAX_RIPPLES) ripples.splice(0, 1);
  ripples.push({
    x     : cx,
    y     : cy,
    r     : 0,
    maxR  : Math.max(canvasW, canvasH) * 0.65,
    alpha : 1,
    burst : 1.0,   // origin flash — fades quickly on first frames
  });
}

/* dark param passed from rafLoop */
function updateRipples(dark) {
  const ringColor = dark ? '96,165,250' : '29,95,220';

  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];

    // Origin burst: expands rapidly and fades out in ~12 frames
    if (rp.burst > 0) {
      const burstR = (1 - rp.burst) * 32;  // grows from 0 → 32px as burst→0
      pCtx.save();
      pCtx.beginPath();
      pCtx.arc(rp.x, rp.y, burstR, 0, Math.PI * 2);
      pCtx.strokeStyle = `rgba(${ringColor}, ${rp.burst * 0.85})`;
      pCtx.lineWidth   = 2.5 * rp.burst;
      pCtx.stroke();
      pCtx.restore();
      rp.burst -= 0.09;
    }

    // Main wave expansion
    rp.r    += (canvasW / 95);
    rp.alpha = 1 - (rp.r / rp.maxR);

    if (rp.alpha <= 0) {
      ripples.splice(i, 1);
      continue;
    }

    // 3 concentric rings at different radii
    for (let k = 0; k < 3; k++) {
      const kr = rp.r - k * 14;
      if (kr < 0) continue;
      const ka = rp.alpha * (1 - k * 0.28);
      pCtx.save();
      pCtx.beginPath();
      pCtx.arc(rp.x, rp.y, kr, 0, Math.PI * 2);
      pCtx.strokeStyle = `rgba(${ringColor}, ${ka * 0.65})`;
      pCtx.lineWidth   = 1.6 - k * 0.4;
      pCtx.stroke();
      pCtx.restore();
    }
  }
}

/* ─── 11. Field Probe HUD ───────────────────────────────────────────────── */

let probeActive = false;

// Target values (set on mousemove)
const probeTarget = { vx: 0, vy: 0, mag: 0 };

// Smoothed display values (lerp'd in RAF)
const probeDisplay = { vx: 0, vy: 0, mag: 0 };

const PROBE_LERP      = 0.12;   // spring factor — responsive but smooth
const FLASH_THRESHOLD = 0.18;   // magnitude delta that triggers flash animation

// Cached DOM elements — resolved once on first update
let _probeEls = null;
function getProbeEls() {
  if (!_probeEls) {
    _probeEls = {
      vx : document.getElementById('probeVx'),
      vy : document.getElementById('probeVy'),
      mag: document.getElementById('probeMag'),
      xy : document.getElementById('probeXY'),
    };
  }
  return _probeEls;
}

// Called every RAF frame — keeps display values smoothly animated
function updateProbeDisplay() {
  if (!probeActive) return;

  const prevMag = probeDisplay.mag;

  probeDisplay.vx  = lerp(probeDisplay.vx,  probeTarget.vx,  PROBE_LERP);
  probeDisplay.vy  = lerp(probeDisplay.vy,  probeTarget.vy,  PROBE_LERP);
  probeDisplay.mag = lerp(probeDisplay.mag, probeTarget.mag, PROBE_LERP);

  const el = getProbeEls();
  if (el.vx)  el.vx.textContent  = probeDisplay.vx.toFixed(4);
  if (el.vy)  el.vy.textContent  = probeDisplay.vy.toFixed(4);
  if (el.mag) el.mag.textContent = probeDisplay.mag.toFixed(4);

  // Flash animation when magnitude changes significantly
  if (Math.abs(probeDisplay.mag - prevMag) > FLASH_THRESHOLD && el.mag) {
    el.mag.classList.remove('flash');
    void el.mag.offsetWidth;      // force reflow to restart animation
    el.mag.classList.add('flash');
  }
}

function initFieldProbe() {
  const heroSection = document.getElementById('hero');
  const probe       = document.getElementById('fieldProbe');
  if (!heroSection || !probe) return;

  heroSection.addEventListener('mouseenter', () => {
    probe.classList.add('active');
    probeActive = true;
  });

  heroSection.addEventListener('mouseleave', () => {
    probe.classList.remove('active');
    probeActive = false;
  });

  // Set probe targets on mousemove (display update happens in RAF)
  heroSection.addEventListener('mousemove', e => {
    if (!canvasW || !canvasH) return;

    const rect = pCanvas
      ? pCanvas.getBoundingClientRect()
      : heroSection.getBoundingClientRect();

    const nx = clamp((e.clientX - rect.left)  / rect.width,  0, 1);
    const ny = clamp((e.clientY - rect.top)   / rect.height, 0, 1);

    const t    = performance.now() / 1000;
    const { vx, vy } = fieldAt(nx, ny, t);
    const mag  = Math.sqrt(vx * vx + vy * vy);

    probeTarget.vx  = vx;
    probeTarget.vy  = vy;
    probeTarget.mag = mag;

    // Cursor position updates immediately (no need to smooth this)
    const el = getProbeEls();
    if (el.xy) {
      el.xy.textContent = `(${nx.toFixed(2)}, ${ny.toFixed(2)})`;
    }
  });

  // Click to spawn ripple wave
  heroSection.addEventListener('click', e => {
    if (!pCanvas) return;
    const rect = pCanvas.getBoundingClientRect();
    addRipple(e.clientX - rect.left, e.clientY - rect.top);
  });
}

/* ─── 12. Hero Mouse Parallax ───────────────────────────────────────────── */

let hMouseX = 0,  hMouseY = 0;
let hSmoothX = 0, hSmoothY = 0;
const PARALLAX_SPRING = 0.06;

// Cached element refs — resolved once on first applyHeroParallax call
let _heroParallaxEls = null;
function getParallaxEls() {
  if (!_heroParallaxEls) {
    _heroParallaxEls = {
      content: document.getElementById('heroContent'),
      name   : document.getElementById('heroName'),
      eq     : document.getElementById('heroEq'),
    };
  }
  return _heroParallaxEls;
}

function initHeroParallax() {
  const heroSection = document.getElementById('hero');
  if (!heroSection) return;

  heroSection.addEventListener('mousemove', e => {
    hMouseX = (e.clientX / window.innerWidth)  - 0.5;
    hMouseY = (e.clientY / window.innerHeight) - 0.5;
  });

  heroSection.addEventListener('mouseleave', () => {
    hMouseX = 0;
    hMouseY = 0;
  });
}

function applyHeroParallax() {
  hSmoothX = lerp(hSmoothX, hMouseX, PARALLAX_SPRING);
  hSmoothY = lerp(hSmoothY, hMouseY, PARALLAX_SPRING);

  // Skip DOM writes if barely moving (saves paint work)
  if (Math.abs(hSmoothX) < 0.0005 && Math.abs(hSmoothY) < 0.0005) return;

  const el = getParallaxEls();
  const sx = hSmoothX;
  const sy = hSmoothY;

  if (el.content) el.content.style.transform = `translate(${sx * 8}px, ${sy * 8}px)`;
  if (el.name)    el.name.style.transform    = `translate(${sx * -16}px, ${sy * -10}px)`;
  if (el.eq)      el.eq.style.transform      = `translate(${sx * 12}px, ${sy * 6}px)`;
}

/* ─── 13. Equation Scan-Line ────────────────────────────────────────────── */

let eqScanTriggered = false;

function triggerEqScan() {
  if (eqScanTriggered) return;
  const heroEq = document.querySelector('.hero-eq');
  if (!heroEq) return;
  eqScanTriggered = true;
  setTimeout(() => heroEq.classList.add('scan-active'), 200);
}

/* ─── 14. Canvas Main Loop ──────────────────────────────────────────────── */

let lastTime   = 0;
let frameCount = 0;

function initCanvas() {
  pCanvas = document.getElementById('fieldCanvas');
  if (!pCanvas) return;
  pCtx = pCanvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(rafLoop);
}

/*
   DPR-aware resize — scales canvas backing store to device pixel ratio
   (up to 2×) so it stays sharp on retina/HiDPI screens.
*/
function resizeCanvas() {
  if (!pCanvas) return;
  const dpr    = Math.min(window.devicePixelRatio || 1, 2);
  canvasW = pCanvas.offsetWidth  || window.innerWidth;
  canvasH = pCanvas.offsetHeight || window.innerHeight;

  pCanvas.width  = canvasW * dpr;
  pCanvas.height = canvasH * dpr;

  // Reset transform then scale up so all drawing coordinates stay in CSS pixels
  pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Force arrow grid rebuild on next draw call
  arrowGridW = 0;
  arrowGridH = 0;

  initParticles();
  window._themeChanged = true;
}

function clearCanvas(dark) {
  // Very-low-alpha fill creates the "long exposure" trail effect.
  // Light mode: soft white trail fill — leaves visible streaks.
  pCtx.fillStyle = dark
    ? 'rgba(10, 13, 24, 0.10)'
    : 'rgba(245, 247, 255, 0.25)';
  pCtx.fillRect(0, 0, canvasW, canvasH);
}

function rafLoop(now) {
  // Clamp dt to 50 ms — prevents particle teleportation when tab re-focuses
  const raw = now - lastTime || 16;
  const dt  = Math.min(raw, 50);
  lastTime  = now;
  frameCount++;

  const t = now / 1000;

  // Compute dark once per frame — avoids repeated DOM attribute reads
  const dark = isDark();

  // Hard clear on theme switch to remove colour bleed from old trail
  if (window._themeChanged) {
    pCtx.clearRect(0, 0, canvasW, canvasH);
    window._themeChanged = false;
  }

  clearCanvas(dark);
  drawFieldArrows(t, dark);
  updateAndDrawParticles(t, dt, dark);
  updateRipples(dark);
  applyHeroParallax();
  updateProbeDisplay();   // smooth probe value animation

  requestAnimationFrame(rafLoop);
}

/* ─── 15. 3D Card Tilt ──────────────────────────────────────────────────── */

function addTilt(card) {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2);
    const dy   = (e.clientY - cy) / (rect.height / 2);

    card.style.transform =
      `perspective(900px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) translateZ(4px)`;

    const mx = ((e.clientX - rect.left) / rect.width)  * 100;
    const my = ((e.clientY - rect.top)  / rect.height) * 100;
    card.style.setProperty('--mx', `${mx}%`);
    card.style.setProperty('--my', `${my}%`);
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.setProperty('--mx', '50%');
    card.style.setProperty('--my', '50%');
  });
}

function initTilt() {
  document.querySelectorAll('.research-card').forEach(addTilt);
}

/* ─── 16. SVG Path Self-Draw ────────────────────────────────────────────── */

function initSvgDraw() {
  document.querySelectorAll('.research-card').forEach(card => {
    const iconWrap = card.querySelector('.card-icon');
    if (!iconWrap) return;

    const svg = iconWrap.querySelector('svg');
    if (!svg) return;

    const paths = Array.from(svg.querySelectorAll('path, polyline, line'));
    if (!paths.length) return;

    const oSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    oSvg.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 48 48');
    oSvg.setAttribute('fill', 'none');
    oSvg.setAttribute('aria-hidden', 'true');
    oSvg.classList.add('path-overlay');

    const overlayPaths = [];

    paths.forEach(orig => {
      let len;
      try { len = orig.getTotalLength(); } catch { len = 80; }
      if (!len || len < 1) return;

      const clone = orig.cloneNode(true);
      clone.removeAttribute('fill');
      clone.removeAttribute('opacity');
      clone.style.fill             = 'none';
      clone.style.stroke           = 'currentColor';
      clone.style.strokeWidth      = '1.5';
      clone.style.strokeLinecap    = 'round';
      clone.style.strokeDasharray  = len;
      clone.style.strokeDashoffset = len;
      clone.style.transition       = 'none';

      oSvg.appendChild(clone);
      overlayPaths.push({ el: clone, len });
    });

    if (!overlayPaths.length) return;
    iconWrap.appendChild(oSvg);

    card.addEventListener('mouseenter', () => {
      overlayPaths.forEach(({ el, len }, i) => {
        el.style.transition =
          `stroke-dashoffset ${0.5 + i * 0.08}s cubic-bezier(0.4,0,0.2,1) ${i * 0.06}s`;
        el.style.strokeDashoffset = '0';
      });
    });

    card.addEventListener('mouseleave', () => {
      overlayPaths.forEach(({ el, len }) => {
        el.style.transition       = 'stroke-dashoffset 0.18s ease';
        el.style.strokeDashoffset = len;
      });
    });
  });
}

/* ─── 17. Orb Scroll Parallax ───────────────────────────────────────────── */

function initScrollParallax() {
  const orb1 = document.querySelector('.hero-orb-1');
  const orb2 = document.querySelector('.hero-orb-2');
  const orb3 = document.querySelector('.hero-orb-3');
  if (!orb1) return;

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    if (orb1) orb1.style.transform = `translateY(${sy * 0.25}px)`;
    if (orb2) orb2.style.transform = `translateY(${sy * 0.40}px)`;
    if (orb3) orb3.style.transform = `translateY(${sy * -0.15}px)`;
  }, { passive: true });
}

/* ─── 18. KaTeX Auto-Render Guard ───────────────────────────────────────── */

function ensureKaTeX() {
  if (document.querySelector('.katex')) return;
  setTimeout(() => {
    if (typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true  },
          { left: '$',  right: '$',  display: false },
        ],
        throwOnError: false,
      });
    }
  }, 800);
}

/* ─── 19. Publication Filter Tabs ───────────────────────────────────────── */

function initPublicationTabs() {
  const tabs    = document.querySelectorAll('.pub-tab');
  const entries = document.querySelectorAll('.pub-entry[data-type]');
  if (!tabs.length || !entries.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab state
      tabs.forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });

      const filter = tab.dataset.filter;

      entries.forEach(entry => {
        const type = entry.dataset.type;
        const show = filter === 'all' || type === filter || type === 'all';
        entry.style.display = show ? '' : 'none';
      });
    });
  });
}

/* ─── 20. Publication Panel Toggles (abstract + BibTeX) ─────────────────── */
/*
   Uses max-height animation for smooth open/close since
   height: auto cannot be transitioned directly.
*/

function initPubToggles() {
  const toggleBtns = document.querySelectorAll('.pub-toggle-btn[data-target]');
  if (!toggleBtns.length) return;

  toggleBtns.forEach(btn => {
    const targetId = btn.dataset.target;
    const panel    = document.getElementById(targetId);
    if (!panel) return;

    // Remove hidden attr — we control visibility via max-height / opacity
    panel.removeAttribute('hidden');
    panel.style.maxHeight = '0';
    panel.style.overflow  = 'hidden';

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        // Collapse
        panel.style.maxHeight = panel.scrollHeight + 'px'; // must set explicit before transition
        requestAnimationFrame(() => {
          panel.style.maxHeight = '0';
        });
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        // Expand — close any sibling panels of the same type first
        const pubBody = btn.closest('.pub-body');
        if (pubBody) {
          pubBody.querySelectorAll('.pub-toggle-btn[aria-expanded="true"]').forEach(other => {
            if (other !== btn) other.click();
          });
        }

        panel.style.maxHeight = panel.scrollHeight + 'px';
        panel.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');

        // After transition ends, set to 'none' so panel can grow with content
        panel.addEventListener('transitionend', () => {
          if (btn.getAttribute('aria-expanded') === 'true') {
            panel.style.maxHeight = 'none';
          }
        }, { once: true });
      }
    });
  });
}

/* ─── 21. BibTeX Copy to Clipboard ─────────────────────────────────────── */

function initBibTeXCopy() {
  const copyBtns = document.querySelectorAll('.bibtex-copy-btn[data-bibtex-target]');
  if (!copyBtns.length) return;

  copyBtns.forEach(btn => {
    const codeId  = btn.dataset.bibtexTarget;
    const codeEl  = document.getElementById(codeId);
    if (!codeEl) return;

    btn.addEventListener('click', async () => {
      const text = codeEl.textContent;
      const label = btn.querySelector(':last-child') || btn;

      try {
        // Modern clipboard API
        await navigator.clipboard.writeText(text);
        showCopied();
      } catch {
        // Fallback for older browsers / non-HTTPS
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          showCopied();
        } catch {
          console.warn('BibTeX copy failed');
        }
      }

      function showCopied() {
        btn.classList.add('copied');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="11" height="11">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
        </svg> Copied!`;

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.classList.remove('copied');
        }, 2200);
      }
    });
  });
}

/* ─── 22. Init ──────────────────────────────────────────────────────────── */

function init() {
  initFieldModes();    // must come first — fieldAt() used by canvas
  initTheme();
  initScrollProgress();
  initNavbar();
  initHamburger();
  initCursor();
  initScrollReveals();
  initCanvas();        // starts RAF loop
  initFieldProbe();
  initHeroParallax();
  initTilt();
  initSvgDraw();
  initScrollParallax();
  initPublicationTabs();
  initPubToggles();
  initBibTeXCopy();
  ensureKaTeX();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
