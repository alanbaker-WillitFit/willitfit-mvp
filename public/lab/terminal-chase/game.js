(() => {
  "use strict";

  const LEVEL_COUNT = 10;
  const BEST_KEY = "willitlab.terminal-chase.best";
  const PLAYER_STEP_MS = 96;
  const SPAWN_GRACE_MS = 1700;
  const RESPAWN_PAUSE_MS = 760;
  const HAZARD_RELEASE_GAP_MS = 520;
  const BARRIER_CYCLE_MS = 2600;
  const BARRIER_WARNING_MS = 650;
  const TUNNEL_ROW = 7;
  const ENEMY_TYPES = ["staff", "cart", "traveller", "security", "staff"];
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const LEVELS = [
    { name: "Gate Change", zone: "Concourse A", enemyCount: 1, enemyStepMs: 500, powerMs: 7000, movingBarrier: false, tunnel: false, map: 0, gate: "A12", theme: "tutorial" },
    { name: "Busy Terminal", zone: "Concourse B", enemyCount: 2, enemyStepMs: 440, powerMs: 6500, movingBarrier: false, tunnel: true, map: 1, gate: "B18", theme: "terminal" },
    { name: "Security Split", zone: "Security Hall", enemyCount: 2, enemyStepMs: 410, powerMs: 6100, movingBarrier: false, tunnel: true, map: 2, gate: "C07", theme: "security" },
    { name: "Moving Walkway", zone: "Central Concourse", enemyCount: 3, enemyStepMs: 385, powerMs: 5750, movingBarrier: true, tunnel: true, map: 0, gate: "D22", theme: "concourse" },
    { name: "Gate Rush", zone: "Pier 5", enemyCount: 3, enemyStepMs: 360, powerMs: 5400, movingBarrier: true, tunnel: true, map: 1, gate: "E14", theme: "midpoint" },
    { name: "Cross Terminal", zone: "Connections", enemyCount: 4, enemyStepMs: 345, powerMs: 5100, movingBarrier: true, tunnel: true, map: 2, gate: "F31", theme: "concourse" },
    { name: "Priority Route", zone: "Gate 27", enemyCount: 4, enemyStepMs: 330, powerMs: 4800, movingBarrier: true, tunnel: true, map: 0, gate: "G27", theme: "security" },
    { name: "Last Transfer", zone: "Satellite Terminal", enemyCount: 4, enemyStepMs: 315, powerMs: 4500, movingBarrier: true, tunnel: true, map: 1, gate: "H09", theme: "concourse" },
    { name: "Final Call", zone: "Departure Pier", enemyCount: 5, enemyStepMs: 300, powerMs: 4200, movingBarrier: true, tunnel: true, map: 2, gate: "J16", theme: "final" },
    { name: "Terminal Chase", zone: "New Gate", enemyCount: 5, enemyStepMs: 285, powerMs: 4000, movingBarrier: true, tunnel: true, map: 0, gate: "K42", theme: "finale" },
  ];

  const MAPS = [
    [
      "#################",
      "#P....#.....o...#",
      "#.###.#.###.###.#",
      "#.....#...#.....#",
      "#.#####.#.#.###.#",
      "#.......#.#.....#",
      "###.###.#.#####.#",
      "#...#... ...#...#",
      "#.###.#####.#.#.#",
      "#.....#...#...#.#",
      "#.#####.#.#####.#",
      "#o......#.......#",
      "#.#####.#####.#.#",
      "#.............#G#",
      "#################",
    ],
    [
      "#################",
      "#P..#.......#..o#",
      "#.#.#.#####.#.#.#",
      "#.#...#...#...#.#",
      "#.#####.#.#####.#",
      "#.......#.......#",
      "###.#.#####.#.###",
      "#...#... ...#...#",
      "#.#####.#.#####.#",
      "#.#.....#.....#.#",
      "#.#.###.###.#.#.#",
      "#o#...#.....#...#",
      "#.###.#######.###",
      "#..............G#",
      "#################",
    ],
    [
      "#################",
      "#P....#...#....o#",
      "#.###.#.#.#.###.#",
      "#...#...#...#...#",
      "###.#####.#####.#",
      "#.....#.....#...#",
      "#.###.#.###.#.#.#",
      "#...#..  ...#...#",
      "#.#.###.###.###.#",
      "#.#.....#.....#.#",
      "#.#####.#.#####.#",
      "#o....#...#.....#",
      "#.###.###.###.#.#",
      "#..............G#",
      "#################",
    ],
  ];

  const screens = {
    start: document.getElementById("start-screen"),
    game: document.getElementById("game-screen"),
    result: document.getElementById("result-screen"),
  };
  const game = document.getElementById("game");
  const maze = document.getElementById("maze");
  const playerEl = document.getElementById("player");
  const gateEl = document.getElementById("gate");
  const message = document.getElementById("message");
  const powerStatus = document.getElementById("power-status");
  const levelLabel = document.getElementById("level-label");
  const zoneLabel = document.getElementById("zone-label");
  const scoreLabel = document.getElementById("score-label");
  const livesLabel = document.getElementById("lives-label");
  const remainingLabel = document.getElementById("remaining-label");
  const gateLabel = document.getElementById("gate-label");
  const resumeOverlay = document.getElementById("resume-overlay");

  let level = 1;
  let score = 0;
  let lives = 3;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let paused = false;
  let running = false;
  let board = [];
  let cells = [];
  let rows = 0;
  let cols = 0;
  let player = { x: 1, y: 1, startX: 1, startY: 1 };
  let gate = { x: 15, y: 13 };
  let hazards = [];
  let tokenCount = 0;
  let powerUntil = 0;
  let graceUntil = 0;
  let inputDir = "";
  let requestedDir = "";
  let playerTimer = 0;
  let enemyTimer = 0;
  let barrierTimer = 0;
  let lastFrame = 0;
  let barrierClosed = false;
  let barrierWarning = false;
  let barrierCell = null;
  let raf = 0;

  const showScreen = (key) => {
    Object.values(screens).forEach((screen) => screen.classList.remove("active"));
    screens[key].classList.add("active");
  };

  const flash = (text, duration = 850) => {
    message.textContent = text;
    message.classList.remove("show");
    void message.offsetWidth;
    message.classList.add("show");
    window.setTimeout(() => message.classList.remove("show"), duration);
  };

  const currentLevel = () => LEVELS[level - 1];

  function parseBoard() {
    board = MAPS[currentLevel().map].map((row) => row.split(""));
    rows = board.length;
    cols = board[0].length;
    player = { x: 1, y: 1, startX: 1, startY: 1 };
    gate = { x: cols - 2, y: rows - 2 };
    tokenCount = 0;
    barrierCell = currentLevel().movingBarrier ? { x: Math.floor(cols / 2), y: TUNNEL_ROW } : null;
    barrierClosed = false;
    barrierWarning = false;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const value = board[y][x];
        if (value === "P") {
          player = { x, y, startX: x, startY: y };
          board[y][x] = ".";
        } else if (value === "G") {
          gate = { x, y };
          board[y][x] = " ";
        }
      }
    }
  }

  function cellIndex(x, y) {
    return y * cols + x;
  }

  function isTunnelMove(x, y) {
    return currentLevel().tunnel && y === TUNNEL_ROW && (x < 1 || x > cols - 2);
  }

  function isWall(x, y) {
    if (y < 0 || y >= rows) return true;
    if (isTunnelMove(x, y)) return false;
    if (x < 0 || x >= cols) return true;
    if (barrierCell && barrierClosed && x === barrierCell.x && y === barrierCell.y) return true;
    return board[y][x] === "#";
  }

  function normalizeMoveX(x, y) {
    if (!currentLevel().tunnel || y !== TUNNEL_ROW) return x;
    if (x <= 0) return cols - 2;
    if (x >= cols - 1) return 1;
    return x;
  }

  function buildMaze() {
    maze.innerHTML = "";
    cells = [];
    maze.style.gridTemplateColumns = `repeat(${cols},1fr)`;
    maze.style.gridTemplateRows = `repeat(${rows},1fr)`;
    const approvalToken = window.WILLIT_BAG_BOUNCE_ASSETS?.approvalToken || "";

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const value = board[y][x];
        const cell = document.createElement("div");
        cell.className = value === "#" ? "cell wall" : "cell floor";
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        if (currentLevel().tunnel && y === TUNNEL_ROW && (x === 0 || x === cols - 1)) {
          cell.className = "cell floor tunnel-mouth";
        }
        if (value === "." || value === "o") {
          const token = document.createElement("span");
          if (value === "o") {
            token.className = "token-power";
            if (approvalToken) {
              const img = document.createElement("img");
              img.src = approvalToken;
              img.alt = "";
              token.appendChild(img);
            } else {
              token.textContent = "✓";
            }
          } else {
            token.className = "token-dot";
          }
          token.dataset.token = value === "o" ? "power" : "normal";
          cell.appendChild(token);
          tokenCount += 1;
        }
        maze.appendChild(cell);
        cells.push(cell);
      }
    }
    updateBarrierCell();
  }

  function updateBarrierCell() {
    if (!barrierCell) return;
    const cell = cells[cellIndex(barrierCell.x, barrierCell.y)];
    if (!cell) return;
    cell.classList.toggle("barrier", barrierClosed);
    cell.classList.toggle("barrier-warning", barrierWarning && !barrierClosed);
  }

  function walkableCells() {
    const result = [];
    for (let y = 1; y < rows - 1; y += 1) {
      for (let x = 1; x < cols - 1; x += 1) {
        if (!isWall(x, y) && !(x === gate.x && y === gate.y)) result.push({ x, y });
      }
    }
    return result;
  }

  function gridDistance(a, b) {
    const directX = Math.abs(a.x - b.x);
    const tunnelX = currentLevel().tunnel && a.y === TUNNEL_ROW && b.y === TUNNEL_ROW ? Math.min(directX, (cols - 2) - directX) : directX;
    return tunnelX + Math.abs(a.y - b.y);
  }

  function chooseHazardStarts(count) {
    const candidates = walkableCells()
      .filter((cell) => gridDistance(cell, player) >= 8)
      .sort((a, b) => gridDistance(b, player) - gridDistance(a, player));
    const selected = [];
    for (const candidate of candidates) {
      if (selected.every((other) => gridDistance(candidate, other) >= 3)) selected.push(candidate);
      if (selected.length >= count) break;
    }
    return selected;
  }

  function spawnHazards(now = performance.now()) {
    hazards.forEach((hazard) => hazard.el.remove());
    hazards = [];
    const starts = chooseHazardStarts(currentLevel().enemyCount);
    for (let index = 0; index < currentLevel().enemyCount; index += 1) {
      const start = starts[index] || { x: Math.max(1, cols - 2 - index), y: Math.max(1, rows - 2) };
      const el = document.createElement("div");
      const type = ENEMY_TYPES[index % ENEMY_TYPES.length];
      el.className = `hazard ${type} waiting`;
      el.textContent = type === "staff" ? "STA" : type === "cart" ? "CART" : type === "security" ? "SEC" : "PAX";
      game.appendChild(el);
      hazards.push({
        x: start.x,
        y: start.y,
        startX: start.x,
        startY: start.y,
        dir: index % 2 === 0 ? "left" : "right",
        type,
        personality: index % 3,
        releaseAt: now + 950 + index * HAZARD_RELEASE_GAP_MS,
        el,
      });
    }
  }

  function positionElement(el, x, y) {
    const w = game.clientWidth / cols;
    const h = game.clientHeight / rows;
    el.style.left = `${(x + 0.5) * w}px`;
    el.style.top = `${(y + 0.5) * h}px`;
  }

  function renderPositions() {
    positionElement(playerEl, player.x, player.y);
    positionElement(gateEl, gate.x, gate.y);
    hazards.forEach((hazard) => positionElement(hazard.el, hazard.x, hazard.y));
  }

  function updateHud() {
    levelLabel.textContent = `${String(level).padStart(2, "0")} / ${LEVEL_COUNT}`;
    zoneLabel.textContent = currentLevel().zone;
    scoreLabel.textContent = String(score).padStart(4, "0");
    livesLabel.textContent = String(lives);
    remainingLabel.textContent = tokenCount === 0 ? "GATE OPEN" : `${tokenCount} left`;
    gateLabel.textContent = currentLevel().gate;
    gateEl.classList.toggle("locked", tokenCount > 0);
    gateEl.classList.toggle("ready", tokenCount === 0);
  }

  function collectAtPlayer() {
    const cell = cells[cellIndex(player.x, player.y)];
    if (!cell) return;
    const token = cell.querySelector("[data-token]");
    if (!token) return;
    const isPower = token.dataset.token === "power";
    token.remove();
    board[player.y][player.x] = " ";
    tokenCount = Math.max(0, tokenCount - 1);
    score += isPower ? 250 : 50;
    if (isPower) {
      powerUntil = performance.now() + currentLevel().powerMs;
      hazards.forEach((hazard) => hazard.el.classList.add("safe"));
      flash("SAFE ROUTE", 700);
    } else if (tokenCount === 0) {
      flash("GATE OPEN", 760);
    }
    updateHud();
  }

  function canMove(x, y, dir) {
    const delta = DIRS[dir];
    if (!delta) return false;
    return !isWall(x + delta.x, y + delta.y);
  }

  function movePoint(point, dir) {
    const delta = DIRS[dir];
    return { x: normalizeMoveX(point.x + delta.x, point.y + delta.y), y: point.y + delta.y };
  }

  function stepPlayer() {
    if (requestedDir && canMove(player.x, player.y, requestedDir)) inputDir = requestedDir;
    if (!inputDir || !canMove(player.x, player.y, inputDir)) return;
    const next = movePoint(player, inputDir);
    player.x = next.x;
    player.y = next.y;
    playerEl.dataset.direction = inputDir;
    collectAtPlayer();
    checkPlayerCollision();
    if (tokenCount === 0 && player.x === gate.x && player.y === gate.y) completeLevel();
  }

  function validMoves(hazard) {
    const options = Object.keys(DIRS).filter((dir) => canMove(hazard.x, hazard.y, dir));
    if (options.length <= 1) return options;
    const withoutReverse = options.filter((dir) => dir !== opposite(hazard.dir));
    return withoutReverse.length ? withoutReverse : options;
  }

  function targetForHazard(hazard) {
    if (hazard.personality === 0) return { x: player.x, y: player.y };
    if (hazard.personality === 1 && inputDir && DIRS[inputDir]) {
      const d = DIRS[inputDir];
      return { x: Math.min(cols - 2, Math.max(1, player.x + d.x * 2)), y: Math.min(rows - 2, Math.max(1, player.y + d.y * 2)) };
    }
    return tokenCount < 10 ? { x: gate.x, y: gate.y } : { x: cols - 2, y: 1 };
  }

  function enemyChoice(hazard) {
    const options = validMoves(hazard);
    if (!options.length) return opposite(hazard.dir);
    const powered = performance.now() < powerUntil;
    const target = powered ? player : targetForHazard(hazard);
    const scored = options.map((dir) => {
      const next = movePoint(hazard, dir);
      const distance = gridDistance(next, target);
      const earlyLevelNoise = Math.max(0.35, 1.6 - level * 0.12);
      const jitter = Math.random() * earlyLevelNoise;
      return { dir, value: powered ? -distance + jitter : distance + jitter };
    });
    scored.sort((a, b) => a.value - b.value);
    return scored[0].dir;
  }

  function opposite(dir) {
    return dir === "left" ? "right" : dir === "right" ? "left" : dir === "up" ? "down" : "up";
  }

  function stepHazards(now) {
    hazards.forEach((hazard) => {
      const waiting = now < hazard.releaseAt;
      hazard.el.classList.toggle("waiting", waiting);
      if (waiting) return;
      const dir = enemyChoice(hazard);
      if (!canMove(hazard.x, hazard.y, dir)) return;
      const next = movePoint(hazard, dir);
      hazard.dir = dir;
      hazard.x = next.x;
      hazard.y = next.y;
      hazard.el.dataset.direction = dir;
    });
    checkPlayerCollision();
  }

  function checkPlayerCollision() {
    const now = performance.now();
    if (now < graceUntil) return;
    for (const hazard of hazards) {
      if (now < hazard.releaseAt || hazard.x !== player.x || hazard.y !== player.y) continue;
      if (now < powerUntil) {
        score += 400;
        hazard.x = hazard.startX;
        hazard.y = hazard.startY;
        hazard.releaseAt = now + 850;
        hazard.el.classList.add("waiting");
        flash("HAZARD REROUTED", 650);
        updateHud();
      } else {
        loseLife(now);
      }
      break;
    }
  }

  function resetPositions(now) {
    player.x = player.startX;
    player.y = player.startY;
    hazards.forEach((hazard, index) => {
      hazard.x = hazard.startX;
      hazard.y = hazard.startY;
      hazard.releaseAt = now + 900 + index * HAZARD_RELEASE_GAP_MS;
      hazard.el.classList.add("waiting");
    });
    inputDir = "";
    requestedDir = "";
    graceUntil = now + SPAWN_GRACE_MS;
    playerEl.classList.add("protected");
    window.setTimeout(() => playerEl.classList.remove("protected"), SPAWN_GRACE_MS);
    renderPositions();
  }

  function loseLife(now = performance.now()) {
    lives -= 1;
    updateHud();
    if (lives <= 0) {
      finish(false);
      return;
    }
    paused = true;
    powerUntil = 0;
    resetPositions(now);
    flash("ROUTE BLOCKED", RESPAWN_PAUSE_MS);
    window.setTimeout(() => {
      if (!running) return;
      paused = false;
      lastFrame = performance.now();
    }, RESPAWN_PAUSE_MS);
  }

  function completeLevel() {
    if (!running || paused) return;
    paused = true;
    score += 1000 + level * 100;
    updateHud();
    game.classList.add(level === LEVEL_COUNT ? "final-payoff" : "gate-payoff");
    flash(level === LEVEL_COUNT ? "NEW GATE REACHED" : "GATE REACHED", 1000);
    window.setTimeout(() => {
      game.classList.remove("gate-payoff", "final-payoff");
      if (level >= LEVEL_COUNT) finish(true);
      else {
        level += 1;
        setupLevel();
        paused = false;
        lastFrame = performance.now();
      }
    }, 1000);
  }

  function finish(success) {
    running = false;
    cancelAnimationFrame(raf);
    best = Math.max(best, score);
    localStorage.setItem(BEST_KEY, String(best));
    document.getElementById("result-title").textContent = success ? "GATE REACHED" : "CHASE ENDED";
    document.getElementById("result-copy").textContent = success
      ? "You cleared the terminal, collected the Approval Tokens and reached the new gate."
      : "The route closed before you reached the new gate. Try the terminal again.";
    document.getElementById("result-score").textContent = String(score).padStart(4, "0");
    document.getElementById("result-best").textContent = String(best).padStart(4, "0");
    showScreen("result");
  }

  function setupLevel() {
    parseBoard();
    buildMaze();
    const now = performance.now();
    spawnHazards(now);
    powerUntil = 0;
    graceUntil = now + SPAWN_GRACE_MS;
    playerTimer = 0;
    enemyTimer = 0;
    barrierTimer = 0;
    inputDir = "";
    requestedDir = "";
    game.dataset.level = String(level);
    game.dataset.theme = currentLevel().theme;
    playerEl.classList.add("protected");
    window.setTimeout(() => playerEl.classList.remove("protected"), SPAWN_GRACE_MS);
    updateHud();
    renderPositions();
    const intro = level === 1 ? "FIND THE NEW GATE" : level === 5 ? "GATE RUSH" : level === 10 ? "FINAL TERMINAL" : currentLevel().name.toUpperCase();
    flash(intro, 900);
  }

  function updatePowerState(now) {
    const active = now < powerUntil;
    hazards.forEach((hazard) => hazard.el.classList.toggle("safe", active));
    if (active) {
      const seconds = Math.max(1, Math.ceil((powerUntil - now) / 1000));
      powerStatus.textContent = `SAFE REROUTE · ${seconds}s`;
      powerStatus.classList.add("show");
    } else if (now < graceUntil) {
      powerStatus.textContent = "START ROUTE · PROTECTED";
      powerStatus.classList.add("show", "protected-status");
    } else {
      powerStatus.classList.remove("show", "protected-status");
    }
  }

  function updateBarrier(now) {
    if (!barrierCell) return;
    const untilToggle = BARRIER_CYCLE_MS - barrierTimer;
    const nextWarning = !barrierClosed && untilToggle <= BARRIER_WARNING_MS;
    if (nextWarning !== barrierWarning) {
      barrierWarning = nextWarning;
      updateBarrierCell();
    }
    if (barrierTimer < BARRIER_CYCLE_MS) return;
    const playerOnBarrier = player.x === barrierCell.x && player.y === barrierCell.y;
    const hazardOnBarrier = hazards.some((hazard) => hazard.x === barrierCell.x && hazard.y === barrierCell.y);
    if (!playerOnBarrier && !hazardOnBarrier) {
      barrierClosed = !barrierClosed;
      barrierWarning = false;
      updateBarrierCell();
      if (barrierClosed && level === 5) flash("ROUTE SWITCH", 520);
    }
    barrierTimer = 0;
  }

  function tick(now) {
    if (!running) return;
    const delta = Math.min(50, now - lastFrame || 16);
    lastFrame = now;
    if (!paused) {
      playerTimer += delta;
      enemyTimer += delta;
      barrierTimer += delta;
      if (playerTimer >= PLAYER_STEP_MS) {
        stepPlayer();
        playerTimer = 0;
      }
      if (enemyTimer >= currentLevel().enemyStepMs) {
        stepHazards(now);
        enemyTimer = 0;
      }
      updateBarrier(now);
      updatePowerState(now);
      renderPositions();
    }
    raf = requestAnimationFrame(tick);
  }

  function startGame() {
    level = 1;
    score = 0;
    lives = 3;
    paused = false;
    running = true;
    showScreen("game");
    setupLevel();
    lastFrame = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function setDirection(dir) {
    requestedDir = dir;
    if (!inputDir && canMove(player.x, player.y, dir)) inputDir = dir;
  }

  function setPause(next) {
    if (!running) return;
    paused = next;
    resumeOverlay.classList.toggle("hidden", !paused);
    if (!paused) lastFrame = performance.now();
  }

  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("again-button").addEventListener("click", startGame);
  document.getElementById("pause-button").addEventListener("click", () => setPause(!paused));
  resumeOverlay.addEventListener("click", () => setPause(false));

  const keyDirections = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
  document.addEventListener("keydown", (event) => {
    const dir = keyDirections[event.key];
    if (dir) {
      event.preventDefault();
      setDirection(dir);
      return;
    }
    if (event.key === "p" || event.key === "P" || event.key === "Escape") setPause(!paused);
  });

  [["up-button", "up"], ["down-button", "down"], ["left-button", "left"], ["right-button", "right"]].forEach(([id, dir]) => {
    const button = document.getElementById(id);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      setDirection(dir);
    });
  });

  let swipeStart = null;
  game.addEventListener("pointerdown", (event) => {
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  game.addEventListener("pointerup", (event) => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) setPause(true);
  });
  window.addEventListener("resize", renderPositions);
})();
