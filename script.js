/* ═══════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════ */
const btn = document.getElementById('themeToggle');
const root = document.documentElement;

// Default to light; check saved preference
const saved = localStorage.getItem('theme') || 'light';
root.setAttribute('data-theme', saved);

btn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  drawParticles(); // re-tint canvas
});

/* ═══════════════════════════════════════════
   PARTICLE / GRAPH CANVAS (hero background)
═══════════════════════════════════════════ */
const canvas = document.getElementById('particleCanvas');
const ctx    = canvas.getContext('2d');

let W, H, nodes, animId;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
  initNodes();
}

function accentColor() {
  return getComputedStyle(root).getPropertyValue('--accent').trim();
}

function initNodes() {
  const count = Math.min(60, Math.floor((W * H) / 18000));
  nodes = Array.from({ length: count }, () => ({
    x:  Math.random() * W,
    y:  Math.random() * H,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r:  Math.random() * 2 + 1.5,
  }));
}

function drawParticles() {
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function loop() {
  ctx.clearRect(0, 0, W, H);

  const isDark  = root.getAttribute('data-theme') === 'dark';
  const nodeFill = isDark ? 'rgba(116,143,252,0.55)' : 'rgba(59,91,219,0.4)';
  const edgeBase = isDark ? '116,143,252' : '59,91,219';

  // Move
  for (const n of nodes) {
    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > W) n.vx *= -1;
    if (n.y < 0 || n.y > H) n.vy *= -1;
  }

  // Edges
  const DIST = 140;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < DIST) {
        const alpha = (1 - d / DIST) * 0.3;
        ctx.strokeStyle = `rgba(${edgeBase},${alpha})`;
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
  }

  // Nodes
  ctx.fillStyle = nodeFill;
  for (const n of nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  }

  animId = requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { resize(); });
resize();

/* ═══════════════════════════════════════════
   NAVBAR: shrink on scroll
═══════════════════════════════════════════ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 20
    ? '0 2px 20px rgba(0,0,0,0.08)'
    : 'none';
});

/* ═══════════════════════════════════════════
   INTERSECTION OBSERVER: fade-in sections
═══════════════════════════════════════════ */
const style = document.createElement('style');
style.textContent = `
  .research-card, .pub-item, .contact-card, .about-grid {
    opacity: 0;
    transform: translateY(22px);
    transition: opacity 0.55s ease, transform 0.55s ease;
  }
  .visible {
    opacity: 1 !important;
    transform: none !important;
  }
`;
document.head.appendChild(style);

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });

document.querySelectorAll('.research-card, .pub-item, .contact-card, .about-grid')
  .forEach(el => observer.observe(el));
