
(() => {
  "use strict";

  const STORAGE = {
    best: "willitfly.bestScore",
    localBoard: "willitfly.localLeaderboard",
    theme: "willitfly.theme"
  };

  // Remove personal-data remnants created by the pre-certification prototype.
  localStorage.removeItem("willitfly.pendingScores");
  localStorage.removeItem("willitfly.profile");

  const screens = {
    start: document.getElementById("start-screen"),
    game: document.getElementById("game-screen"),
    result: document.getElementById("result-screen")
  };

  const game = document.getElementById("game");
  const playerEl = document.getElementById("player");
  const playerAccessory = document.getElementById("player-accessory");
  const seasonLayer = document.getElementById("season-layer");
  const stageLabel = document.getElementById("stage-label");
  const itemCount = document.getElementById("item-count");
  const scoreLabel = document.getElementById("score-label");
  const inventory = document.getElementById("inventory");
  const message = document.getElementById("message");
  const startButton = document.getElementById("start-button");
  const tapButton = document.getElementById("tap-button");
  const againButton = document.getElementById("again-button");
  const resultIcon = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");
  const resultText = document.getElementById("result-text");
  const resultScore = document.getElementById("result-score");
  const resultBest = document.getElementById("result-best");
  const personalBest = document.getElementById("personal-best");
  const startLocalBest = document.getElementById("start-local-best");
  const leaderboardButton = document.getElementById("leaderboard-button");
  const leaderboard = document.getElementById("leaderboard");
  const themeButton = document.getElementById("theme-button");

  const stages = [
    { label: "CHECK IN", item: { id: "passport", icon: "📘", name: "Passport" } },
    { label: "PASSPORT", item: { id: "security", icon: "🛂", name: "Passport control" } },
    { label: "SECURITY", item: { id: "boarding", icon: "🎫", name: "Boarding pass" } },
    { label: "BOARDING", item: null },
    { label: "GATE", item: null }
  ];

  const requiredItems = [
    { id: "passport", icon: "📘", name: "Passport" },
    { id: "security", icon: "🛂", name: "Passport control" },
    { id: "boarding", icon: "🎫", name: "Boarding pass" }
  ];

  let running = false;
  let y = 0;
  let velocity = 0;
  const gravity = 0.34;
  const flap = -6.8;
  let lastTime = 0;
  let obstacleTimer = 0;
  let stageIndex = 0;
  let collected = new Set();
  let obstacles = [];
  let collectibles = [];
  let animationId = null;
  let score = 0;
  let obstaclePasses = 0;
  let lastRun = null;
  let activeThemeId = localStorage.getItem(STORAGE.theme) ||
    window.getAutomaticWillItFlyTheme?.() || "default";
  let activeTheme = window.WILLITFLY_THEMES[activeThemeId] ||
    window.WILLITFLY_THEMES.default;

  function safeJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function padScore(value) {
    return String(Math.max(0, Math.round(value))).padStart(3, "0");
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) =>
      el.classList.toggle("active", key === name)
    );
  }

  function currentThemeIcon(item) {
    return activeTheme.collectibleSwap?.[item.id] || item.icon;
  }

  function updateInventory() {
    inventory.innerHTML = requiredItems.map(item =>
      `<span class="inv-item ${collected.has(item.id) ? "collected" : ""}" title="${item.name}">
        ${currentThemeIcon(item)}
      </span>`
    ).join("");
    itemCount.textContent = `${collected.size} / ${requiredItems.length}`;
  }

  function updateScore() {
    scoreLabel.textContent = padScore(score);
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
    updateInventory();
  }

  function renderSeasonParticles() {
    seasonLayer.innerHTML = "";
    const particle = activeTheme.particles;
    if (!particle || activeTheme.id === "default" || activeTheme.id === "summer") return;

    for (let i = 0; i < 12; i++) {
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

  function resetGame() {
    cancelAnimationFrame(animationId);
    obstacles.forEach(o => { o.top.remove(); o.bottom.remove(); });
    collectibles.forEach(c => c.el.remove());
    obstacles = [];
    collectibles = [];
    collected = new Set();
    stageIndex = 0;
    score = 0;
    obstaclePasses = 0;
    y = game.clientHeight * 0.45;
    velocity = 0;
    obstacleTimer = 0;
    lastTime = performance.now();
    stageLabel.textContent = stages[0].label;
    updateInventory();
    updateScore();
    playerEl.style.top = `${y}px`;
    playerEl.style.transform = "translate(-50%,-50%) rotate(0deg)";
  }

  function startGame() {
    showScreen("game");
    requestAnimationFrame(() => {
      resetGame();
      running = true;
      animationId = requestAnimationFrame(loop);
    });
  }

  function flapPlayer() {
    if (!running) return;
    velocity = flap;
  }

  function makeObstacle() {
    const h = game.clientHeight;
    const gap = Math.max(150, Math.min(205, h * 0.29));
    const margin = 80;
    const gapY = margin + Math.random() * Math.max(20, h - gap - margin * 2);
    const stage = stages[Math.min(stageIndex, stages.length - 1)];
    const x = game.clientWidth + 80;

    const top = document.createElement("div");
    top.className = "obstacle top";
    top.style.left = `${x}px`;
    top.style.top = "0";
    top.style.height = `${gapY}px`;
    top.innerHTML = `<span>${stage.label}</span>`;

    const bottom = document.createElement("div");
    bottom.className = "obstacle bottom";
    bottom.style.left = `${x}px`;
    bottom.style.top = `${gapY + gap}px`;
    bottom.style.height = `${Math.max(0, h - gapY - gap)}px`;
    bottom.innerHTML = `<span>${stage.label}</span>`;

    game.append(top, bottom);

    const obstacle = {
      x,
      width: top.offsetWidth || 92,
      gapY,
      gap,
      top,
      bottom,
      passed: false,
      stageIndex
    };
    obstacles.push(obstacle);

    if (stage.item && !collected.has(stage.item.id)) {
      const c = document.createElement("div");
      c.className = "collectible";
      c.textContent = currentThemeIcon(stage.item);
      c.style.left = `${x + 46}px`;
      c.style.top = `${gapY + gap / 2}px`;
      game.appendChild(c);
      collectibles.push({
        x: x + 46,
        y: gapY + gap / 2,
        item: stage.item,
        el: c,
        taken: false
      });
    }
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function calculateScore(success) {
    const itemPoints = collected.size * 75;
    const gateBonus = success ? 200 : 0;
    const perfectBonus = success && collected.size === requiredItems.length ? 100 : 0;
    return obstaclePasses * 20 + itemPoints + gateBonus + perfectBonus;
  }

  function saveRun(run) {
    const best = Number(localStorage.getItem(STORAGE.best) || 0);
    const isBest = run.score > best;
    if (isBest) localStorage.setItem(STORAGE.best, String(run.score));

    const board = safeJSON(STORAGE.localBoard, []);
    board.push({
      username: "Guest",
      score: run.score,
      theme: run.theme,
      createdAt: run.createdAt,
      registered: false
    });
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE.localBoard, JSON.stringify(board.slice(0, 10)));
    return { best: Math.max(best, run.score), isBest };
  }

  function finish(success, text) {
    if (!running) return;
    running = false;
    cancelAnimationFrame(animationId);

    score = calculateScore(success);
    updateScore();

    lastRun = {
      runId: (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
      score,
      success,
      obstaclesPassed: obstaclePasses,
      items: Array.from(collected),
      theme: activeTheme.id,
      routeVersion: "RC0.4-offline",
      createdAt: new Date().toISOString()
    };

    const saved = saveRun(lastRun);

    resultIcon.textContent = success ? "✅" : "❌";
    resultTitle.textContent = success ? "GOOD TO GO" : "MISSED YOUR FLIGHT";
    resultText.textContent = text;
    resultScore.textContent = padScore(score);
    resultBest.textContent = padScore(saved.best);
    personalBest.textContent = saved.isBest ? "New personal best!" : "";
    renderLeaderboard();
    updateStartBest();
    showScreen("result");
    resultTitle.focus();
  }

  function renderLeaderboard() {
    const board = safeJSON(STORAGE.localBoard, []);
    leaderboard.innerHTML = board.length
      ? board.slice(0, 5).map((entry, index) => `
          <div class="leaderboard-row">
            <strong>${index + 1}</strong>
            <span>${escapeHTML(entry.username || "Guest")}<br><small>${escapeHTML(entry.theme || "default")}</small></span>
            <strong>${padScore(entry.score)}</strong>
          </div>
        `).join("")
      : "<p>No scores yet.</p>";
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function updateStartBest() {
    const best = Number(localStorage.getItem(STORAGE.best) || 0);
    startLocalBest.textContent = best
      ? `Device best: ${padScore(best)}`
      : "";
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(32, now - lastTime);
    lastTime = now;
    const speed = 2.7 + Math.min(stageIndex * 0.18, 1.2);

    velocity += gravity * (dt / 16.67);
    y += velocity * (dt / 16.67);
    playerEl.style.top = `${y}px`;
    playerEl.style.transform =
      `translate(-50%,-50%) rotate(${Math.max(-18, Math.min(38, velocity * 5))}deg)`;

    obstacleTimer += dt;
    if (obstacleTimer > 1650) {
      obstacleTimer = 0;
      makeObstacle();
    }

    const playerRect = playerEl.getBoundingClientRect();

    for (const o of obstacles) {
      o.x -= speed * (dt / 16.67);
      o.top.style.left = `${o.x}px`;
      o.bottom.style.left = `${o.x}px`;

      if (
        rectsOverlap(playerRect, o.top.getBoundingClientRect()) ||
        rectsOverlap(playerRect, o.bottom.getBoundingClientRect())
      ) {
        finish(false, `You hit ${stages[o.stageIndex].label.toLowerCase()}.`);
        return;
      }

      if (!o.passed && o.x + o.width < game.clientWidth * 0.17) {
        o.passed = true;
        obstaclePasses += 1;
        score += 20;
        updateScore();

        if (o.stageIndex === stageIndex && stageIndex < stages.length - 1) {
          stageIndex += 1;
          stageLabel.textContent = stages[stageIndex].label;
          flash(stages[stageIndex].label);
        } else if (stageIndex === stages.length - 1 && obstaclePasses >= stages.length) {
          if (collected.size === requiredItems.length) {
            finish(true, "Passport checked. Security cleared. Boarding pass ready. You made the gate.");
          } else {
            const missing = requiredItems
              .filter(item => !collected.has(item.id))
              .map(item => item.name)
              .join(", ");
            finish(false, `You reached the gate, but missed: ${missing}.`);
          }
          return;
        }
      }
    }

    for (const c of collectibles) {
      c.x -= speed * (dt / 16.67);
      c.el.style.left = `${c.x}px`;

      if (!c.taken && rectsOverlap(playerRect, c.el.getBoundingClientRect())) {
        c.taken = true;
        collected.add(c.item.id);
        score += 75;
        c.el.remove();
        updateInventory();
        updateScore();
        flash(currentThemeIcon(c.item));
      }
    }

    obstacles = obstacles.filter(o => {
      if (o.x < -160) {
        o.top.remove();
        o.bottom.remove();
        return false;
      }
      return true;
    });

    collectibles = collectibles.filter(c => {
      if (c.taken) return false;
      if (c.x < -80) {
        c.el.remove();
        return false;
      }
      return true;
    });

    if (y < 0 || y > game.clientHeight) {
      finish(false, y < 0 ? "You flew too high." : "You dropped below the route.");
      return;
    }

    animationId = requestAnimationFrame(loop);
  }

  leaderboardButton.addEventListener("click", () => {
    leaderboard.classList.toggle("hidden");
    leaderboardButton.textContent = leaderboard.classList.contains("hidden")
      ? "View local leaderboard"
      : "Hide local leaderboard";
  });

  themeButton.addEventListener("click", cycleTheme);
  startButton.addEventListener("click", startGame);
  againButton.addEventListener("click", startGame);
  tapButton.addEventListener("click", flapPlayer);
  game.addEventListener("pointerdown", flapPlayer);

  document.addEventListener("keydown", event => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      flapPlayer();
    }
  });

  applyTheme();
  updateStartBest();
  renderLeaderboard();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
})();
