/* ============================================================
   Particle hero — morphs text into a field of GPU points that
   scatter away from the cursor and spring back. Vanilla Three.js.
   Degrades gracefully if WebGL is unavailable.
   ============================================================ */
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas || typeof THREE === 'undefined') return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 2000);
  camera.position.z = 420;

  const WORDS = ['DATA', 'PIPELINES', 'SYSTEMS', 'BERKELEY'];
  const COUNT = window.innerWidth < 720 ? 4200 : 8500;
  // keep the particle word off to the right so it never sits on the headline
  const OFFX = window.innerWidth < 980 ? 0 : 170;
  const SCALE = window.innerWidth < 720 ? 0.30 : 0.34;

  // ---- sample target positions from text drawn on a 2D canvas ----
  function textTargets(text) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    c.width = 1000; c.height = 300;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 230;
    ctx.font = `700 ${size}px 'Space Grotesk', Arial, sans-serif`;
    while (ctx.measureText(text).width > 940 && size > 60) {
      size -= 10;
      ctx.font = `700 ${size}px 'Space Grotesk', Arial, sans-serif`;
    }
    ctx.fillText(text, c.width / 2, c.height / 2);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;

    const pts = [];
    const step = 3;
    for (let y = 0; y < c.height; y += step) {
      for (let x = 0; x < c.width; x += step) {
        if (data[(y * c.width + x) * 4 + 3] > 128) {
          pts.push([(x - c.width / 2) * SCALE + OFFX, -(y - c.height / 2) * SCALE]);
        }
      }
    }
    // resample to exactly COUNT points
    const out = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const p = pts[(Math.floor(i * 2.3137) % pts.length + pts.length) % pts.length] || [0, 0];
      out[i * 3] = p[0] + (Math.random() - 0.5) * 2.2;
      out[i * 3 + 1] = p[1] + (Math.random() - 0.5) * 2.2;
      out[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return out;
  }

  // ---- geometry ----
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const a = Math.random() * Math.PI * 2, r = 300 + Math.random() * 400;
    positions[i * 3] = Math.cos(a) * r + OFFX;
    positions[i * 3 + 1] = Math.sin(a) * r;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    seeds[i] = Math.random();
  }
  const palette = [new THREE.Color('#00eaff'), new THREE.Color('#b14bff'), new THREE.Color('#ff2e88')];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // soft circular sprite
  const sc = document.createElement('canvas'); sc.width = sc.height = 64;
  const sx = sc.getContext('2d');
  const g = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(.35, 'rgba(255,255,255,.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  sx.fillStyle = g; sx.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(sc);

  const mat = new THREE.PointsMaterial({
    size: 3.4, map: sprite, vertexColors: true, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending, opacity: .95
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ---- morph state ----
  let current = textTargets(WORDS[0]);
  let wordIdx = 0;
  // color particles by their x within the word
  function recolor(target) {
    for (let i = 0; i < COUNT; i++) {
      const t = Math.max(0, Math.min(1, (target[i * 3] - OFFX + 200) / 400));
      const cc = t < .5 ? palette[0].clone().lerp(palette[1], t * 2)
                        : palette[1].clone().lerp(palette[2], (t - .5) * 2);
      colors[i * 3] = cc.r; colors[i * 3 + 1] = cc.g; colors[i * 3 + 2] = cc.b;
    }
    geo.attributes.color.needsUpdate = true;
  }
  recolor(current);

  function morphTo(target) {
    const from = new Float32Array(positions);
    const o = { t: 0 };
    recolor(target);
    gsap.to(o, {
      t: 1, duration: 2.2, ease: 'power2.inOut',
      onUpdate() {
        const e = o.t;
        for (let i = 0; i < COUNT * 3; i++) {
          positions[i] = from[i] + (target[i] - from[i]) * e;
        }
      }
    });
    current = target;
  }

  // cycle words
  setInterval(() => {
    wordIdx = (wordIdx + 1) % WORDS.length;
    morphTo(textTargets(WORDS[wordIdx]));
  }, 3600);

  // ---- pointer interaction ----
  const pointer = { x: 1e6, y: 1e6, active: false };
  const vel = new Float32Array(COUNT * 3);
  function setPointer(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const nx = ((cx - r.left) / r.width) * 2 - 1;
    const ny = -(((cy - r.top) / r.height) * 2 - 1);
    pointer.x = nx * 260 * (r.width / r.height) * 0.5 + nx * 120;
    pointer.y = ny * 150;
    pointer.active = true;
  }
  window.addEventListener('pointermove', e => setPointer(e.clientX, e.clientY));
  window.addEventListener('pointerleave', () => pointer.active = false);

  // ---- resize ----
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  // ---- loop ----
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;
    const pos = geo.attributes.position.array;
    const reach = 70, force = 26;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3, iy = ix + 1, iz = ix + 2;
      // gentle idle drift toward target
      const tx = current[ix], ty = current[iy], tz = current[iz];
      // cursor repulsion
      if (pointer.active) {
        const dx = pos[ix] - pointer.x, dy = pos[iy] - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < reach * reach) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / reach) * force;
          vel[ix] += (dx / d) * f; vel[iy] += (dy / d) * f;
        }
      }
      // spring to target + damping
      vel[ix] += (tx - pos[ix]) * 0.012;
      vel[iy] += (ty - pos[iy]) * 0.012;
      vel[iz] += (tz - pos[iz]) * 0.012;
      vel[ix] *= 0.88; vel[iy] *= 0.88; vel[iz] *= 0.9;
      pos[ix] += vel[ix];
      pos[iy] += vel[iy] + Math.sin(t + seeds[i] * 6.28) * 0.06;
      pos[iz] += vel[iz];
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y = Math.sin(t * 0.15) * 0.12;
    points.rotation.x = -scrollY * 0.0006;
    points.position.y = scrollY * 0.25;
    mat.opacity = Math.max(0, 0.95 - scrollY / 700);
    renderer.render(scene, camera);
  }
  animate();

  // expose for konami gravity easter egg
  window.__particles = {
    gravity() {
      for (let i = 0; i < COUNT; i++) { current[i * 3 + 1] = -260 - Math.random() * 200; }
    }
  };
})();
