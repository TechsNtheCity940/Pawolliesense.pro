import React, { useEffect, useRef } from 'react';

type StarPoint = { x: number; y: number };

type Star = {
  id: number;
  ax: number;
  ay: number;
  tx: number;
  ty: number;
  r: number;
  tw: number;
  clicked: boolean;
  fact: string;
  vx: number;
  vy: number;
};

const FACTS = [
  'Pawollie Sense honors the bond between people and pets - love, trust, and the quiet language they share.',
  'We treat behavior as communication, not a label, because pets speak in patterns and signals.',
  'Gentle support can still be practical: calm steps, clear insight, and a plan that respects your pet\'s personality.',
  'A spirit-profile approach focuses on connection - what helps your pet feel safe, understood, and close to you.',
  'Memorial guidance helps hold grief with care, preserving a pet\'s story and the love that remains.',
  'Daily check-in insights are meant to be grounding: a small moment of clarity, not heavy predictions.',
  'Behavior does not happen in a vacuum. Stress, environment, change, health, and needs all matter.',
  'The Pawollie vibe is uplifting - support that feels like a warm light, not a lecture.',
  'A pet\'s love language can show up as proximity, play, touch tolerance, protective habits, or constant check-ins.',
  'The goal is better companionship - helping you show up for your pet the way they show up for you.'
];

const TARGETS: StarPoint[] = [
  { x: 0.5, y: 0.2 },
  { x: 0.34, y: 0.28 },
  { x: 0.66, y: 0.28 },
  { x: 0.4, y: 0.4 },
  { x: 0.6, y: 0.4 },
  { x: 0.5, y: 0.52 },
  { x: 0.42, y: 0.72 },
  { x: 0.58, y: 0.72 },
  { x: 0.72, y: 0.6 },
  { x: 0.5, y: 0.84 }
];

const LINES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 5],
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 9],
  [7, 8]
];

