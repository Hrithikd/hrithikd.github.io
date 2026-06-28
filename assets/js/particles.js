/* ============================================================
   Ambient background — a quiet field of slow-drifting points.
   No text, no words. Just a subtle living backdrop behind the hero.
   ============================================================ */
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['rgba(0,234,255,', 'rgba(177,75,255,', 'rgba(255,46,136,'];

  let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let points = [];
  const mouse = { x: -9999, y: -9999 };

  function build() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const density = Math.min(90, Math.floor((w * h) / 18000));
    points = [];
    for (let i = 0; i < density; i++) {
      points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.8 + 0.6,
        a: Math.random() * 0.35 + 0.12,
        c: COLORS[(Math.random() * COLORS.length) | 0]
      });
    }
  }

  window.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  window.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  window.addEventListener('resize', build);
  build();

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (const p of points) {
      // gentle drift
      p.x += p.vx; p.y += p.vy;
      // soft parallax push away from cursor
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14000) {
        const d = Math.sqrt(d2) || 1;
        p.x += (dx / d) * 0.6; p.y += (dy / d) * 0.6;
      }
      // wrap around edges
      if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c + p.a + ')';
      ctx.fill();
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  frame();
})();
