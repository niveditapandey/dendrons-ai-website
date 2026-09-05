(function () {
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function quadPoint(x1, y1, cx, cy, x2, y2, t) {
    const mt = 1 - t;
    return {
      x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
      y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
    };
  }

  function bowControl(x1, y1, x2, y2, bow) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    return { cx: mx + nx * bow, cy: my + ny * bow };
  }

  function strokeCurve(ctx, x1, y1, x2, y2, bow) {
    const { cx, cy } = bowControl(x1, y1, x2, y2, bow);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
    return { cx, cy };
  }

  function makeBurst(originAngle, spread, count, lenMin, lenMax) {
    const branches = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = originAngle - spread / 2 + spread * t + rand(-0.12, 0.12);
      const len1 = rand(lenMin, lenMax);
      const bow1 = rand(0.18, 0.4) * len1 * (Math.random() < 0.5 ? 1 : -1);
      const curl = rand(-0.5, 0.5);
      const sub = [];
      if (Math.random() < 0.7) {
        const at = rand(0.42, 0.7);
        const len2 = rand(3.5, 6.5);
        sub.push({
          at,
          off: rand(0.5, 0.95) * (Math.random() < 0.5 ? 1 : -1),
          len: len2,
          bow: rand(0.2, 0.45) * len2 * (Math.random() < 0.5 ? 1 : -1),
        });
      }
      branches.push({ angle, len: len1, bow: bow1, curl, sub });
    }
    return branches;
  }

  function burstReach(branches) {
    let m = 0;
    for (const b of branches) {
      const r = b.len + (b.sub[0] ? b.sub[0].len * 0.75 : 0);
      if (r > m) m = r;
    }
    return m;
  }

  function drawBurstAt(ctx, ox, oy, branches, scale, lw) {
    for (const d of branches) {
      const x1 = ox + Math.cos(d.angle) * d.len * scale, y1 = oy + Math.sin(d.angle) * d.len * scale;
      ctx.lineWidth = lw * 1.15;
      const { cx, cy } = strokeCurve(ctx, ox, oy, x1, y1, d.bow * scale);

      for (const b of d.sub) {
        const p = quadPoint(ox, oy, cx, cy, x1, y1, b.at);
        const tangentAngle = d.angle + d.curl * (b.at - 0.5);
        const bang = tangentAngle + b.off;
        const ex = p.x + Math.cos(bang) * b.len * scale, ey = p.y + Math.sin(bang) * b.len * scale;
        ctx.lineWidth = lw * 0.6;
        strokeCurve(ctx, p.x, p.y, ex, ey, b.bow * scale);
      }
    }
  }

  function drawBeadedLine(ctx, x1, y1, x2, y2, scale, lw, beads, bow) {
    ctx.lineWidth = lw * 1.1;
    const { cx, cy } = strokeCurve(ctx, x1, y1, x2, y2, bow);
    for (let i = 1; i <= beads; i++) {
      const t = i / (beads + 1);
      const p = quadPoint(x1, y1, cx, cy, x2, y2, t);
      const p2 = quadPoint(x1, y1, cx, cy, x2, y2, Math.min(1, t + 0.02));
      const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 1.6 * scale, 0.9 * scale, ang, 0, Math.PI * 2);
      ctx.fill();
    }
    return { cx, cy };
  }

  function drawNucleus(ctx, r) {
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.1, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  function makeMotorNeuron() {
    const axonAngle = Math.PI / 2;
    const axonLen = rand(26, 34);
    const dendrites = makeBurst(-Math.PI / 2, 4.6, Math.round(rand(6, 8)), 8, 13);
    const terminals = makeBurst(axonAngle, 1.7, Math.round(rand(3, 4)), 5, 8);
    const somaPts = 9;
    return {
      type: 'motor',
      dendrites, axonAngle, axonLen, terminals,
      axonBow: rand(0.1, 0.22) * axonLen * (Math.random() < 0.5 ? 1 : -1),
      axonBeads: Math.round(rand(3, 4)),
      somaShape: new Array(somaPts).fill(0).map(() => 1 + rand(-0.1, 0.13)),
      maxReach: Math.max(burstReach(dendrites), axonLen + burstReach(terminals) * 0.6),
    };
  }

  function makeInterneuron() {
    const axonAngle = Math.PI / 2;
    const axonLen = rand(13, 19);
    const dendrites = makeBurst(-Math.PI / 2, 4.2, Math.round(rand(4, 6)), 7, 11);
    const terminals = makeBurst(axonAngle, 3.4, Math.round(rand(3, 5)), 6, 9);
    const somaPts = 8;
    return {
      type: 'interneuron',
      dendrites, axonAngle, axonLen, terminals,
      axonBow: rand(0.12, 0.26) * axonLen * (Math.random() < 0.5 ? 1 : -1),
      axonBeads: 0,
      somaShape: new Array(somaPts).fill(0).map(() => 1 + rand(-0.08, 0.1)),
      maxReach: Math.max(burstReach(dendrites), axonLen + burstReach(terminals) * 0.6),
    };
  }

  function makeSensoryNeuron() {
    const spineLen = rand(38, 50);
    const stalkT = rand(0.32, 0.44);
    const stalkSide = Math.random() < 0.5 ? 1 : -1;
    const stalkLen = rand(5, 8);
    const topBranches = makeBurst(-Math.PI / 2, 2.6, Math.round(rand(3, 4)), 6, 9);
    const botBranches = makeBurst(Math.PI / 2, 2.6, Math.round(rand(3, 4)), 6, 9);
    const somaPts = 8;
    return {
      type: 'sensory',
      spineLen, stalkT, stalkSide, stalkLen, topBranches, botBranches,
      spineBow: rand(0.08, 0.16) * spineLen * (Math.random() < 0.5 ? 1 : -1),
      spineBeads: Math.round(rand(4, 6)),
      somaShape: new Array(somaPts).fill(0).map(() => 1 + rand(-0.1, 0.12)),
      maxReach: spineLen / 2 + Math.max(burstReach(topBranches), burstReach(botBranches)),
    };
  }

  function makeNeuronShape() {
    const r = Math.random();
    if (r < 0.34) return makeMotorNeuron();
    if (r < 0.67) return makeInterneuron();
    return makeSensoryNeuron();
  }

  function drawSoma(ctx, somaShape, r) {
    ctx.beginPath();
    const n = somaShape.length;
    for (let i = 0; i <= n; i++) {
      const ang = (Math.PI * 2 * i) / n;
      const rr = r * somaShape[i % n];
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    drawNucleus(ctx, r);
  }

  function drawNeuronGlyph(ctx, shape, scale, somaR, lw) {
    ctx.lineCap = 'round';

    if (shape.type === 'motor' || shape.type === 'interneuron') {
      drawBurstAt(ctx, 0, 0, shape.dendrites, scale, lw);
      const ax = Math.cos(shape.axonAngle) * shape.axonLen * scale, ay = Math.sin(shape.axonAngle) * shape.axonLen * scale;
      drawBeadedLine(ctx, 0, 0, ax, ay, scale, lw, shape.axonBeads, shape.axonBow * scale);
      drawBurstAt(ctx, ax, ay, shape.terminals, scale, lw * 0.85);
      drawSoma(ctx, shape.somaShape, somaR);
    } else {
      const half = (shape.spineLen * scale) / 2;
      drawBeadedLine(ctx, 0, -half, 0, half, scale, lw, shape.spineBeads, shape.spineBow * scale);
      drawBurstAt(ctx, 0, -half, shape.topBranches, scale, lw * 0.9);
      drawBurstAt(ctx, 0, half, shape.botBranches, scale, lw * 0.9);
      const stalkY = -half + shape.spineLen * scale * shape.stalkT;
      const somaX = shape.stalkSide * shape.stalkLen * scale;
      ctx.lineWidth = lw;
      strokeCurve(ctx, 0, stalkY, somaX, stalkY, shape.stalkSide * shape.stalkLen * scale * 0.25);
      ctx.save();
      ctx.translate(somaX, stalkY);
      drawSoma(ctx, shape.somaShape, somaR);
      ctx.restore();
    }
  }

  function createNeuronField(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const isDark = opts.theme === 'dark';
    const nodeColor = isDark ? '255,255,255' : '30,58,138';
    const sparkColor = isDark ? '255,255,255' : '37,99,235';
    const sparkGlow = isDark ? '125,211,252' : '96,165,250';
    const baseDensity = opts.density || 14;

    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let sparks = [];
    let raf = null;
    let running = false;
    let inView = false;
    let lastT = 0;
    let pairCheckAcc = 0;

    function spawn(y) {
      const shape = makeNeuronShape();
      const scale = rand(1.15, 1.85);
      return {
        x: rand(0, W),
        y: y === undefined ? rand(-H, 0) : y,
        rotation: rand(0, Math.PI * 2),
        angVel: rand(-0.0003, 0.0003),
        vy: rand(0.01, 0.024),
        swayFreq: rand(0.15, 0.4),
        phase: rand(0, Math.PI * 2),
        scale,
        somaR: rand(2.2, 3.0) * scale,
        lw: rand(0.7, 1),
        shape,
        baseOpacity: rand(0.35, 0.75),
        state: 'idle',
        partner: null,
        isLeader: false,
        timer: 0,
        cooldown: rand(0, 1500),
        sepVX: 0, sepVY: 0,
      };
    }

    function seed() {
      const factor = window.innerWidth < 640 ? 0.5 : 1;
      const count = Math.round(baseDensity * factor);
      particles = new Array(count).fill(0).map(() => spawn());
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width; H = rect.height;
      if (W <= 0 || H <= 0) return;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function tryPairing() {
      const idle = particles.filter(p => p.state === 'idle' && p.cooldown <= 0);
      for (let i = 0; i < idle.length; i++) {
        const a = idle[i];
        if (a.state !== 'idle') continue;
        let best = null, bestD = 95;
        for (let j = 0; j < idle.length; j++) {
          const b = idle[j];
          if (a === b || b.state !== 'idle') continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < bestD) { bestD = d; best = b; }
        }
        if (best && Math.random() < 0.35) {
          const targetDist = (a.shape.maxReach * a.scale + best.shape.maxReach * best.scale) * 0.55;
          a.state = 'approach'; best.state = 'approach';
          a.partner = best; best.partner = a;
          a.isLeader = true; best.isLeader = false;
          a.approachTarget = targetDist; best.approachTarget = targetDist;
          a.timer = 1400; best.timer = 1400;
        }
      }
    }

    function triggerSpark(a, b) {
      sparks.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, start: performance.now(), dur: 480 });
      for (const n of [a, b]) { n.state = 'spark'; n.timer = 240; }
    }

    function beginSeparate(n) {
      const p = n.partner;
      const dx = n.x - (p ? p.x : n.x), dy = n.y - (p ? p.y : n.y);
      const d = Math.hypot(dx, dy) || 1;
      n.sepVX = (dx / d) * rand(0.05, 0.09);
      n.sepVY = (dy / d) * rand(0.02, 0.05) - 0.02;
      n.state = 'separate';
      n.timer = 650;
    }

    function update(dt) {
      for (const n of particles) {
        n.cooldown = Math.max(0, n.cooldown - dt);
        n.rotation += n.angVel * dt;
        n.y += n.vy * dt;
        n.x += Math.sin((lastT / 1000) * n.swayFreq + n.phase) * 0.012 * dt;

        if (n.state === 'approach') {
          n.timer -= dt;
          if (n.partner && n.partner.state === 'approach') {
            const dx = n.partner.x - n.x, dy = n.partner.y - n.y;
            const dist = Math.hypot(dx, dy);
            if (dist > n.approachTarget) { n.x += dx * 0.018; n.y += dy * 0.018; }
            else if (n.isLeader) { triggerSpark(n, n.partner); }
          }
          if (n.timer <= 0 && n.state === 'approach') { n.state = 'idle'; n.partner = null; n.cooldown = rand(500, 1200); }
        } else if (n.state === 'spark') {
          n.timer -= dt;
          if (n.timer <= 0) beginSeparate(n);
        } else if (n.state === 'separate') {
          n.timer -= dt;
          n.x += n.sepVX * dt; n.y += n.sepVY * dt;
          if (n.timer <= 0) { n.state = 'idle'; n.partner = null; n.cooldown = rand(1800, 3200); }
        }

        if (n.y - 20 > H) Object.assign(n, spawn(-14), { x: rand(0, W) });
      }

      pairCheckAcc += dt;
      if (pairCheckAcc > 260) { pairCheckAcc = 0; tryPairing(); }

      sparks = sparks.filter(s => performance.now() - s.start < s.dur);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (const n of particles) {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rotation);
        const firing = n.state === 'spark' ? 1 : 0;
        const op = Math.min(1, n.baseOpacity + firing * 0.5);
        ctx.strokeStyle = `rgba(${nodeColor},${op * 0.65})`;
        ctx.fillStyle = `rgba(${nodeColor},${op})`;
        drawNeuronGlyph(ctx, n.shape, n.scale * (1 + firing * 0.2), n.somaR * (1 + firing * 0.5), n.lw * (1 + firing * 0.6));
        ctx.restore();
      }

      const now = performance.now();
      if (sparks.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const s of sparks) {
          const k = (now - s.start) / s.dur;
          const intensity = k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88;
          ctx.save();
          ctx.translate(s.x, s.y);

          const glowR = lerp(6, 34, Math.min(1, k * 1.4));
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
          grad.addColorStop(0, `rgba(255,255,255,${1.0 * intensity})`);
          grad.addColorStop(0.25, `rgba(${sparkColor},${0.85 * intensity})`);
          grad.addColorStop(0.55, `rgba(${sparkGlow},${0.45 * intensity})`);
          grad.addColorStop(1, `rgba(${sparkGlow},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, glowR, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(255,255,255,${0.95 * intensity})`;
          ctx.lineWidth = 1.6;
          const rays = 11;
          const rayLen = lerp(4, 22, Math.min(1, k * 1.3));
          for (let i = 0; i < rays; i++) {
            const ang = (Math.PI * 2 * i) / rays + k * 2.2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * 2, Math.sin(ang) * 2);
            ctx.lineTo(Math.cos(ang) * rayLen, Math.sin(ang) * rayLen);
            ctx.stroke();
          }

          const ringR = lerp(3, 30, k);
          ctx.strokeStyle = `rgba(${sparkGlow},${0.6 * (1 - k)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, ringR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        }
        ctx.restore();
      }
    }

    function loop(t) {
      if (!running) return;
      const dt = lastT ? Math.min(48, t - lastT) : 16;
      lastT = t;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function staticFrame() {
      lastT = 0;
      draw();
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function play() {
      if (running || !inView) return;
      if (reduceMotion.matches) { staticFrame(); return; }
      running = true;
      lastT = 0;
      raf = requestAnimationFrame(loop);
    }

    function pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        inView = e.isIntersecting;
        if (inView) play(); else pause();
      }
    }, { rootMargin: '150px 0px' });
    io.observe(canvas.parentElement);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause(); else play();
    });

    window.addEventListener('resize', resize);
    resize();
    if (reduceMotion.matches) staticFrame();
  }

  function autoInit() {
    document.querySelectorAll('canvas[data-neuron-field]').forEach((canvas) => {
      const theme = canvas.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const density = parseInt(canvas.getAttribute('data-density') || '14', 10);
      createNeuronField(canvas, { theme, density });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
