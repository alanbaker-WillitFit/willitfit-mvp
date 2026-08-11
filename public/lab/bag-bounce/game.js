(() => {
  "use strict";

  const LEVEL_COUNT = 10;
  const STORAGE = { best: "willitlab.bagBounce.best" };
  const assets = window.WILLIT_BAG_BOUNCE_ASSETS || {};

  const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => {
    const level = index + 1;
    const progress = index / (LEVEL_COUNT - 1);
    return {
      level,
      rows: level <= 2 ? 3 : level <= 6 ? 4 : 5,
      columns: level <= 3 ? 6 : level <= 7 ? 7 : 8,
      speed: 4.1 + progress * 2.4,
      paddleRatio: 0.28 - progress * 0.08,
      movingRows: level >= 4,
      heavyEvery: level < 5 ? 0 : Math.max(3, 8 - Math.floor((level - 5) / 2)),
      priorityCount: level < 7 ? 0 : Math.min(4, level - 6)
    };
  });

  const screens = {
    start: document.getElementById("start-screen"),
    game: document.getElementById("game-screen"),
    result: document.getElementById("result-screen")
  };
  const game = document.getElementById("game");
  const field = document.getElementById("bag-field");
  const token = document.getElementById("token");
  const tokenImage = document.getElementById("token-image");
  const paddle = document.getElementById("paddle");
  const playerBagImage = document.getElementById("player-bag-image");
  const introAgent = document.getElementById("intro-agent");
  const outroAgent = document.getElementById("outro-agent");
  const levelLabel = document.getElementById("level-label");
  const scoreLabel = document.getElementById("score-label");
  const livesLabel = document.getElementById("lives-label");
  const goalLabel = document.getElementById("goal-label");
  const remainingLabel = document.getElementById("remaining-label");
  const message = document.getElementById("message");
  const resumeOverlay = document.getElementById("resume-overlay");
  const pauseButton = document.getElementById("pause-button");
  const startButton = document.getElementById("start-button");
  const againButton = document.getElementById("again-button");
  const leftButton = document.getElementById("left-button");
  const rightButton = document.getElementById("right-button");
  const resultTitle = document.getElementById("result-title");
  const resultCopy = document.getElementById("result-copy");
  const resultScore = document.getElementById("result-score");
  const resultBest = document.getElementById("result-best");

  tokenImage.src = assets.approvalToken || "";
  playerBagImage.src = assets.playerBag || "";
  introAgent.src = assets.introAgent || "";
  outroAgent.src = assets.outroAgent || "";

  let running = false;
  let paused = false;
  let level = 1;
  let score = 0;
  let lives = 3;
  let paddleX = 0;
  let paddleVelocity = 0;
  let tokenX = 0;
  let tokenY = 0;
  let tokenVX = 0;
  let tokenVY = 0;
  let lastTime = 0;
  let animationId = null;
  let bags = [];
  let clearedThisLevel = 0;
  let activePriority = 0;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => el.classList.toggle("active", key === name));
  }

  function padScore(value) {
    return String(Math.max(0, Math.round(value))).padStart(4, "0");
  }

  function flash(text) {
    message.classList.remove("show");
    message.textContent = text;
    void message.offsetWidth;
    message.classList.add("show");
  }

  function updateHud() {
    levelLabel.textContent = `${String(level).padStart(2, "0")} / ${LEVEL_COUNT}`;
    scoreLabel.textContent = padScore(score);
    livesLabel.textContent = String(lives);
    const remaining = bags.filter((bag) => bag.hits > 0).length;
    const remainingPriority = bags.filter((bag) => bag.priority && bag.hits > 0).length;
    goalLabel.textContent = activePriority ? "Clear priority bags" : "Clear all bags";
    remainingLabel.textContent = activePriority ? `${remainingPriority} priority left` : `${remaining} left`;
  }

  function config() {
    return LEVELS[level - 1];
  }

  function buildLevel() {
    field.innerHTML = "";
    bags = [];
    clearedThisLevel = 0;
    activePriority = config().priorityCount;

    const cfg = config();
    const width = field.clientWidth;
    const height = field.clientHeight;
    const gap = 8;
    const bagWidth = Math.max(42, (width - gap * (cfg.columns - 1)) / cfg.columns);
    const bagHeight = Math.max(34, Math.min(56, (height * 0.54 - gap * (cfg.rows - 1)) / cfg.rows));
    const total = cfg.rows * cfg.columns;
    const priorityIndexes = new Set();
    for (let p = 0; p < cfg.priorityCount; p += 1) {
      priorityIndexes.add(Math.floor((p + 1) * total / (cfg.priorityCount + 1)));
    }

    for (let row = 0; row < cfg.rows; row += 1) {
      for (let column = 0; column < cfg.columns; column += 1) {
        const index = row * cfg.columns + column;
        const el = document.createElement("div");
        let type = "standard";
        if (cfg.heavyEvery && index % cfg.heavyEvery === 0) type = "heavy";
        else if ((index + row) % 5 === 0) type = "personal";
        const priority = priorityIndexes.has(index);
        el.className = `bag ${type}${priority ? " priority" : ""}`;
        el.style.width = `${bagWidth}px`;
        el.style.height = `${bagHeight}px`;
        field.appendChild(el);
        const hits = type === "heavy" ? 2 : 1;
        bags.push({
          el,
          row,
          baseX: column * (bagWidth + gap),
          x: column * (bagWidth + gap),
          y: row * (bagHeight + gap),
          width: bagWidth,
          height: bagHeight,
          hits,
          type,
          priority,
          phase: row * 0.85,
          direction: row % 2 === 0 ? 1 : -1
        });
      }
    }
    positionBags(0);
    updateHud();
  }

  function positionBags(now) {
    const cfg = config();
    const fieldRect = field.getBoundingClientRect();
    for (const bag of bags) {
      if (bag.hits <= 0) continue;
      const motion = cfg.movingRows ? Math.sin(now / 1250 + bag.phase) * 14 * bag.direction : 0;
      bag.x = bag.baseX + motion;
      bag.el.style.left = `${bag.x}px`;
      bag.el.style.top = `${bag.y}px`;
      bag.rect = {
        left: fieldRect.left + bag.x,
        right: fieldRect.left + bag.x + bag.width,
        top: fieldRect.top + bag.y,
        bottom: fieldRect.top + bag.y + bag.height
      };
    }
  }

  function resetPaddleAndToken() {
    const rect = game.getBoundingClientRect();
    const cfg = config();
    const paddleWidth = Math.max(118, rect.width * cfg.paddleRatio);
    paddle.style.width = `${paddleWidth}px`;
    paddleX = rect.width / 2;
    paddle.style.left = `${paddleX}px`;
    tokenX = rect.width / 2;
    tokenY = rect.height - 150;
    const direction = Math.random() > 0.5 ? 1 : -1;
    tokenVX = cfg.speed * direction * 0.82;
    tokenVY = -cfg.speed;
    renderToken();
  }

  function renderToken() {
    token.style.left = `${tokenX - token.offsetWidth / 2}px`;
    token.style.top = `${tokenY - token.offsetHeight / 2}px`;
  }

  function startGame() {
    level = 1;
    score = 0;
    lives = 3;
    showScreen("game");
    requestAnimationFrame(() => {
      buildLevel();
      resetPaddleAndToken();
      running = true;
      paused = false;
      lastTime = performance.now();
      flash("LEVEL 1");
      animationId = requestAnimationFrame(loop);
    });
  }

  function pauseGame() {
    if (!running || paused) return;
    paused = true;
    resumeOverlay.classList.remove("hidden");
    pauseButton.textContent = "▶";
  }

  function resumeGame() {
    if (!running || !paused) return;
    paused = false;
    resumeOverlay.classList.add("hidden");
    pauseButton.textContent = "Ⅱ";
    lastTime = performance.now();
    animationId = requestAnimationFrame(loop);
  }

  function togglePause() {
    paused ? resumeGame() : pauseGame();
  }

  function movePaddle(direction) {
    paddleVelocity = direction * 8;
  }

  function stopPaddle() {
    paddleVelocity = 0;
  }

  function tokenRect() {
    const size = token.offsetWidth;
    return {
      left: game.getBoundingClientRect().left + tokenX - size / 2,
      right: game.getBoundingClientRect().left + tokenX + size / 2,
      top: game.getBoundingClientRect().top + tokenY - size / 2,
      bottom: game.getBoundingClientRect().top + tokenY + size / 2
    };
  }

  function overlaps(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function clearBag(bag) {
    bag.hits -= 1;
    score += bag.type === "heavy" ? 60 : bag.type === "personal" ? 80 : 50;
    if (bag.hits > 0) {
      bag.el.style.boxShadow = "0 0 0 4px rgba(245,158,11,.9),0 8px 12px rgba(0,0,0,.16)";
      flash("HEAVY BAG");
      return;
    }
    clearedThisLevel += 1;
    const fieldCenter = field.getBoundingClientRect().left + field.clientWidth / 2;
    const bagCenter = bag.rect.left + bag.width / 2;
    bag.el.style.setProperty("--clear-x", bagCenter < fieldCenter ? "-70px" : "70px");
    bag.el.classList.add("cleared");
    setTimeout(() => bag.el.remove(), 190);
    score += bag.priority ? 100 : 0;
    updateHud();
  }

  function levelComplete() {
    const targetsLeft = activePriority
      ? bags.some((bag) => bag.priority && bag.hits > 0)
      : bags.some((bag) => bag.hits > 0);
    if (targetsLeft) return false;

    score += 250 + lives * 50;
    if (level >= LEVEL_COUNT) {
      finish(true);
      return true;
    }

    level += 1;
    buildLevel();
    resetPaddleAndToken();
    flash(level === 4 ? "MOVING BELT" : level === 5 ? "HEAVY BAGS" : level === 7 ? "PRIORITY CLEAR" : `LEVEL ${level}`);
    return true;
  }

  function loseToken() {
    lives -= 1;
    updateHud();
    if (lives <= 0) {
      finish(false);
      return;
    }
    resetPaddleAndToken();
    flash("TOKEN RETURNED");
  }

  function finish(success) {
    running = false;
    paused = false;
    cancelAnimationFrame(animationId);
    const oldBest = Number(localStorage.getItem(STORAGE.best) || 0);
    const best = Math.max(oldBest, score);
    localStorage.setItem(STORAGE.best, String(best));
    resultTitle.textContent = success ? "ROUTE CLEAR" : "BELT STILL JAMMED";
    resultCopy.textContent = success
      ? `All 10 baggage zones cleared. Your bag has a clean route to loading.`
      : `You reached level ${level} of ${LEVEL_COUNT}. The belt team can try the route again.`;
    resultScore.textContent = padScore(score);
    resultBest.textContent = padScore(best);
    showScreen("result");
  }

  function loop(now) {
    if (!running || paused) return;
    const dt = Math.min(32, Math.max(0, now - lastTime));
    lastTime = now;
    const scale = dt / 16.67;
    const rect = game.getBoundingClientRect();

    paddleX += paddleVelocity * scale;
    const halfPaddle = paddle.offsetWidth / 2;
    paddleX = Math.max(60 + halfPaddle, Math.min(rect.width - 60 - halfPaddle, paddleX));
    paddle.style.left = `${paddleX}px`;

    tokenX += tokenVX * scale;
    tokenY += tokenVY * scale;
    const radius = token.offsetWidth / 2;

    if (tokenX - radius < 55) {
      tokenX = 55 + radius;
      tokenVX = Math.abs(tokenVX);
    } else if (tokenX + radius > rect.width - 55) {
      tokenX = rect.width - 55 - radius;
      tokenVX = -Math.abs(tokenVX);
    }
    if (tokenY - radius < 0) {
      tokenY = radius;
      tokenVY = Math.abs(tokenVY);
    }

    positionBags(now);
    const tRect = tokenRect();

    const paddleRect = paddle.getBoundingClientRect();
    if (tokenVY > 0 && overlaps(tRect, paddleRect)) {
      tokenY = paddleRect.top - rect.top - radius - 1;
      const offset = (tokenX - paddleX) / Math.max(1, halfPaddle);
      const speed = config().speed;
      tokenVX = speed * Math.max(-1.15, Math.min(1.15, offset * 1.12));
      tokenVY = -Math.sqrt(Math.max(speed * speed * 1.25 - tokenVX * tokenVX * 0.35, speed * speed * 0.72));
      score += 5;
    }

    for (const bag of bags) {
      if (bag.hits <= 0 || !bag.rect) continue;
      if (!overlaps(tRect, bag.rect)) continue;
      const horizontalDepth = Math.min(tRect.right - bag.rect.left, bag.rect.right - tRect.left);
      const verticalDepth = Math.min(tRect.bottom - bag.rect.top, bag.rect.bottom - tRect.top);
      if (horizontalDepth < verticalDepth) tokenVX *= -1;
      else tokenVY *= -1;
      clearBag(bag);
      if (levelComplete()) return;
      break;
    }

    if (tokenY - radius > rect.height) {
      loseToken();
      if (!running) return;
    }

    renderToken();
    animationId = requestAnimationFrame(loop);
  }

  function pointerMove(event) {
    if (!running || paused) return;
    const rect = game.getBoundingClientRect();
    paddleX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  }

  startButton.addEventListener("click", startGame);
  againButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", togglePause);
  resumeOverlay.addEventListener("click", resumeGame);
  leftButton.addEventListener("pointerdown", () => movePaddle(-1));
  rightButton.addEventListener("pointerdown", () => movePaddle(1));
  [leftButton, rightButton].forEach((button) => {
    button.addEventListener("pointerup", stopPaddle);
    button.addEventListener("pointercancel", stopPaddle);
    button.addEventListener("pointerleave", stopPaddle);
  });
  game.addEventListener("pointermove", pointerMove);
  window.addEventListener("keydown", (event) => {
    if (event.code === "ArrowLeft") movePaddle(-1);
    if (event.code === "ArrowRight") movePaddle(1);
    if (["KeyP", "Escape"].includes(event.code)) togglePause();
  });
  window.addEventListener("keyup", (event) => {
    if (["ArrowLeft", "ArrowRight"].includes(event.code)) stopPaddle();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
  });
  window.addEventListener("resize", () => {
    if (running) {
      pauseGame();
      resetPaddleAndToken();
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();