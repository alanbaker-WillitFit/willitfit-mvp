(() => {
  "use strict";

  const LEVEL_COUNT = 10;
  const STORAGE = { best: "willitlab.bagBounce.best" };
  const assets = window.WILLIT_BAG_BOUNCE_ASSETS || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, index) => {
    const level = index + 1;
    const progress = index / (LEVEL_COUNT - 1);
    return {
      level,
      rows: level <= 2 ? 3 : level <= 6 ? 4 : 5,
      columns: level <= 3 ? 6 : level <= 7 ? 7 : 8,
      speed: 4.05 + progress * 2.15,
      paddleRatio: 0.29 - progress * 0.075,
      movingRows: level >= 4,
      rowTravel: level < 4 ? 0 : 10 + progress * 10,
      rowRate: 1450 - progress * 320,
      heavyEvery: level < 5 ? 0 : Math.max(3, 8 - Math.floor((level - 5) / 2)),
      priorityCount: level < 7 ? 0 : Math.min(4, level - 6),
      transitionMs: reducedMotion ? 220 : 900
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
  let transitioning = false;
  let level = 1;
  let score = 0;
  let lives = 3;
  let paddleX = 0;
  let paddleTargetX = 0;
  let paddleDirection = 0;
  let tokenX = 0;
  let tokenY = 0;
  let tokenVX = 0;
  let tokenVY = 0;
  let lastTime = 0;
  let pausedAt = 0;
  let worldPauseOffset = 0;
  let animationId = null;
  let bags = [];
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
    if (reducedMotion) setTimeout(() => message.classList.remove("show"), 180);
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

  function makeBagArtwork(type) {
    if (type !== "standard" || !assets.standardBag) return null;
    const img = document.createElement("img");
    img.className = "bag-art";
    img.src = assets.standardBag;
    img.alt = "";
    img.draggable = false;
    return img;
  }

  function buildLevel() {
    field.innerHTML = "";
    game.classList.remove("route-clear");
    bags = [];
    activePriority = config().priorityCount;

    const cfg = config();
    const width = field.clientWidth;
    const height = field.clientHeight;
    const gap = Math.max(6, Math.min(10, width * 0.012));
    const bagWidth = Math.max(40, (width - gap * (cfg.columns - 1)) / cfg.columns);
    const bagHeight = Math.max(32, Math.min(56, (height * 0.54 - gap * (cfg.rows - 1)) / cfg.rows));
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
        const artwork = makeBagArtwork(type);
        if (artwork) el.appendChild(artwork);
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
          phase: row * 0.82,
          direction: row % 2 === 0 ? 1 : -1,
          lastHitAt: -Infinity
        });
      }
    }
    positionBags(0);
    updateHud();
  }

  function positionBags(worldNow) {
    const cfg = config();
    const fieldRect = field.getBoundingClientRect();
    for (const bag of bags) {
      if (bag.hits <= 0) continue;
      const motion = cfg.movingRows
        ? Math.sin(worldNow / cfg.rowRate + bag.phase) * cfg.rowTravel * bag.direction
        : 0;
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
    const paddleWidth = Math.max(112, rect.width * cfg.paddleRatio);
    paddle.style.width = `${paddleWidth}px`;
    paddleX = rect.width / 2;
    paddleTargetX = paddleX;
    paddleDirection = 0;
    paddle.style.left = `${paddleX}px`;
    tokenX = rect.width / 2;
    tokenY = rect.height - 150;
    const direction = Math.random() > 0.5 ? 1 : -1;
    tokenVX = cfg.speed * direction * 0.55;
    tokenVY = -cfg.speed * 0.93;
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
    transitioning = false;
    worldPauseOffset = 0;
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
    if (!running || paused || transitioning) return;
    paused = true;
    pausedAt = performance.now();
    resumeOverlay.classList.remove("hidden");
    pauseButton.textContent = "▶";
  }

  function resumeGame() {
    if (!running || !paused) return;
    const now = performance.now();
    worldPauseOffset += Math.max(0, now - pausedAt);
    paused = false;
    resumeOverlay.classList.add("hidden");
    pauseButton.textContent = "Ⅱ";
    lastTime = now;
    animationId = requestAnimationFrame(loop);
  }

  function togglePause() {
    paused ? resumeGame() : pauseGame();
  }

  function movePaddle(direction) {
    paddleDirection = direction;
  }

  function stopPaddle() {
    paddleDirection = 0;
  }

  function tokenRect() {
    const size = token.offsetWidth;
    const inset = size * 0.16;
    const gameRect = game.getBoundingClientRect();
    return {
      left: gameRect.left + tokenX - size / 2 + inset,
      right: gameRect.left + tokenX + size / 2 - inset,
      top: gameRect.top + tokenY - size / 2 + inset,
      bottom: gameRect.top + tokenY + size / 2 - inset
    };
  }

  function overlaps(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function clearBag(bag, now) {
    if (now - bag.lastHitAt < 120) return false;
    bag.lastHitAt = now;
    bag.hits -= 1;
    score += bag.type === "heavy" ? 60 : bag.type === "personal" ? 80 : 50;
    if (bag.hits > 0) {
      bag.el.classList.add("damaged");
      flash("HEAVY BAG");
      updateHud();
      return true;
    }

    const fieldRect = field.getBoundingClientRect();
    const bagCenter = bag.rect.left + bag.width / 2;
    const fieldCenter = fieldRect.left + fieldRect.width / 2;
    const clearDistance = Math.max(100, fieldRect.width / 2 + bag.width);
    const clearLeft = bagCenter < fieldCenter;
    bag.el.style.setProperty("--clear-x", `${clearLeft ? -clearDistance : clearDistance}px`);
    bag.el.style.setProperty("--clear-rotate", `${clearLeft ? -10 : 10}deg`);
    bag.el.classList.add("cleared");
    setTimeout(() => bag.el.remove(), reducedMotion ? 40 : 430);
    score += bag.priority ? 100 : 0;
    updateHud();
    return true;
  }

  function targetsRemain() {
    return activePriority
      ? bags.some((bag) => bag.priority && bag.hits > 0)
      : bags.some((bag) => bag.hits > 0);
  }

  function beginLevelTransition() {
    if (transitioning || targetsRemain()) return false;
    transitioning = true;
    score += 250 + lives * 50;
    updateHud();
    game.classList.add("route-clear");
    flash(level >= LEVEL_COUNT ? "ROUTE CLEAR" : "BELT CLEAR");

    setTimeout(() => {
      if (!running) return;
      game.classList.remove("route-clear");
      if (level >= LEVEL_COUNT) {
        finish(true);
        return;
      }
      level += 1;
      buildLevel();
      resetPaddleAndToken();
      transitioning = false;
      const label = level === 4 ? "MOVING BELT" : level === 5 ? "HEAVY BAGS" : level === 7 ? "PRIORITY CLEAR" : `LEVEL ${level}`;
      flash(label);
    }, config().transitionMs);
    return true;
  }

  function loseToken() {
    if (transitioning) return;
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
    transitioning = false;
    cancelAnimationFrame(animationId);
    const oldBest = Number(localStorage.getItem(STORAGE.best) || 0);
    const best = Math.max(oldBest, score);
    localStorage.setItem(STORAGE.best, String(best));
    resultTitle.textContent = success ? "ROUTE CLEAR" : "BELT STILL JAMMED";
    resultCopy.textContent = success
      ? "All 10 baggage zones cleared. Your bag has a clean route to loading."
      : `You reached level ${level} of ${LEVEL_COUNT}. The belt team can try the route again.`;
    resultScore.textContent = padScore(score);
    resultBest.textContent = padScore(best);
    showScreen("result");
  }

  function reboundFromPaddle(rect, paddleRect, halfPaddle, radius) {
    tokenY = paddleRect.top - rect.top - radius - 2;
    const normalizedOffset = Math.max(-1, Math.min(1, (tokenX - paddleX) / Math.max(1, halfPaddle)));
    const maxAngle = Math.PI * 0.36;
    const angle = normalizedOffset * maxAngle;
    const speed = config().speed;
    tokenVX = Math.sin(angle) * speed;
    tokenVY = -Math.cos(angle) * speed;
    if (Math.abs(tokenVX) < speed * 0.22) tokenVX = speed * 0.22 * (normalizedOffset < 0 ? -1 : 1);
    score += 5;
  }

  function loop(now) {
    if (!running || paused) return;
    const dt = Math.min(32, Math.max(0, now - lastTime));
    lastTime = now;
    const scale = dt / 16.67;
    const rect = game.getBoundingClientRect();

    if (transitioning) {
      renderToken();
      animationId = requestAnimationFrame(loop);
      return;
    }

    const halfPaddle = paddle.offsetWidth / 2;
    if (paddleDirection !== 0) paddleTargetX += paddleDirection * 9.2 * scale;
    const minPaddleX = 60 + halfPaddle;
    const maxPaddleX = rect.width - 60 - halfPaddle;
    paddleTargetX = Math.max(minPaddleX, Math.min(maxPaddleX, paddleTargetX));
    const maxPaddleStep = 16 * scale;
    const delta = paddleTargetX - paddleX;
    paddleX += Math.max(-maxPaddleStep, Math.min(maxPaddleStep, delta));
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

    const worldNow = now - worldPauseOffset;
    positionBags(worldNow);
    const tRect = tokenRect();

    const paddleRect = paddle.getBoundingClientRect();
    if (tokenVY > 0 && overlaps(tRect, paddleRect)) reboundFromPaddle(rect, paddleRect, halfPaddle, radius);

    for (const bag of bags) {
      if (bag.hits <= 0 || !bag.rect || !overlaps(tRect, bag.rect)) continue;
      const horizontalDepth = Math.min(tRect.right - bag.rect.left, bag.rect.right - tRect.left);
      const verticalDepth = Math.min(tRect.bottom - bag.rect.top, bag.rect.bottom - tRect.top);
      if (horizontalDepth < verticalDepth) tokenVX *= -1;
      else tokenVY *= -1;
      clearBag(bag, now);
      if (beginLevelTransition()) break;
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
    if (!running || paused || transitioning) return;
    const rect = game.getBoundingClientRect();
    paddleTargetX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
  }

  function handleViewportChange() {
    if (!running) return;
    pauseGame();
    const rect = game.getBoundingClientRect();
    const halfPaddle = paddle.offsetWidth / 2;
    paddleX = Math.max(60 + halfPaddle, Math.min(rect.width - 60 - halfPaddle, paddleX));
    paddleTargetX = paddleX;
    tokenX = Math.max(55 + token.offsetWidth / 2, Math.min(rect.width - 55 - token.offsetWidth / 2, tokenX));
    tokenY = Math.max(token.offsetHeight / 2, Math.min(rect.height - 90, tokenY));
    renderToken();
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
  game.addEventListener("pointerdown", pointerMove);
  game.addEventListener("pointermove", pointerMove);

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "KeyA"].includes(event.code)) movePaddle(-1);
    if (["ArrowRight", "KeyD"].includes(event.code)) movePaddle(1);
    if (["KeyP", "Escape"].includes(event.code)) togglePause();
  });
  window.addEventListener("keyup", (event) => {
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) stopPaddle();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame();
  });
  window.addEventListener("resize", handleViewportChange);

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
})();