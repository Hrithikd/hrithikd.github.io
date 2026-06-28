/* ============================================================
   Interaction layer
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- preloader ---------- */
  const pre = document.getElementById('preloader');
  const fill = document.getElementById('preloaderFill');
  const countEl = document.getElementById('preloaderCount');
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 14 + 4;
    if (p >= 100) { p = 100; clearInterval(tick); finish(); }
    fill.style.width = p + '%';
    countEl.textContent = Math.floor(p);
  }, 130);
  function finish() {
    setTimeout(() => {
      pre.classList.add('done');
      document.body.classList.add('loaded');
      playHero();
    }, 350);
  }
  function playHero() {
    if (reduce || typeof gsap === 'undefined') {
      document.querySelectorAll('.hero .reveal').forEach(e => e.classList.add('in'));
      return;
    }
    gsap.to('.hero .reveal', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .12 });
  }

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
  }
  // anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -10 });
      else t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- nav scrolled state ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.closest('.hero')) io.observe(el);
  });

  /* ---------- count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const to = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const dur = 1400; const start = performance.now();
      function step(now) {
        const k = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = (to * eased).toFixed(dec);
        if (k < 1) requestAnimationFrame(step); else el.textContent = to.toFixed(dec);
      }
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => cio.observe(c));

  /* ---------- custom cursor + magnetic ---------- */
  if (!isTouch) {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
    function cur() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(cur);
    }
    cur();
    document.querySelectorAll('a,button,[data-magnetic],[data-tilt]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
    // magnetic pull
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.32}px,${y * 0.42}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    // 3D tilt cards
    document.querySelectorAll('[data-tilt]').forEach(el => {
      const card = el.querySelector('.job__card, .skillcard, .edu__main') ? el : el;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const inner = el.querySelector('.job__card, .skillcard') || el;
        inner.style.transform = `perspective(800px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(6px)`;
      });
      el.addEventListener('mouseleave', () => {
        const inner = el.querySelector('.job__card, .skillcard') || el;
        inner.style.transform = '';
      });
    });
  }

  /* ============================================================
     TERMINAL
     ============================================================ */
  const term = document.getElementById('terminal');
  const body = document.getElementById('terminalBody');
  const input = document.getElementById('terminalInput');
  const open = () => { term.classList.add('open'); term.setAttribute('aria-hidden', 'false'); setTimeout(() => input.focus(), 60); };
  const close = () => { term.classList.remove('open'); term.setAttribute('aria-hidden', 'true'); };
  document.getElementById('openTerminal').addEventListener('click', open);
  const ot2 = document.getElementById('openTerminal2'); if (ot2) ot2.addEventListener('click', open);
  document.getElementById('closeTerminal').addEventListener('click', close);
  term.addEventListener('click', e => { if (e.target === term) close(); });

  function print(html, cls) {
    const d = document.createElement('div');
    d.className = 'terminal__line' + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  }

  const FILES = {
    help: () => print(
      'Available commands:\n' +
      '  <b>whoami</b>      who is this\n' +
      '  <b>experience</b>  where I have worked\n' +
      '  <b>skills</b>      the toolbox\n' +
      '  <b>education</b>   the degree\n' +
      '  <b>contact</b>     reach me\n' +
      '  <b>github</b>      open my github\n' +
      '  <b>resume</b>      the tl;dr\n' +
      '  <b>sudo</b>        nice try\n' +
      '  <b>clear</b>       wipe the screen\n' +
      '  <b>exit</b>        close terminal'),
    whoami: () => print('<b>Hrithik Datta</b> — EECS @ UC Berkeley.\nI work on LLM evaluation, large-scale data pipelines, and privacy-preserving systems.'),
    experience: () => print(
      '<b>Okareo</b>            SWE        2023–2026   LLM-eval platform, Spark + Vertex AI, −80% runtime\n' +
      '<b>Hinkal Protocol</b>   SWE        2023        ZK-proof privacy compute across DeFi protocols\n' +
      '<b>Shipyard Software</b> SWE        2021–2023   Real-time quote-pricing engine, Django/AWS\n' +
      '<b>Wayfair</b>           Data Eng   2021        Competitive-intel pricing tooling (PostgreSQL)\n' +
      '<b>Adobe</b>             ML Intern  2020        Personalization API + data-driven UI (PyTorch)'),
    skills: () => print('Python · C/C++ · PyTorch · Apache Spark · Vertex AI · GCP · Django · AWS Lambda · SQS · PostgreSQL · Solidity · ZK-Proofs · React · Verilog · FPGA/ASIC · Distributed Systems'),
    education: () => print('<b>UC Berkeley</b> — B.S. Electrical Engineering & Computer Science\n2018–2021 · Algorithms, OS, Databases, Architecture, AI, Cryptography'),
    contact: () => print('email   <b>dattax5@gmail.com</b>\nphone   <b>+1 (510) 512-5993</b>\ngithub  <b>github.com/Hrithikd</b>'),
    resume: () => print('Engineer who lives in the hard middle layer — pipelines, eval harnesses,\ndistributed jobs. Turned millions of messy events/day into product-grade signal.\nType <b>experience</b> for the full list.'),
    github: () => { print('opening <b>github.com/Hrithikd</b> …', 'ok'); window.open('https://github.com/Hrithikd', '_blank'); },
    sudo: () => print("nice try. you don't have root here 😏", 'pk'),
    clear: () => { body.innerHTML = ''; },
    exit: () => close(),
    ls: () => print('about/  experience/  skills/  education/  contact/  secrets/', 'pp'),
    'cat secrets/': () => print('try the konami code ↑ ↑ ↓ ↓ ← → ← → B A', 'pk'),
    sudo_rm: () => print('removing the universe… <span class="pk">permission denied</span>'),
  };

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    print(`<span>hrithik@portfolio ~ %</span> ${cmd}`, 'cmd');
    const key = cmd.toLowerCase();
    if (key.startsWith('sudo ')) { FILES.sudo(); return; }
    if (FILES[key]) FILES[key]();
    else print(`command not found: <b>${cmd}</b> — type <b>help</b>`, 'pk');
  }

  input && input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { run(input.value); input.value = ''; }
    if (e.key === 'Escape') close();
  });

  /* global hotkeys: ` or / opens terminal */
  window.addEventListener('keydown', e => {
    const typing = /^(input|textarea)$/i.test(document.activeElement.tagName);
    if (!typing && (e.key === '`' || e.key === '/')) { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });

  /* ============================================================
     KONAMI CODE → gravity
     ============================================================ */
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', e => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = (k === seq[pos]) ? pos + 1 : (k === seq[0] ? 1 : 0);
    if (pos === seq.length) {
      pos = 0;
      const toast = document.getElementById('konami');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3200);
      if (window.__particles) window.__particles.gravity();
    }
  });
})();
