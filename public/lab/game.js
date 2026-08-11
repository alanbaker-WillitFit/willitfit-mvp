(() => {
  "use strict";

  const LEVEL_COUNT = 20;
  const GATES_PER_LEVEL = 2;
  const STORAGE = {
    best: "willitfly.bestScore",
    localBoard: "willitfly.localLeaderboard",
    theme: "willitfly.theme"
  };
  const CRAFTS = {
    4: "assets/flight/craft-04.webp",
    6: "assets/flight/craft-06.webp",
    2: "assets/flight/craft-02.webp",
    1: "assets/flight/craft-01.webp"
  };

  localStorage.removeItem("willitfly.pendingScores");
  localStorage.removeItem("willitfly.profile");

  const screens = {
    start: document.getElementById("start-screen"),
    game: document.getElementById("game-screen"),
    result: document.getElementById("result-screen")
  };
  const game = document.getElementById("game");
  const playerEl = document.getElementById("player");
  const playerSprite = document.getElementById("player-sprite");
  const playerAccessory = document.getElementById("player-accessory");
  const seasonLayer = document.getElementById("season-layer");
  const levelLabel = document.getElementById("level-label");
  const gateProgress = document.getElementById("gate-progress");
  const itemCount = document.getElementById("item-count");
  const scoreLabel = document.getElementById("score-label");
  const message = document.getElementById("message");
  const startButton = document.getElementById("start-button");
  const tapButton = document.getElementById("tap-button");
  const againButton = document.getElementById("again-button");
  const resultIcon = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const resultLevel = document.getElementById("result-level");
  const resultScore = document.getElementById("result-score");
  const resultBest = document.getElementById("result-best");
  const personalBest = document.getElementById("personal-best");
  const startLocalBest = document.getElementById("start-local-best");
  const leaderboardButton = document.getElementById("leaderboard-button");
  const leaderboard = document.getElementById("leaderboard");
  const themeButton = document.getElementById("theme-button");

  let running = false;
  let y = 0;
  let velocity = 0;
  const gravity = 0.34;
  const flap = -6.8;
  let lastTime = 0;
  let obstacleTimer = 0;
  let level = 1;
  let gatesThisLevel = 0;
  let score = 0;
  let tokens = 0;
  let totalGatePasses = 0;
  let obstacles = [];
  let collectibles = [];
  let animationId = null;
  let activeThemeId = localStorage.getItem(STORAGE.theme) ||
    window.getAutomaticWillItFlyTheme?.() || "default";
  let activeTheme = window.WILLITFLY_THEMES[activeThemeId] || window.WILLITFLY_THEMES.default;

  function safeJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function padScore(value) {
    return String(Math.max(0, Math.round(value))).padStart(4, "0");
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => el.classList.toggle("active", key === name));
  }

  function craftForLevel(value) {
    if (value <= 4) return 4;
    if (value <= 9) return 6;
    if (value <= 14) return 2;
    return 1;
  }

  function levelConfig(value) {
    const safeLevel = Math.max(1, Math.min(LEVEL_COUNT, Math.floor(value)));
    const progress = (safeLevel - 1) / (LEVEL_COUNT - 1);
    return {
      level: safeLevel,
      craftId: craftForLevel(safeLevel),
      speed: 2.75 + progress * 2.25,
      gateGapRatio: 0.34 - progress * 0.13,
      movingGate: safeLevel >= 5,
      movementAmplitudeRatio: safeLevel < 5 ? 0 : 0.035 + progress * 0.095,
      movementRate: safeLevel < 5 ? 0 : 0.65 + progress * 1.1,
      collectibleOffsetRatio: safeLevel <= 4 ? 0 : 0.015 + progress * 0.105
    };
  }

  function updateHud() {
    levelLabel.textContent = `${String(level).padStart(2, "0")} / ${LEVEL_COUNT}`;
    gateProgress.textContent = `${gatesThisLevel} / ${GATES_PER_LEVEL}`;
    itemCount.textContent = String(tokens);
    scoreLabel.textContent = padScore(score);
    playerSprite.src = CRAFTS[craftForLevel(level)];
  }

  function flash(text) {
    message.classList.remove("show");
    message.textContent = text;
    void message.offsetWidth;
    message.classList.add("show");
  }

  function applyTheme() {
    document.body.classList.remove(
      "theme-default", "theme-summer", "theme-christmas", "theme-easter", "theme-fringe"
    );
    document.body.classList.add(activeTheme.skyClass || "theme-default");
    playerAccessory.textContent = activeTheme.accessory || "";
    themeButton.textContent = activeTheme.particles || "☀️";
    themeButton.title = `Theme: ${activeTheme.label}`;
    renderSeasonParticles();
  }

  function renderSeasonParticles() {
    seasonLayer.innerHTML = "";
    const particle = activeTheme.particles;
    if (!particle || activeTheme.id === "default" || activeTheme.id === "summer") return;
    for (let i = 0; i < 12; i += 1) {
      const el = document.createElement("span");
      el.className = "season-particle";
      el.textContent = particle;
      el.style.left = `${Math.random() * 100}%`;
      el.style.animationDuration = `${5 + Math.random() * 6}s`;
      el.style.animationDelay = `${-Math.random() * 7}s`;
      el.style.fontSize = `${14 + Math.random() * 12}px`;
      seasonLayer.appendChild(el);
    }
  }

  function cycleTheme() {
    const order = window.WILLITFLY_THEME_ORDER;
    const current = Math.max(0, order.indexOf(activeThemeId));
    activeThemeId = order[(current + 1) % order.length];
    activeTheme = window.WILLITFLY_THEMES[activeThemeId];
    localStorage.setItem(STORAGE.theme, activeThemeId);
    applyTheme();
    flash(activeTheme.label.toUpperCase());
  }

  function clearWorld() {
    obstacles.forEach((o) => { o.top.remove(); o.bottom.remove(); });
    collectibles.forEach((c) => c.el.remove());
    obstacles = [];
    collectibles = [];
  }

  function resetGame() {
    cancelAnimationFrame(animationId);
    clearWorld();
    level = 1;
    gatesThisLevel = 0;
    score = 0;
    tokens = 0;
    totalGatePasses = 0;
    y = game.clientHeight * 0.45;
    velocity = 0;
    obstacleTimer = 0;
    lastTime = performance.now();
    playerEl.style.top = `${y}px`;
    playerEl.style.transform = "translate(-50%,-50%) rotate(0deg)";
    updateHud();
  }

  function startGame() {
    showScreen("game");
    requestAnimationFrame(() => {
      resetGame();
      running = true;
      flash("LEVEL 1");
      animationId = requestAnimationFrame(loop);
    });
  }

  function flapPlayer() {
    if (running) velocity = flap;
  }

  function createCollectible(x, yPos) {
    const el = document.createElement("div");
    el.className = "collectible";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="token-case"><span class="token-check">✓</span></span>';
    el.style.left = `${x}px`;
    el.style.top = `${yPos}px`;
    game.appendChild(el);
    collectibles.push({ x, y: yPos, el, taken: false });
  }

  function makeObstacle(now) {
    const config = levelConfig(level);
    const h = game.clientHeight;
    const gap = Math.max(118, Math.min(230, h * config.gateGapRatio));
    const margin = Math.max(58, h * 0.1);
    const available = Math.max(20, h - gap - margin * 2);
    const baseGapY = margin + Math.random() * available;
    const x = game.clientWidth + 90;
    const top = document.createElement("div");
    const bottom = document.createElement("div");
    top.className = "obstacle top";
    bottom.className = "obstacle bottom";
    top.innerHTML = `<span>GATE ${String(level).padStart(2, "0")}</span>`;
    bottom.innerHTML = `<span>GATE ${String(level).padStart(2, "0")}</span>`;
    game.append(top, bottom);

    const obstacle = {
      x,
      width: 92,
      baseGapY,
      gapY: baseGapY,
      gap,
      margin,
      top,
      bottom,
      passed: false,
      level,
      moving: config.movingGate,
      amplitude: h * config.movementAmplitudeRatio,
      rate: config.movementRate,
      phase: Math.random() * Math.PI * 2,
      bornAt: now
    };
    obstacles.push(obstacle);
    positionObstacle(obstacle, now);

    const direction = gatesThisLevel % 2 === 0 ? -1 : 1;
    const offset = h * config.collectibleOffsetRatio * direction;
    const tokenY = Math.max(margin + 24, Math.min(h - margin - 24, baseGapY + gap / 2 + offset));
    createCollectible(x + 46, tokenY);
  }

  function positionObstacle(o, now) {
    const h = game.clientHeight;
    let gapY = o.baseGapY;
    if (o.moving) {
      const ageSeconds = Math.max(0, now - o.bornAt) / 1000;
      gapY += Math.sin(ageSeconds * o.rate * Math.PI * 2 + o.phase) * o.amplitude;
    }
    gapY = Math.max(o.margin, Math.min(h - o.gap - o.margin, gapY));
    o.gapY = gapY;
    o.top.style.left = `${o.x}px`;
    o.top.style.top = "0";
    o.top.style.height = `${gapY}px`;
    o.bottom.style.left = `${o.x}px`;
    o.bottom.style.top = `${gapY + o.gap}px`;
    o.bottom.style.height = `${Math.max(0, h - gapY - o.gap)}px`;
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function saveRun(run) {
    const best = Number(localStorage.getItem(STORAGE.best) || 0);
    const isBest = run.score > best;
    if (isBest) localStorage.setItem(STORAGE.best, String(run.score));
    const board = safeJSON(STORAGE.localBoard, []);
    board.push({ username: "Guest", score: run.score, level: run.level, theme: run.theme, createdAt: run.createdAt });
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE.localBoard, JSON.stringify(board.slice(0, 10)));
    return { best: Math.max(best, run.score), isBest };
  }

  function finish(success, text) {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationId);
    const run = {
      score,
      level,
      success,
      gatesPassed: totalGatePasses,
      tokens,
      theme: activeTheme.id,
      routeVersion: "RC1-20-level",
      createdAt: new Date().toISOString()
    };
    const saved = saveRun(run);
    resultIcon.textContent = success ? "✅" : "✈️";
    resultTitle.textContent = success ? "FLIGHT COMPLETE" : "FLIGHT ENDED";
    resultText.textContent = text;
    resultLevel.textContent = success ? "20 / 20 levels completed" : `Reached level ${level} of ${LEVEL_COUNT}`;
    resultScore.textContent = padScore(score);
    resultBest.textContent = padScore(saved.best);
    personalBest.textContent = saved.isBest ? "New personal best!" : "";
    renderLeaderboard();
    updateStartBest();
    showScreen("result");
    resultTitle.focus();
  }

  function completeLevel() {
    score += 150;
    if (level >= LEVEL_COUNT) {
      finish(true, `All ${LEVEL_COUNT} levels cleared. ${tokens} WillIt tokens collected.`);
      return;
    }
    level += 1;
    gatesThisLevel = 0;
    obstacleTimer = 0;
    updateHud();
    flash(`LEVEL ${level}`);
  }

  function renderLeaderboard() {
    const board = safeJSON(STORAGE.localBoard, []);
    leaderboard.innerHTML = board.length
      ? board.slice(0, 5).map((entry, index) => `
          <div class="leaderboard-row">
            <strong>${index + 1}</strong>
            <span>Guest<br><small>Level ${Number(entry.level || 1)} · ${escapeHTML(entry.theme || "default")}</small></span>
            <strong>${padScore(entry.score)}</strong>
          </div>`).join("")
      : "<p>No scores yet.</p>";
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function updateStartBest() {
    const best = Number(localStorage.getItem(STORAGE.best) || 0);
    startLocalBest.textContent = best ? `Device best: ${padScore(best)}` : "";
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(32, now - lastTime);
    lastTime = now;
    const config = levelConfig(level);
    const frameScale = dt / 16.67;

    velocity += gravity * frameScale;
    y += velocity * frameScale;
    playerEl.style.top = `${y}px`;
    playerEl.style.transform = `translate(-50%,-50%) rotate(${Math.max(-18, Math.min(38, velocity * 5))}deg)`;

    obstacleTimer += dt;
    if (obstacleTimer > 1650) {
      obstacleTimer = 0;
      makeObstacle(now);
    }

    const playerRect = playerEl.getBoundingClientRect();
    for (const o of obstacles) {
      o.x -= config.speed * frameScale;
      positionObstacle(o, now);
      if (rectsOverlap(playerRect, o.top.getBoundingClientRect()) || rectsOverlap(playerRect, o.bottom.getBoundingClientRect())) {
        finish(false, `Gate collision on level ${level}.`);
        return;
      }
      if (!o.passed && o.x + o.width < game.clientWidth * 0.17) {
        o.passed = true;
        totalGatePasses += 1;
        gatesThisLevel += 1;
        score += 50;
        updateHud();
        if (gatesThisLevel >= GATES_PER_LEVEL) {
          completeLevel();
          if (!running) return;
        }
      }
    }

    for (const c of collectibles) {
      c.x -= config.speed * frameScale;
      c.el.style.left = `${c.x}px`;
      if (!c.taken && rectsOverlap(playerRect, c.el.getBoundingClientRect())) {
        c.taken = true;
        tokens += 1;
        score += 100;
        c.el.remove();
        updateHud();
        flash("+ TOKEN");
      }
    }

    obstacles = obstacles.filter((o) => {
      if (o.x < -170) {
        o.top.remove(); o.bottom.remove(); return false;
      }
      return true;
    });
    collectibles = collectibles.filter((c) => {
      if (c.taken) return false;
      if (c.x < -90) { c.el.remove(); return false; }
      return true;
    });

    if (y < -20 || y > game.clientHeight + 20) {
      finish(false, y < 0 ? "You flew above the route." : "You dropped below the route.");
      return;
    }
    animationId = requestAnimationFrame(loop);
  }

  startButton.addEventListener("click", startGame);
  againButton.addEventListener("click", startGame);
  tapButton.addEventListener("pointerdown", (event) => { event.preventDefault(); flapPlayer(); });
  game.addEventListener("pointerdown", (event) => { event.preventDefault(); flapPlayer(); });
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp"].includes(event.code)) { event.preventDefault(); flapPlayer(); }
  });
  leaderboardButton.addEventListener("click", () => leaderboard.classList.toggle("hidden"));
  themeButton.addEventListener("click", cycleTheme);

  applyTheme();
  renderLeaderboard();
  updateStartBest();
})();
