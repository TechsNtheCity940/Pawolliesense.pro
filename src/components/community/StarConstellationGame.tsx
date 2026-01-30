import React, { useEffect, useMemo, useState } from "react";

type Fact = {
  type: string;
  label: string;
  text: string;
  practice?: string;
  cite?: string;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Pt = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Try to keep scattered stars away from their own target position,
// so the formation motion is noticeable.
function generateScatterPoints(targets: Pt[], padding = 8): Pt[] {
  const MIN_DIST = 18;
  const attempts = 30;

  return targets.map((t) => {
    for (let k = 0; k < attempts; k++) {
      const x = padding + Math.random() * (100 - padding * 2);
      const y = padding + Math.random() * (100 - padding * 2);
      const dx = x - t.x;
      const dy = y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= MIN_DIST) return { x: +x.toFixed(2), y: +y.toFixed(2) };
    }
    // fallback if we fail to find a far point
    return {
      x: clamp(t.x + (Math.random() * 40 - 20), padding, 100 - padding),
      y: clamp(t.y + (Math.random() * 40 - 20), padding, 100 - padding),
    };
  });
}

export default function StarConstellationGame() {
  // ✅ IMPORTANT:
  // Replace STAR_POINTS + LINE_EDGES with your "exact Oli" export from the mapper.
  // These are placeholders until you paste the mapped ones.
  const STAR_POINTS = useMemo(
    () => [
      { x: 50.0, y: 12.0 },
      { x: 42.5, y: 15.5 },
      { x: 57.5, y: 15.5 },
      { x: 46.0, y: 18.5 },
      { x: 54.0, y: 18.5 },
      { x: 45.5, y: 24.0 },
      { x: 54.5, y: 24.0 },
      { x: 50.0, y: 27.5 },
      { x: 50.0, y: 31.0 },
      { x: 46.5, y: 33.5 },
      { x: 53.5, y: 33.5 },
      { x: 50.0, y: 38.0 },
      { x: 45.0, y: 38.5 },
      { x: 55.0, y: 38.5 },
      { x: 48.0, y: 45.0 },
      { x: 52.0, y: 45.0 },
      { x: 40.0, y: 60.0 },
      { x: 60.0, y: 60.0 },
      { x: 50.0, y: 68.0 },
      { x: 63.5, y: 52.0 },
      { x: 69.0, y: 47.0 },
      { x: 66.5, y: 56.0 }
    ],
    []
  );

  const LINE_EDGES = useMemo(
    () =>
      [
        [1, 3], [3, 0], [0, 4], [4, 2],
        [5, 7], [6, 7], [7, 8],
        [8, 9], [8, 10],
        [9, 11], [11, 12], [11, 13],
        [11, 14], [11, 15], [14, 15],
        [14, 16], [15, 17], [16, 18], [17, 18],
        [17, 19], [19, 20], [20, 21]
      ] as Array<[number, number]>,
    []
  );

  // Research + Pawollie facts (expand anytime)
  const RESEARCH_FACTS: Fact[] = useMemo(() => [
    {
      type: "Bond chemistry",
      label: "The ‘love loop’ is real biology",
      text: "Mutual gazing between dogs and humans has been shown to increase oxytocin in both—strengthening affiliative bonding.",
      practice: "Try 5 seconds of gentle eye contact (no staring). Look away first—softness matters.",
      cite: "Science (2015)"
    },
    {
      type: "Emotion sensing",
      label: "Dogs can smell human stress",
      text: "In controlled tests, dogs distinguished human stress odor from baseline odor using scent samples—without body-language cues.",
      practice: "Before greeting your dog after stress: exhale slowly 3 times. Your nervous system sets the room.",
      cite: "PLOS ONE (2022)"
    },
    {
      type: "Social emotions",
      label: "Jealousy-like behaviors appear in dogs",
      text: "When owners gave affection to a perceived rival, many dogs showed more interruption behaviors than with objects.",
      practice: "Reward calm ‘watch me’ + give each pet 60–90 seconds of solo attention daily.",
      cite: "PLOS ONE (2014)"
    },
    {
      type: "Communication",
      label: "Slow blinking isn’t just for cats",
      text: "Soft facial signals—relaxed eyes, slow blinking, gentle gaze breaks—are common de-escalation cues across mammals.",
      practice: "Try: look → slow blink → glance away. If your pet relaxes, repeat once.",
      cite: "Calming signals"
    }
  ], []);

  const PAWOLLIE_FACTS: Fact[] = useMemo(() => [
    {
      type: "Pawollie Sense",
      label: "Bond > blame",
      text: "A lot of ‘misbehavior’ is miscommunication. Pawollie Sense treats behavior as information, then turns it into guidance.",
      practice: "Replace ‘stop’ with a clear alternative cue + reward (sit/place/touch).",
      cite: "Brand principle"
    },
    {
      type: "Pawollie Sense",
      label: "This game is the mission (mini)",
      text: "Pets study us deeply—this is a playful way to return the attention and learn them with intention.",
      practice: "Ask: ‘What need is this behavior meeting?’ Then meet it safely on purpose.",
      cite: "Brand message"
    }
  ], []);

  const buildDeck = useMemo(() => {
    const deck: Fact[] = [];
    RESEARCH_FACTS.forEach((f) => deck.push(f, f)); // weighted
    PAWOLLIE_FACTS.forEach((f) => deck.push(f));
    return () => shuffle(deck);
  }, [RESEARCH_FACTS, PAWOLLIE_FACTS]);

  const [clicked, setClicked] = useState<boolean[]>(() => Array(STAR_POINTS.length).fill(false));
  const clickedCount = clicked.filter(Boolean).length;
  const [scatter, setScatter] = useState<Pt[]>(() => generateScatterPoints(STAR_POINTS));
  const [glowMode, setGlowMode] = useState(false);

  const [deck, setDeck] = useState<Fact[]>(() => buildDeck());
  const [deckPos, setDeckPos] = useState(0);

  const [fact, setFact] = useState<Fact | null>(null);
  const [practice, setPractice] = useState("Try a 3-second soft gaze at your pet, then blink slowly.");
  const [completeOpen, setCompleteOpen] = useState(false);

  const edgesToShow = Math.min(
    LINE_EDGES.length,
    Math.floor((clickedCount / STAR_POINTS.length) * LINE_EDGES.length)
  );

  function nextFact() {
    if (deckPos >= deck.length) {
      const newDeck = buildDeck();
      setDeck(newDeck);
      setDeckPos(1);
      const f = newDeck[0];
      setFact(f);
      setPractice(f.practice || practice);
      return;
    }
    const f = deck[deckPos];
    setDeckPos((p) => p + 1);
    setFact(f);
    setPractice(f.practice || practice);
  }

  function handleStarClick(i: number) {
    setClicked((prev) => {
      if (prev[i]) return prev;
      const next = [...prev];
      next[i] = true;
      return next;
    });
    nextFact();
  }

  useEffect(() => {
    if (clickedCount >= STAR_POINTS.length) {
      setCompleteOpen(true);
      setGlowMode(true);
    }
  }, [clickedCount, STAR_POINTS.length]);

  function reset(reshuffleFacts: boolean) {
    setClicked(Array(STAR_POINTS.length).fill(false));
    setCompleteOpen(false);
    setGlowMode(false);
    setScatter(generateScatterPoints(STAR_POINTS));
    setFact(null);
    setPractice("Try a 3-second soft gaze at your pet, then blink slowly.");

    if (reshuffleFacts) {
      const newDeck = buildDeck();
      setDeck(newDeck);
    }
    setDeckPos(0);
  }

  const svgLines = useMemo(() => {
    const pts = STAR_POINTS.map((p) => ({
      x: 1000 * (p.x / 100),
      y: 700 * (p.y / 100)
    }));

    return LINE_EDGES.map(([a, b], idx) => {
      const on = idx < edgesToShow || clickedCount >= STAR_POINTS.length;
      return (
        <line
          key={idx}
          x1={pts[a].x}
          y1={pts[a].y}
          x2={pts[b].x}
          y2={pts[b].y}
          className={`arc-line ${on ? "on" : ""} ${glowMode ? "glow" : ""}`}
        />
      );
    });
  }, [STAR_POINTS, LINE_EDGES, edgesToShow, clickedCount, glowMode]);

  return (
    <div className="arcade-card" aria-label="Pawprints Among the Stars arcade game">
      <div className="arcade-top">
        <div className="arcade-title">
          <div className="pill">Pawprints Among the Stars</div>
          <div className="mini">Tap the stars. Build Oli. Learn something real.</div>
        </div>

        <div className="arcade-status">
          <div className="arcade-score">
            <span className="mini">Stars</span>
            <strong>{clickedCount}/{STAR_POINTS.length}</strong>
          </div>

          <div className="arcade-actions">
            <button type="button" className="cta secondary" onClick={() => reset(false)}>Reset</button>
            <button type="button" className="cta secondary ghost" onClick={() => reset(true)}>New run</button>
          </div>
        </div>
      </div>

      <div className={`arcade-playfield ${glowMode ? "constellation-glow" : ""}`}>
        {/* Optional faint guide so the constellation visually matches the Oli image while playing */}
        <div className="oli-guide" aria-hidden="true" />

        <svg className="arcade-lines" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
          {svgLines}
        </svg>

        {STAR_POINTS.map((target, i) => {
          const start = scatter[i] ?? target;
          const pos = clicked[i] ? target : start;

          return (
            <button
              key={i}
              type="button"
              className={`arc-star ${clicked[i] ? "clicked" : ""} ${glowMode ? "glow" : ""}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transition: clicked[i]
                  ? "left 650ms cubic-bezier(.2,.9,.2,1), top 650ms cubic-bezier(.2,.9,.2,1), transform 180ms ease"
                  : "left 0ms, top 0ms",
              }}
              onClick={() => handleStarClick(i)}
              aria-label={`Star ${i + 1}`}
            />
          );
        })}

        {/* In-game HUD (single box, arcade feel) */}
        <div className="arcade-hud">
          <div className="hud-head">
            <span className="hud-chip">{fact ? fact.type : "Start"}</span>
            <span className="mini">
              {fact ? `Unlocked ${Math.min(deckPos, deck.length)} of ${deck.length}` : "Click any star to begin"}
            </span>
          </div>

          <div className="hud-body">
            <div className="hud-title">{fact ? fact.label : "Build the constellation"}</div>
            <div className="hud-text">
              {fact
                ? fact.text
                : "Each click places a star into Oli’s constellation and unlocks a new insight."}
            </div>

            <div className="hud-practice">
              <span className="mini">Micro-practice</span>
              <div>{practice}</div>
            </div>
          </div>
        </div>

        {/* Completion overlay */}
        <div className={`arcade-complete ${completeOpen ? "on" : ""}`} role="dialog" aria-modal="true">
          <div className="frame">
            <img src="/assets/constellation oli for game.png" alt="Oli constellation completed" />
            <div className="caption">Constellation Complete</div>
            <div className="sub">You rebuilt Oli star-by-star. That’s the whole idea.</div>
            <div className="game-controls overlay-controls">
              <button type="button" onClick={() => reset(true)}>Play again</button>
              <button type="button" className="ghost" onClick={() => setCompleteOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
