(() => {
  const canvas = document.getElementById('bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });

  // รองรับจอ HiDPI
  const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  let W = 0, H = 0;

  function resize() {
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    setNodeTargetCount();
  }
  resize();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  // พารามิเตอร์หลัก (ปรับได้)
  const params = {
    baseDensity: 12000,     // ยิ่งเล็ก = แน่นขึ้น
    minNodes: 60,
    addNodes: 120,
    maxLinkDist: 120,       // ระยะที่เชื่อมเส้น
    nodeRadius: [1.2, 2.2], // รัศมีจุด
    speed: [0.05, 0.25],    // ความเร็ว x,y
    lineAlpha: 0.15,        // โปร่งของเส้น
    nodeAlpha: 0.85,        // โปร่งของจุด
    pulseEvery: [1200, 2000], // ms สุ่มสร้างพัลส์
    pulseSpeed: 120,        // px/s
    pulseWidth: 2,
    pulseFade: 0.9          // 0.9 = จางช้า
  };

  const nodes = [];
  const pulses = [];
  let targetNodes = 0;

  function rand(a, b) { return Math.random() * (b - a) + a; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function setNodeTargetCount() {
    targetNodes = Math.max(
      params.minNodes,
      Math.floor((W * H) / params.baseDensity) + params.addNodes
    );
    while (nodes.length < targetNodes) nodes.push(makeNode());
    while (nodes.length > targetNodes) nodes.pop();
  }

  function makeNode() {
    const speedX = rand(params.speed[0], params.speed[1]) * (Math.random() < 0.5 ? -1 : 1);
    const speedY = rand(params.speed[0], params.speed[1]) * (Math.random() < 0.5 ? -1 : 1);
    return {
      x: rand(0, W),
      y: rand(0, H),
      vx: speedX,
      vy: speedY,
      r: rand(params.nodeRadius[0], params.nodeRadius[1]),
      a: rand(0.6, 1.0), // สว่างเล็กน้อย
      tw: rand(0.002, 0.006) * (Math.random() < 0.5 ? -1 : 1) // twinkle
    };
  }

  // พัลส์ (คลื่นวงกลมจาก node แบบ "check-in")
  function makePulse(n) {
    return { x: n.x, y: n.y, r: 0, alpha: 0.8 };
  }

  // สุ่มสร้างพัลส์เรื่อย ๆ
  let pulseTimer = null;
  function schedulePulse() {
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => {
      if (nodes.length) {
        const n = nodes[(Math.random() * nodes.length) | 0];
        pulses.push(makePulse(n));
      }
      schedulePulse();
    }, rand(params.pulseEvery[0], params.pulseEvery[1]));
  }
  schedulePulse();

  // ลดแอนิเมชันตามระบบ/แท็บเบื้องหลัง
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduceMotion.matches || document.visibilityState === 'hidden';
  reduceMotion.addEventListener?.('change', () => {
    paused = reduceMotion.matches;
  });
  document.addEventListener('visibilitychange', () => {
    paused = document.visibilityState === 'hidden' || reduceMotion.matches;
    if (!paused) last = performance.now();
  });

  let last = performance.now();

  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // เคลือบโปร่งเพื่อให้เกิด trail เบา ๆ
    ctx.fillStyle = 'rgba(25,26,28,0.3)';
    ctx.fillRect(0, 0, W, H);

    // วาด nodes
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;

      // ขอบสะท้อนกลับ
      if (n.x < 0) { n.x = 0; n.vx *= -1; }
      if (n.x > W) { n.x = W; n.vx *= -1; }
      if (n.y < 0) { n.y = 0; n.vy *= -1; }
      if (n.y > H) { n.y = H; n.vy *= -1; }

      // twinkle
      n.a += n.tw;
      if (n.a < 0.6 || n.a > 1.0) n.tw *= -1;

      ctx.globalAlpha = params.nodeAlpha * n.a;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // เส้นเชื่อม
    const maxD = params.maxLinkDist;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= maxD * maxD) {
          const d = Math.sqrt(d2);
          const alpha = params.lineAlpha * (1 - d / maxD);
          ctx.globalAlpha = clamp(alpha, 0, 0.5);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;

    // พัลส์วงกลม
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.r += params.pulseSpeed * dt;
      p.alpha *= Math.pow(params.pulseFade, dt * 60);
      if (p.alpha < 0.02 || p.r > Math.max(W, H) * 1.2) {
        pulses.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = params.pulseWidth;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (!paused) requestAnimationFrame(draw);
  }

  // เติมพื้นเข้มครั้งแรกกันวูบ
  ctx.fillStyle = 'rgba(25,26,28,1)';
  ctx.fillRect(0, 0, W, H);

  if (!paused) requestAnimationFrame((t) => {
    last = t;
    requestAnimationFrame(draw);
  });
})();