const PawollieStarGame: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const canvas = root.querySelector<HTMLCanvasElement>('.pawo-canvas');
    const ctx = canvas?.getContext('2d');
    const tip = root.querySelector<HTMLDivElement>('.pawo-tip');
    const tipBody = root.querySelector<HTMLDivElement>('.pawo-tipBody');
    const fill = root.querySelector<HTMLDivElement>('.pawo-fill');
    const progressText = root.querySelector<HTMLSpanElement>('.pawo-progress');
    const status = root.querySelector<HTMLSpanElement>('.pawo-status');

    if (!canvas || !ctx || !tip || !tipBody || !fill || !progressText || !status) return;

    const constellationImageSrc = '/assets/branding/star-game.png';
    const STAR_COUNT = 10;
    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const constImg = new Image();
    let constReady = false;
    constImg.onload = () => {
      constReady = true;
    };
    constImg.src = constellationImageSrc;

    let soundOn = false;
    const beep = (freq = 520, ms = 60) => {
      if (!soundOn) return;
      try {
        const AudioContextConstructor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) return;
        const ac = new AudioContextConstructor();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.value = 0.03;
        o.connect(g);
        g.connect(ac.destination);
        o.start();
        window.setTimeout(() => {
          o.stop();
          ac.close();
        }, ms);
      } catch {
        // Ignore audio errors.
      }
    };

    let stars: Star[] = [];
    let facts: string[] = [];
    let revealed = 0;
    let completed = false;
    let revealAlpha = 0;
    let hovered: Star | null = null;
    let selectedIndex = 0;
    let hintPulse = 0;

    const rand = (a: number, b: number) => Math.random() * (b - a) + a;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const shuffle = <T,>(arr: T[]) => {
      const copy = arr.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const setProgress = () => {
      fill.style.width = `${(revealed / STAR_COUNT) * 100}%`;
      progressText.textContent = `${revealed} / ${STAR_COUNT} revealed`;
    };

    const hideTip = () => {
      tip.style.opacity = '0';
      tip.setAttribute('aria-hidden', 'true');
    };

    const showTip = (star: Star, px: number, py: number) => {
      if (!star.clicked) return;
      tipBody.textContent = star.fact;
      tip.style.left = `${px}px`;
      tip.style.top = `${py}px`;
      tip.style.opacity = '1';
      tip.setAttribute('aria-hidden', 'false');
    };

    const makeStars = () => {
      const margin = 0.1;
      const minDist = 0.1;
      const points: StarPoint[] = [];
      const output: Star[] = [];

      for (let i = 0; i < STAR_COUNT; i += 1) {
        let tries = 0;
        while (tries++ < 500) {
          const x = rand(margin, 1 - margin);
          const y = rand(margin, 1 - margin);
          let ok = true;

          for (const p of points) {
            if (Math.hypot(x - p.x, y - p.y) < minDist) {
              ok = false;
              break;
            }
          }

          if (ok) {
            points.push({ x, y });
            output.push({
              id: i,
              ax: x,
              ay: y,
              tx: TARGETS[i].x,
              ty: TARGETS[i].y,
              r: rand(0.01, 0.014),
              tw: rand(0, Math.PI * 2),
              clicked: false,
              fact: facts[i],
              vx: 0,
              vy: 0
            });
            break;
          }
        }
      }

      return output;
    };

    const reset = () => {
      facts = shuffle(FACTS).slice(0, STAR_COUNT);
      revealed = 0;
      completed = false;
      revealAlpha = 0;
      hovered = null;
      selectedIndex = 0;
      hintPulse = 0;

      stars = makeStars();
      setProgress();
      status.textContent = 'Find all stars to reveal the constellation.';
      hideTip();
      beep(520, 70);
    };

    const normFromEvent = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      return { x, y, px: event.clientX - rect.left, py: event.clientY - rect.top };
    };

    const hitTest = (nx: number, ny: number) => {
      let best: Star | null = null;
      let bestD = 999;
      for (const s of stars) {
        const d = Math.hypot(nx - s.ax, ny - s.ay);
        if (d < s.r * 2.6 && d < bestD) {
          best = s;
          bestD = d;
        }
      }
      return best;
    };

    const clickStar = (star: Star | null) => {
      if (!star || star.clicked) return;
      star.clicked = true;
      revealed += 1;
      setProgress();

      const dx = star.tx - star.ax;
      const dy = star.ty - star.ay;
      const m = Math.hypot(dx, dy) || 1;
      star.vx = (dx / m) * 0.012;
      star.vy = (dy / m) * 0.012;

      beep(740, 55);

      if (revealed === STAR_COUNT) {
        completed = true;
        status.textContent = 'Constellation revealed.';
        beep(880, 80);
        window.setTimeout(() => beep(660, 90), 90);
      }
    };

    const handleRootClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest('button');
      if (!button) return;
      const action = button.getAttribute('data-action');
      if (action === 'new') reset();
      if (action === 'hint') {
        hintPulse = 1.0;
        beep(600, 50);
      }
      if (action === 'sound') {
        soundOn = !soundOn;
        button.setAttribute('aria-pressed', String(soundOn));
        beep(660, 60);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const { x, y, px, py } = normFromEvent(event);
      hovered = hitTest(x, y);
      if (hovered && hovered.clicked) showTip(hovered, px, py);
      else hideTip();
    };

    const handleMouseLeave = () => {
      hovered = null;
      hideTip();
    };

    const handleCanvasClick = (event: MouseEvent) => {
      const { x, y } = normFromEvent(event);
      clickStar(hitTest(x, y));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % STAR_COUNT;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + STAR_COUNT) % STAR_COUNT;
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        clickStar(stars[selectedIndex]);
      } else if (event.key === 'Escape') {
        hideTip();
      }
    };

    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createRadialGradient(w * 0.45, h * 0.35, w * 0.05, w * 0.5, h * 0.5, w * 0.75);
      bg.addColorStop(0, 'rgba(127,242,214,0.08)');
      bg.addColorStop(1, 'rgba(0,0,0,0.15)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 90; i += 1) {
        const x = ((i * 97) % 100) / 100;
        const y = ((i * 53) % 100) / 100;
        const tw = Math.sin(now / 900 + i) * 0.35 + 0.65;
        ctx.globalAlpha = 0.1 * tw;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x * w, y * h, 0.6 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const s of stars) {
        if (s.clicked) {
          const dx = s.tx - s.ax;
          const dy = s.ty - s.ay;
          s.vx += dx * 0.03 * dt;
          s.vy += dy * 0.03 * dt;
          s.vx *= 1 - 0.18 * dt;
          s.vy *= 1 - 0.18 * dt;
          s.ax += s.vx;
          s.ay += s.vy;
        } else {
          s.tw += dt * 1.2;
        }
      }

      if (completed) {
        revealAlpha = prefersReduced ? 1 : Math.min(1, revealAlpha + dt * 1.3);

        ctx.save();
        ctx.globalAlpha = 0.35 * revealAlpha;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(127,242,214,0.40)';
        ctx.shadowColor = 'rgba(127,242,214,0.45)';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        for (const [a, b] of LINES) {
          const p = TARGETS[a];
          const q = TARGETS[b];
          ctx.moveTo(p.x * w, p.y * h);
          ctx.lineTo(q.x * w, q.y * h);
        }
        ctx.stroke();
        ctx.restore();

        if (constReady) {
          ctx.save();
          ctx.globalAlpha = 0.95 * revealAlpha;
          ctx.shadowColor = 'rgba(127,242,214,0.55)';
          ctx.shadowBlur = 28;
          const pad = 0.06;
          const dx = w * pad;
          const dy = h * pad;
          const dw = w * (1 - pad * 2);
          const dh = h * (1 - pad * 2);
          ctx.drawImage(constImg, dx, dy, dw, dh);
          ctx.restore();
        }
      }

      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        const isHover = hovered && hovered.id === s.id;
        const isSel = i === selectedIndex && document.activeElement === canvas;

        const base = s.clicked ? 1.0 : 0.55 + 0.45 * Math.sin(s.tw * 2.0);
        const pulse = hintPulse > 0 && !s.clicked ? hintPulse : 0;
        const alpha = clamp(0.35 + 0.55 * base + 0.25 * pulse, 0.25, 1);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = s.clicked ? 'rgba(127,242,214,0.70)' : 'rgba(255,255,255,0.45)';
        ctx.shadowBlur = s.clicked ? 24 : 12;

        ctx.fillStyle = s.clicked ? 'rgba(127,242,214,0.95)' : 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.arc(s.ax * w, s.ay * h, s.r * w * (isHover ? 1.35 : 1.0), 0, Math.PI * 2);
        ctx.fill();

        if (isSel) {
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 0.9;
          ctx.strokeStyle = 'rgba(127,242,214,0.70)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(s.ax * w, s.ay * h, s.r * w * 2.2, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      if (hintPulse > 0) {
        hintPulse = Math.max(0, hintPulse - dt * 1.8);
      }

      rafRef.current = window.requestAnimationFrame(draw);
    };

    reset();
    rafRef.current = window.requestAnimationFrame(draw);

    root.addEventListener('click', handleRootClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('keydown', handleKeyDown);

    return () => {
      root.removeEventListener('click', handleRootClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('keydown', handleKeyDown);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div id="pawollieStarGame" ref={rootRef} className="pawo-wrap">
      <div className="pawo-card">
        <div className="pawo-header">
          <div className="pawo-title">
            <h2>Guidance From the Stars</h2>
            <p>
              Click the scattered stars. Each one reveals a supportive Pawollie fact. When all
              are found, Oliver&apos;s constellation appears.
            </p>
          </div>

          <div className="pawo-controls">
            <button type="button" data-action="new">New Sky</button>
            <button type="button" data-action="hint" title="Pulse unclicked stars">Hint</button>
            <button
              type="button"
              className="pawo-toggle"
              data-action="sound"
              aria-pressed="false"
              title="Toggle sound"
            >
              <span className="pawo-dot" aria-hidden="true"></span>
              Sound
            </button>
          </div>
        </div>

        <div className="pawo-main">
          <div className="pawo-meter" aria-label="Progress">
            <div className="pawo-bar">
              <div className="pawo-fill" style={{ width: '0%' }}></div>
            </div>
            <span className="pawo-progress">0 / 10 revealed</span>
          </div>

          <div className="pawo-stageWrap">
            <canvas
              className="pawo-canvas"
              width={900}
              height={900}
              tabIndex={0}
              aria-label="Star game. Use mouse or keyboard. Arrow keys cycle stars. Enter selects."
            ></canvas>

            <div className="pawo-tip" role="tooltip" aria-hidden="true">
              <strong>Star Fact</strong>
              <div className="pawo-tipBody"></div>
            </div>
          </div>
        </div>

        <div className="pawo-footer">
          <div className="pawo-badge">
            <i></i>
            <span className="pawo-status">Find all stars to reveal the constellation.</span>
          </div>
          <div className="pawo-small">One-column - responsive</div>
        </div>
      </div>
    </div>
  );
};

export default PawollieStarGame;
