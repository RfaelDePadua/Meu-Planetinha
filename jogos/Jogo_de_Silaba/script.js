(function () {
  'use strict';

  const GAME_ID = 'jogo-de-silaba';
  const W = 960;
  const H = 540;
  const LANES = [226, 338, 450];
  const ROUND_TOTAL = 10;
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const ui = {
    startScreen: document.getElementById('start-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    resultScreen: document.getElementById('result-screen'),
    start: document.getElementById('start-btn'),
    resume: document.getElementById('resume-btn'),
    replay: document.getElementById('replay-btn'),
    pause: document.getElementById('pause-btn'),
    sound: document.getElementById('sound-btn'),
    up: document.getElementById('up-btn'),
    down: document.getElementById('down-btn'),
    announcer: document.getElementById('announcer')
  };

  const WORDS = [
    { icon: '🏠', shown: 'CA__', answer: 'SA', options: ['SA', 'SO', 'TA'], word: 'CASA' },
    { icon: '🐈', shown: 'GA__', answer: 'TO', options: ['DO', 'TO', 'PO'], word: 'GATO' },
    { icon: '🐸', shown: 'SA__', answer: 'PO', options: ['PA', 'BO', 'PO'], word: 'SAPO' },
    { icon: '⚽', shown: 'BO__', answer: 'LA', options: ['MA', 'LA', 'RA'], word: 'BOLA' },
    { icon: '🐄', shown: 'VA__', answer: 'CA', options: ['CA', 'GA', 'TA'], word: 'VACA' },
    { icon: '🍰', shown: 'BO__', answer: 'LO', options: ['NO', 'LO', 'RO'], word: 'BOLO' },
    { icon: '🦆', shown: 'PA__', answer: 'TO', options: ['CO', 'DO', 'TO'], word: 'PATO' },
    { icon: '🛏️', shown: 'CA__', answer: 'MA', options: ['NA', 'MA', 'LA'], word: 'CAMA' },
    { icon: '🐀', shown: 'RA__', answer: 'TO', options: ['TO', 'DO', 'GO'], word: 'RATO' },
    { icon: '🧳', shown: 'MA__', answer: 'LA', options: ['RA', 'TA', 'LA'], word: 'MALA' },
    { icon: '🎲', shown: 'DA__', answer: 'DO', options: ['DO', 'TO', 'BO'], word: 'DADO' },
    { icon: '🦭', shown: 'FO__', answer: 'CA', options: ['TA', 'CA', 'SA'], word: 'FOCA' },
    { icon: '🦁', shown: 'LE__', answer: 'ÃO', options: ['ÃO', 'OU', 'EU'], word: 'LEÃO' },
    { icon: '🌙', shown: 'LU__', answer: 'A', options: ['E', 'O', 'A'], word: 'LUA' },
    { icon: '🍇', shown: 'U__', answer: 'VA', options: ['MA', 'VA', 'LA'], word: 'UVA' },
    { icon: '🤖', shown: 'RO__', answer: 'BÔ', options: ['BÔ', 'BO', 'PÔ'], word: 'ROBÔ' }
  ];

  let state = 'menu';
  let paused = false;
  let muted = false;
  let round = 0;
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let combo = 0;
  let bestCombo = 0;
  let selectedLane = 1;
  let playerY = LANES[selectedLane];
  let gateX = W + 180;
  let question = null;
  let deck = [];
  let lastTime = performance.now();
  let feedback = null;
  let particles = [];
  let stars = [];
  let backgroundOffset = 0;
  let audioContext = null;

  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function prepareDeck() {
    deck = shuffle(WORDS).slice(0, ROUND_TOTAL).map((item) => ({ ...item, options: shuffle(item.options) }));
  }

  function announce(message) {
    ui.announcer.textContent = '';
    window.setTimeout(() => { ui.announcer.textContent = message; }, 20);
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    if (audioContext && audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  }

  function tone(frequency, duration, delay) {
    if (muted) return;
    ensureAudio();
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = audioContext.currentTime + (delay || 0);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function playCorrect() {
    tone(523, 0.16, 0);
    tone(659, 0.18, 0.1);
    tone(784, 0.22, 0.2);
  }

  function playWrong() {
    tone(220, 0.18, 0);
    tone(165, 0.25, 0.12);
  }

  function startGame() {
    ensureAudio();
    state = 'playing';
    paused = false;
    round = 0;
    score = 0;
    correct = 0;
    incorrect = 0;
    combo = 0;
    bestCombo = 0;
    selectedLane = 1;
    playerY = LANES[1];
    feedback = null;
    particles = [];
    prepareDeck();
    ui.startScreen.hidden = true;
    ui.pauseScreen.hidden = true;
    ui.resultScreen.hidden = true;
    ui.pause.textContent = 'Ⅱ';
    nextQuestion();
    canvas.focus();
  }

  function nextQuestion() {
    if (round >= ROUND_TOTAL) {
      finishGame();
      return;
    }
    question = deck[round];
    gateX = W + 160;
    feedback = null;
    announce(`Complete ${question.shown}. Escolha entre ${question.options.join(', ')}.`);
  }

  function chooseLane(direction) {
    if (state !== 'playing' || paused || feedback) return;
    selectedLane = Math.max(0, Math.min(LANES.length - 1, selectedLane + direction));
    tone(330 + selectedLane * 50, 0.08, 0);
    announce(`Trilha ${selectedLane + 1}: ${question.options[selectedLane]}`);
  }

  function evaluateChoice() {
    const chosen = question.options[selectedLane];
    const isCorrect = chosen === question.answer;
    if (isCorrect) {
      correct += 1;
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      score += 100 + Math.min(combo - 1, 5) * 20;
      feedback = { good: true, text: `${question.word}!`, timer: 1.35 };
      burst(222, playerY - 10, ['#ffe66d', '#67e8f9', '#f9a8d4']);
      playCorrect();
      announce(`Muito bem! ${question.word}.`);
    } else {
      incorrect += 1;
      combo = 0;
      feedback = { good: false, text: `${question.shown.replace('__', question.answer)} usa ${question.answer}`, timer: 2.05 };
      burst(222, playerY - 10, ['#fda4af', '#c4b5fd']);
      playWrong();
      announce(`Quase! ${question.word} usa a sílaba ${question.answer}.`);
    }
    round += 1;
  }

  function finishGame() {
    state = 'result';
    const ratio = correct / ROUND_TOTAL;
    document.getElementById('result-title').textContent = ratio === 1 ? 'Percurso perfeito!' : ratio >= 0.7 ? 'Mandou muito bem!' : 'Boa aventura!';
    document.getElementById('result-message').textContent = ratio >= 0.7
      ? 'As palavras de Letrion voltaram a brilhar.'
      : 'Cada tentativa fortalece seu poder das palavras. Vamos outra vez?';
    document.getElementById('result-score').textContent = String(score);
    document.getElementById('result-correct').textContent = `${correct}/${ROUND_TOTAL}`;
    document.getElementById('result-combo').textContent = String(bestCombo);
    ui.resultScreen.hidden = false;
    window.parent.postMessage({
      source: 'meu-planetinha-game',
      type: 'game-result',
      gameId: GAME_ID,
      payload: { score, correct, incorrect, bestCombo, completed: true }
    }, '*');
  }

  function setPaused(value) {
    if (state !== 'playing') return;
    paused = Boolean(value);
    ui.pauseScreen.hidden = !paused;
    ui.pause.textContent = paused ? '▶' : 'Ⅱ';
    ui.pause.setAttribute('aria-label', paused ? 'Continuar' : 'Pausar');
    if (!paused) {
      lastTime = performance.now();
      canvas.focus();
    }
  }

  function setMuted(value) {
    muted = Boolean(value);
    ui.sound.textContent = muted ? '🔇' : '🔊';
    ui.sound.setAttribute('aria-label', muted ? 'Ativar som' : 'Desativar som');
  }

  function burst(x, y, colors) {
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 170;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 0.75 + Math.random() * 0.45,
        size: 4 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawBackground(time) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#160f3d');
    sky.addColorStop(0.62, '#3b2473');
    sky.addColorStop(1, '#171038');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.65;
    for (const star of stars) {
      const x = (star.x - backgroundOffset * star.depth + W * 2) % W;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(103,232,249,.12)';
    ctx.beginPath();
    ctx.arc(765, 118, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(103,232,249,.35)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(765, 118, 112, 25, -0.22, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 7; i++) {
      const x = ((i * 190 - backgroundOffset * 0.35) % 1330) - 140;
      const height = 45 + (i % 3) * 22;
      ctx.fillStyle = i % 2 ? '#2c1b59' : '#25164e';
      roundRect(x, 478 - height, 96, height + 70, 12);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,230,109,.28)';
      for (let w = 0; w < 3; w++) ctx.fillRect(x + 15 + w * 25, 458 - height, 12, 18);
    }

    LANES.forEach((laneY, index) => {
      ctx.strokeStyle = index === selectedLane ? 'rgba(103,232,249,.52)' : 'rgba(167,139,250,.22)';
      ctx.lineWidth = index === selectedLane ? 8 : 5;
      ctx.setLineDash([42, 18]);
      ctx.lineDashOffset = -backgroundOffset * 1.8;
      ctx.beginPath();
      ctx.moveTo(45, laneY + 34);
      ctx.lineTo(W + 30, laneY + 34);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.045)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 310 - backgroundOffset * 0.65) % 1300) - 160;
      ctx.font = '900 92px system-ui';
      ctx.fillText(['A', 'B', 'S', 'L'][i], x, 205 + (i % 2) * 175 + Math.sin(time * .001 + i) * 10);
    }
  }

  function drawHud() {
    ctx.fillStyle = 'rgba(22,15,61,.9)';
    roundRect(22, 18, 165, 56, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(167,139,250,.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffe66d';
    ctx.font = '900 26px system-ui';
    ctx.fillText(`★ ${score}`, 40, 55);
    ctx.fillStyle = 'rgba(22,15,61,.9)';
    roundRect(203, 18, 118, 56, 18);
    ctx.fill();
    ctx.fillStyle = '#67e8f9';
    ctx.font = '900 18px system-ui';
    ctx.fillText(`${Math.min(round + 1, ROUND_TOTAL)}/${ROUND_TOTAL}`, 231, 52);
    if (combo >= 2) {
      ctx.fillStyle = '#f9a8d4';
      ctx.font = '900 18px system-ui';
      ctx.fillText(`COMBO ×${combo}`, 342, 52);
    }
    if (!question || state !== 'playing') return;
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    roundRect(323, 88, 314, 96, 24);
    ctx.fill();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#3b2473';
    ctx.font = '42px system-ui';
    ctx.fillText(question.icon, 346, 150);
    ctx.font = '950 38px system-ui';
    ctx.fillText(question.shown, 421, 148);
  }

  function drawPlayer(time) {
    const x = 165;
    const y = playerY + Math.sin(time * 0.01) * 3;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(103,232,249,.28)';
    ctx.beginPath();
    ctx.ellipse(0, 39, 44, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, 24);
    ctx.lineTo(-22, 42 + Math.sin(time * .02) * 5);
    ctx.moveTo(14, 24);
    ctx.lineTo(28, 41 - Math.sin(time * .02) * 5);
    ctx.stroke();
    ctx.fillStyle = '#f5f3ff';
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = '#33205f';
    roundRect(-25, -15, 50, 28, 13);
    ctx.fill();
    ctx.fillStyle = '#67e8f9';
    ctx.beginPath();
    ctx.arc(-10, -2, 5, 0, Math.PI * 2);
    ctx.arc(10, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    roundRect(-11, 17, 22, 8, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawGates() {
    if (!question || state !== 'playing') return;
    question.options.forEach((option, index) => {
      const y = LANES[index] - 44;
      const active = index === selectedLane;
      ctx.fillStyle = active ? '#ffe66d' : '#f5f3ff';
      roundRect(gateX, y, 132, 88, 22);
      ctx.fill();
      ctx.strokeStyle = active ? '#f59e0b' : '#a78bfa';
      ctx.lineWidth = active ? 6 : 4;
      ctx.stroke();
      ctx.fillStyle = '#35205f';
      ctx.font = '950 31px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(option, gateX + 66, y + 55);
      ctx.textAlign = 'left';
    });
  }

  function drawFeedback() {
    if (!feedback) return;
    const width = feedback.good ? 350 : 465;
    const x = (W - width) / 2;
    ctx.fillStyle = feedback.good ? 'rgba(20,113,103,.96)' : 'rgba(105,55,122,.97)';
    roundRect(x, 210, width, 100, 24);
    ctx.fill();
    ctx.strokeStyle = feedback.good ? '#67e8f9' : '#f9a8d4';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '950 32px system-ui';
    ctx.fillText(feedback.good ? `★ ${feedback.text}` : feedback.text, W / 2, 270);
    ctx.textAlign = 'left';
  }

  function update(dt) {
    particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt;
    });
    particles = particles.filter((p) => p.life > 0);
    if (state !== 'playing' || paused) return;
    backgroundOffset += dt * (feedback ? 55 : 120 + round * 4);
    playerY += (LANES[selectedLane] - playerY) * Math.min(1, dt * 12);
    if (feedback) {
      feedback.timer -= dt;
      if (feedback.timer <= 0) nextQuestion();
      return;
    }
    gateX -= dt * (205 + round * 8);
    if (gateX <= 220) evaluateChoice();
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  function frame(time) {
    const dt = Math.min(0.034, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    drawBackground(time);
    drawGates();
    drawPlayer(time);
    drawParticles();
    drawHud();
    drawFeedback();
    requestAnimationFrame(frame);
  }

  function initStars() {
    const colors = ['#ffffff', '#67e8f9', '#f9a8d4', '#ffe66d'];
    stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.8,
      size: 0.7 + Math.random() * 2.1,
      depth: 0.2 + Math.random() * 0.7,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
      event.preventDefault();
      chooseLane(-1);
    } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
      event.preventDefault();
      chooseLane(1);
    } else if (event.key === 'Escape' && state === 'playing') {
      setPaused(!paused);
    }
  });

  ui.start.addEventListener('click', startGame);
  ui.replay.addEventListener('click', startGame);
  ui.resume.addEventListener('click', () => setPaused(false));
  ui.pause.addEventListener('click', () => setPaused(!paused));
  ui.sound.addEventListener('click', () => setMuted(!muted));
  ui.up.addEventListener('pointerdown', (event) => { event.preventDefault(); chooseLane(-1); });
  ui.down.addEventListener('pointerdown', (event) => { event.preventDefault(); chooseLane(1); });
  canvas.addEventListener('pointerdown', (event) => {
    if (state !== 'playing' || paused) return;
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    if (y < 0.45) chooseLane(-1);
    else if (y > 0.55) chooseLane(1);
  });

  window.addEventListener('message', (event) => {
    const data = event.data;
    const type = typeof data === 'string' ? data : data && data.type;
    if (type === 'pause') setPaused(true);
    else if (type === 'resume') setPaused(false);
    else if (type === 'mute') setMuted(true);
    else if (type === 'unmute') setMuted(false);
    else if (type === 'restart') startGame();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing' && !paused) setPaused(true);
  });

  initStars();
  requestAnimationFrame(frame);
  window.parent.postMessage('game-ready', '*');
})();
