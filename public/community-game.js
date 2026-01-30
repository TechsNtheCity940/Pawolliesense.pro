function hasMetaMask() {
  return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
}

async function connectMetaMaskSafely() {
  if (!hasMetaMask()) {
    console.warn('MetaMask not installed.');
    return { ok: false, reason: 'NO_METAMASK' };
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return { ok: true, accounts };
  } catch (err) {
    console.error('MetaMask connect failed:', err);
    return { ok: false, reason: 'CONNECT_FAILED', err };
  }
}

function initCommunityGame() {
  const sky = document.getElementById('sky');
  const linesSvg = document.getElementById('lines');
  const progress = document.getElementById('progress');
  const complete = document.getElementById('complete');
  const factLabel = document.getElementById('factLabel');
  const factText = document.getElementById('factText');
  const factType = document.getElementById('factType');
  const factIndex = document.getElementById('factIndex');
  const practiceText = document.getElementById('practiceText');
  const btnReset = document.getElementById('reset');
  const btnShuffle = document.getElementById('shuffle');
  const btnPlayAgain = document.getElementById('playAgain');
  const btnClose = document.getElementById('closeOverlay');

  if (!sky || !linesSvg || !progress || !complete || !factLabel || !factText || !factType || !factIndex || !practiceText) {
    return;
  }

  if (sky.dataset.pawollieInit === 'true') return;
  sky.dataset.pawollieInit = 'true';

  const STAR_POINTS = [
    { x: 50, y: 12 },
    { x: 36, y: 18 },
    { x: 64, y: 18 },
    { x: 50, y: 24 },
    { x: 45, y: 30 },
    { x: 55, y: 30 },
    { x: 50, y: 36 },
    { x: 50, y: 44 },
    { x: 44, y: 53 },
    { x: 56, y: 53 },
    { x: 36, y: 72 },
    { x: 64, y: 72 }
  ];

  const LINE_EDGES = [
    [0, 3], [3, 1], [3, 2],
    [3, 4], [3, 5], [4, 6], [5, 6],
    [6, 7],
    [7, 8], [7, 9], [8, 9],
    [8, 10], [9, 11], [10, 11]
  ];

  const RESEARCH_FACTS = [
    {
      type: 'Bond chemistry',
      label: 'The love loop is real biology',
      text: 'Mutual gazing between dogs and humans can raise oxytocin in both, strengthening affiliative bonding in a feedback loop.',
      practice: 'Try 5 seconds of gentle eye contact (no staring). Look away first to keep it soft.',
      cite: 'Nagasawa et al., Science (2015)'
    },
    {
      type: 'Emotion sensing',
      label: 'Dogs can smell human stress',
      text: 'In controlled tests, dogs distinguished human stress odor from baseline odor using breath and sweat samples.',
      practice: 'When you are stressed, exhale slowly three times before calling your dog.',
      cite: 'Wilson et al., PLOS ONE (2022)'
    },
    {
      type: 'Emotional contagion',
      label: 'Mood shifts their decisions',
      text: 'Human stress odor can bias dogs toward more cautious choices in ambiguous situations, even without body language cues.',
      practice: 'On tense days, shorten training and raise rewards to keep confidence high.',
      cite: 'Parr-Cortes et al., Scientific Reports (2024)'
    },
    {
      type: 'Social emotions',
      label: 'Jealousy-like behavior shows up',
      text: 'When owners showed affection to a rival dog, many dogs displayed interruption behaviors more than with objects.',
      practice: 'Reward calm focus and give each pet short one-on-one sessions daily.',
      cite: 'Harris and Prouvost, PLOS ONE (2014)'
    },
    {
      type: 'Bond chemistry',
      label: 'Oxytocin depends on context',
      text: 'Oxytocin amplifies social salience. In secure bonds it deepens warmth; in tense contexts it can heighten vigilance.',
      practice: 'If your dog is anxious, prioritize predictability before adding new challenges.',
      cite: 'Marshall-Pescini et al. (2019)'
    }
  ];

  const PAWOLLIE_FACTS = [
    {
      type: 'Pawollie Sense',
      label: 'What this game represents',
      text: 'Pawollie Sense is built on one idea: pets study us deeply, and we can return the attention with intention.',
      practice: 'Pick one behavior today and ask: what need is this trying to meet?',
      cite: 'Pawollie Sense (brand insight)'
    },
    {
      type: 'Pawollie Sense',
      label: 'Bond over blame',
      text: 'Much of what looks like misbehavior is miscommunication. Behavior is information you can translate.',
      practice: 'Replace stop with a clear alternative cue and reward it.',
      cite: 'Pawollie Sense (brand principle)'
    },
    {
      type: 'Pawollie Sense',
      label: 'Memorials are love with a timeline',
      text: 'Keepsakes are about preserving a bond that still shapes you, not about staying in sadness.',
      practice: 'Write one sentence: My pet taught me ___. Keep it nearby.',
      cite: 'Pawollie Sense (brand message)'
    }
  ];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildFactDeck() {
    const deck = [];
    for (const fact of RESEARCH_FACTS) {
      deck.push(fact, fact);
    }
    for (const fact of PAWOLLIE_FACTS) {
      deck.push(fact);
    }
    return shuffle([...deck]);
  }

  let clickedCount = 0;
  let stars = [];
  let deck = buildFactDeck();
  let deckPos = 0;

  function setProgress() {
    progress.textContent = `${clickedCount} / ${STAR_POINTS.length}`;
  }

  function nextFact() {
    if (deckPos >= deck.length) {
      deck = buildFactDeck();
      deckPos = 0;
    }

    const fact = deck[deckPos];
    deckPos += 1;

    factLabel.textContent = fact.label;
    factText.textContent = fact.text;
    practiceText.textContent = fact.practice || 'Notice one new detail in your pet\'s body language today.';
    factType.textContent = fact.type;
    factIndex.textContent = `Fact ${deckPos} of ${deck.length}`;
  }

  function buildStars() {
    sky.querySelectorAll('.star').forEach((star) => star.remove());
    stars = [];

    STAR_POINTS.forEach((point, idx) => {
      const el = document.createElement('div');
      el.className = 'star';
      el.dataset.idx = String(idx);
      el.style.left = `${point.x}%`;
      el.style.top = `${point.y}%`;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Star ${idx + 1}`);
      el.addEventListener('click', () => onStarClick(idx));
      sky.appendChild(el);
      stars.push(el);
    });
  }

  function buildLines() {
    linesSvg.innerHTML = '';

    const pts = STAR_POINTS.map((point) => ({
      x: 1000 * (point.x / 100),
      y: 700 * (point.y / 100)
    }));

    LINE_EDGES.forEach(([a, b], idx) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pts[a].x);
      line.setAttribute('y1', pts[a].y);
      line.setAttribute('x2', pts[b].x);
      line.setAttribute('y2', pts[b].y);
      line.setAttribute('class', 'line');
      line.dataset.edge = String(idx);
      linesSvg.appendChild(line);
    });
  }

  function revealLinesUpToStar(count) {
    const edgesToShow = Math.min(
      LINE_EDGES.length,
      Math.floor((count / STAR_POINTS.length) * LINE_EDGES.length)
    );

    linesSvg.querySelectorAll('.line').forEach((line, idx) => {
      line.classList.toggle('on', idx < edgesToShow);
    });
  }

  function onStarClick(idx) {
    const el = stars[idx];
    if (!el || el.classList.contains('clicked')) return;

    el.classList.add('clicked');
    clickedCount += 1;
    setProgress();
    revealLinesUpToStar(clickedCount);
    nextFact();

    if (clickedCount >= STAR_POINTS.length) {
      linesSvg.querySelectorAll('.line').forEach((line) => line.classList.add('on'));
      complete.classList.add('on');
    }
  }

  function resetGame(options) {
    const shouldShuffle = options && options.reshuffleFacts;
    clickedCount = 0;
    setProgress();
    complete.classList.remove('on');
    stars.forEach((star) => star.classList.remove('clicked'));
    revealLinesUpToStar(0);

    if (shouldShuffle) {
      deck = buildFactDeck();
      deckPos = 0;
    }

    factLabel.textContent = 'Click a star to begin';
    factText.textContent = 'Each click places a star into the constellation and unlocks a new insight.';
    factType.textContent = '-';
    factIndex.textContent = '-';
    practiceText.textContent = 'Try a 3 second soft gaze at your pet, then blink slowly. Notice how their body loosens or leans in.';
  }

  if (btnReset) btnReset.addEventListener('click', () => resetGame());
  if (btnShuffle) btnShuffle.addEventListener('click', () => resetGame({ reshuffleFacts: true }));
  if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => resetGame({ reshuffleFacts: true }));
  if (btnClose) btnClose.addEventListener('click', () => complete.classList.remove('on'));

  buildLines();
  buildStars();
  resetGame();
}

window.pawollieInitCommunityGame = initCommunityGame;
window.addEventListener('load', initCommunityGame);
