(() => {
  "use strict";

  const LEVEL_COUNT = 20;
  const GATES_PER_LEVEL = 2;
  const STORAGE = {
    best: "willitfly.bestScore",
    localBoard: "willitfly.localLeaderboard",
    theme: "willitfly.theme"
  };

  const CRAFT_FALLBACKS = {
    4: "assets/flight/craft-04.webp",
    6: "assets/flight/craft-06.webp",
    2: "assets/flight/craft-02.webp",
    1: "assets/flight/craft-01.webp"
  };
  const CRAFTS = {
    ...CRAFT_FALLBACKS,
    ...(window.WILLITFLY_APPROVED_CRAFT_ASSETS || {})
  };

  // Loop 3 control contract: player controls remain consistent across all 20 levels.
  // Difficulty is created by the route, not by making the aircraft harder to control.
  const CONTROL = Object.freeze({
    gravity: 0.32,
    flap: -6.55,
    maxRise: -8.2,
    maxFall: 8.2,
    rotationUp: -14,
    rotationDown: 30
  });

  // Insets are percentages of the rendered sprite box. The transparent RC1 sprites
  // are consistently framed, so these produce a fair collision envelope around
  // the visible craft rather than treating transparent corners as solid aircraft.
  const CRAFT_HITBOX = Object.freeze({
    4: { left: 0.16, right: 0.10, top: 0.20, bottom: 0.20 },
    6: { left: 0.17, right: 0.11, top: 0.19, bottom: 0.19 },
    2: { left: 0.15, right: 0.10, top: 0.18, bottom: 0.18 },
    1: { left: 0.15, right: 0.09, top: 0.18, bottom: 0.18 }
  });

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
  let lastTime = 0;
  let obstacleTimer = 0;
  let level = 1;
  let gatesThisLevel = 0;
  let gatesSpawnedThisLevel = 0;
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
      gatePulseRatio: safeLevel < 5 ? 0 : 0.06 + progress * 0.12,
      collectibleOffsetRatio: safeLevel <= 4 ? 0 : 0.015 + progress * 0.105,
      spawnIntervalMs: 1650 - progress * 250
    };
  }

  function updateHud() {
    levelLabel.textContent = `${String(level).padStart(2, "0")} / ${LEVEL_COUNT}`;
    gateProgress.textContent = `${gatesThisLevel} / ${GATES_PER_LEVEL}`;
    itemCount.textContent = String(tokens);
    scoreLabel.textContent = padScore(score);
    const source = CRAFTS[craftForLevel(level)];
    if (playerSprite.src !== source) playerSprite.src = source;
  }

  function preloadCrafts() {
    [...new Set(Object.values(CRAFTS))].forEach((source) => {
      const image = new Image();
      image.src = source;
    });
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
    obstacles.forEach((obstacle) => {
      obstacle.top.remove();
      obstacle.bottom.remove();
    });
    collectibles.forEach((collectible) => collectible.el.remove());
    obstacles = [];
    collectibles = [];
  }

  function resetGame() {
    cancelAnimationFrame(animationId);
    clearWorld();
    level = 1;
    gatesThisLevel = 0;
    gatesSpawnedThisLevel = 0;
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
    if (running) velocity = CONTROL.flap;
  }

  function playerCollisionRect() {
    const rect = playerEl.getBoundingClientRect();
    const inset = CRAFT_HITBOX[craftForLevel(level)];
    return {
      left: rect.left + rect.width * inset.left,
      right: rect.right - rect.width * inset.right,
      top: rect.top + rect.height * inset.top,
      bottom: rect.bottom - rect.height * inset.bottom
    };
  }

  function createCollectible(obstacle, offset) {
    const el = document.createElement("div");
    el.className = "collectible";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="token-case"><span class="token-check">✓</span></span>';
    game.appendChild(el);
    const collectible = {
      obstacle,
      offset,
      x: obstacle.x + obstacle.width / 2,
      y: obstacle.gapY + obstacle.gap / 2,
      el,
      taken: false
    };
    collectibles.push(collectible);
    positionCollectible(collectible);
  }

  function positionCollectible(collectible) {
    if (collectible.taken) return;
    const obstacle = collectible.obstacle;
    const maxOffset = Math.max(0, obstacle.gap / 2 - 34);
    const safeOffset = Math.max(-maxOffset, Math.min(maxOffset, collectible.offset));
    collectible.x = obstacle.x + obstacle.width / 2;
    collectible.y = obstacle.gapY + obstacle.gap / 2 + safeOffset;
    collectible.el.style.left = `${collectible.x}px`;
    collectible.el.style.top = `${collectible.y}px`;
  }

  function makeObstacle(now) {
    const config = levelConfig(level);
    const h = game.clientHeight;
    const baseGap = Math.max(118, Math.min(230, h * config.gateGapRatio));
    const margin = Math.max(58, h * 0.1);
    const centerMin = margin + baseGap / 2;
    const centerMax = Math.max(centerMin, h - margin - baseGap / 2);
    const baseCenter = centerMin + Math.random() * Math.max(1, centerMax - centerMin);
    const x = game.clientWidth + 90;
    const width = window.matchMedia("(min-width: 700px)").matches ? 110 : 92;
    const top = document.createElement("div");
    const bottom = document.createElement("div");
    top.className = "obstacle top";
    bottom.className = "obstacle bottom";
    top.innerHTML = `<span>GATE ${String(level).padStart(2, "0")}</span>`;
    bottom.innerHTML = `<span>GATE ${String(level).padStart(2, "0")}</span>`;
    game.append(top, bottom);

    const obstacle = {
      x,
      width,
      baseCenter,
      gapY: baseCenter - baseGap / 2,
      baseGap,
      gap: baseGap,
      margin,
      top,
      bottom,
      passed: false,
      level,
      speed: config.speed,
      moving: config.movingGate,
      amplitude: h * config.movementAmplitudeRatio,
      rate: config.movementRate,
      gatePulseRatio: config.gatePulseRatio,
      phase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      bornAt: now
    };
    obstacles.push(obstacle);
    gatesSpawnedThisLevel += 1;
    positionObstacle(obstacle, now);

    const direction = gatesSpawnedThisLevel % 2 === 0 ? 1 : -1;
    const offset = h * config.collectibleOffsetRatio * direction;
    createCollectible(obstacle, offset);
  }

  function positionObstacle(obstacle, now) {
    const h = game.clientHeight;
    const ageSeconds = Math.max(0, now - obstacle.bornAt) / 1000;
    const movementWave = obstacle.moving
      ? Math.sin(ageSeconds * obstacle.rate * Math.PI * 2 + obstacle.phase)
      : 0;
    const pulseWave = obstacle.moving
      ? Math.sin(ageSeconds * obstacle.rate * Math.PI * 1.55 + obstacle.pulsePhase)
      : 0;
    const dynamicGap = Math.max(108, obstacle.baseGap * (1 + pulseWave * obstacle.gatePulseRatio));
    let center = obstacle.baseCenter + movementWave * obstacle.amplitude;
    center = Math.max(
      obstacle.margin + dynamicGap / 2,
      Math.min(h - obstacle.margin - dynamicGap / 2, center)
    );
    obstacle.gap = dynamicGap;
    obstacle.gapY = center - dynamicGap / 2;
    obstacle.top.style.left = `${obstacle.x}px`;
    obstacle.top.style.top = "0";
    obstacle.top.style.height = `${obstacle.gapY}px`;
    obstacle.bottom.style.left = `${obstacle.x}px`;
    obstacle.bottom.style.top = `${obstacle.gapY + obstacle.gap}px`;
    obstacle.bottom.style.height = `${Math.max(0, h - obstacle.gapY - obstacle.gap)}px`;
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function saveRun(run) {
    const best = Number(localStorage.getItem(STORAGE.best) || 0);
    const isBest = run.score > best;
    if (isBest) localStorage.setItem(STORAGE.best, String(run.score));
    const board = safeJSON(STORAGE.localBoard, []);
    board.push({
      username: "Guest",
      score: run.score,
      level: run.level,
      theme: run.theme,
      createdAt: run.createdAt
    });
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
      routeVersion: "RC1-20-level-loop3",
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
    const oldCraft = craftForLevel(level);
    level += 1;
    gatesThisLevel = 0;
    gatesSpawnedThisLevel = 0;
    obstacleTimer = 0;
    updateHud();
    flash(craftForLevel(level) !== oldCraft ? `LEVEL ${level} · NEW AIRCRAFT` : `LEVEL ${level}`);
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
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
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
    const frameScale = dt / 16.67;
    const config = levelConfig(level);

    velocity = Math.max(
      CONTROL.maxRise,
      Math.min(CONTROL.maxFall, velocity + CONTROL.gravity * frameScale)
    );
    y += velocity * frameScale;
    playerEl.style.top = `${y}px`;
    const rotation = Math.max(
      CONTROL.rotationUp,
      Math.min(CONTROL.rotationDown, velocity * 4.2)
    );
    playerEl.style.transform = `translate(-50%,-50%) rotate(${rotation}deg)`;

    obstacleTimer += dt;
    if (obstacleTimer > config.spawnIntervalMs && gatesSpawnedThisLevel < GATES_PER_LEVEL) {
      obstacleTimer = 0;
      makeObstacle(now);
    }

    const playerRect = playerCollisionRect();
    for (const obstacle of obstacles) {
      obstacle.x -= obstacle.speed * frameScale;
      positionObstacle(obstacle, now);
      if (
        rectsOverlap(playerRect, obstacle.top.getBoundingClientRect()) ||
        rectsOverlap(playerRect, obstacle.bottom.getBoundingClientRect())
      ) {
        finish(false, `Gate collision on level ${obstacle.level}.`);
        return;
      }
      if (!obstacle.passed && obstacle.x + obstacle.width < playerRect.left - game.getBoundingClientRect().left) {
        obstacle.passed = true;
        totalGatePasses += 1;
        if (obstacle.level === level) {
          gatesThisLevel += 1;
          score += 50;
          updateHud();
          if (gatesThisLevel >= GATES_PER_LEVEL) {
            completeLevel();
            if (!running) return;
          }
        }
      }
    }

    for (const collectible of collectibles) {
      if (collectible.taken) continue;
      positionCollectible(collectible);
      if (rectsOverlap(playerRect, collectible.el.getBoundingClientRect())) {
        collectible.taken = true;
        tokens += 1;
        score += 100;
        collectible.el.remove();
        updateHud();
        flash("+ TOKEN");
      }
    }

    obstacles = obstacles.filter((obstacle) => {
      if (obstacle.x < -170) {
        obstacle.top.remove();
        obstacle.bottom.remove();
        return false;
      }
      return true;
    });
    collectibles = collectibles.filter((collectible) => {
      if (collectible.taken) return false;
      if (collectible.obstacle.x < -90) {
        collectible.el.remove();
        return false;
      }
      return true;
    });

    const gameRect = game.getBoundingClientRect();
    if (playerRect.top < gameRect.top || playerRect.bottom > gameRect.bottom) {
      finish(false, playerRect.top < gameRect.top ? "You flew above the route." : "You dropped below the route.");
      return;
    }

    animationId = requestAnimationFrame(loop);
  }

  startButton.addEventListener("click", startGame);
  againButton.addEventListener("click", startGame);
  tapButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    flapPlayer();
  });
  game.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    flapPlayer();
  });
  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp"].includes(event.code)) {
      event.preventDefault();
      flapPlayer();
    }
  });
  leaderboardButton.addEventListener("click", () => leaderboard.classList.toggle("hidden"));
  themeButton.addEventListener("click", cycleTheme);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }

  preloadCrafts();
  applyTheme();
  renderLeaderboard();
  updateStartBest();
})();