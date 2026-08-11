(() => {
  "use strict";

  const LEVEL_COUNT = 10;
  const BEST_KEY = "willitlab.terminal-chase.best";
  const TICK_MS = 92;
  const ENEMY_TYPES = ["staff", "cart", "traveller", "security", "staff"];
  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const LEVELS = [
    { name: "Gate Change", zone: "Concourse A", enemyCount: 2, enemyStepMs: 440, powerMs: 6500, movingBarrier: false, tunnel: false, map: 0, gate: "A12" },
    { name: "Busy Terminal", zone: "Concourse B", enemyCount: 2, enemyStepMs: 420, powerMs: 6200, movingBarrier: false, tunnel: true, map: 1, gate: "B18" },
    { name: "Security Split", zone: "Security Hall", enemyCount: 3, enemyStepMs: 400, powerMs: 5900, movingBarrier: false, tunnel: true, map: 2, gate: "C07" },
    { name: "Moving Walkway", zone: "Central Concourse", enemyCount: 3, enemyStepMs: 380, powerMs: 5600, movingBarrier: true, tunnel: true, map: 0, gate: "D22" },
    { name: "Gate Rush", zone: "Pier 5", enemyCount: 3, enemyStepMs: 360, powerMs: 5300, movingBarrier: true, tunnel: true, map: 1, gate: "E14" },
    { name: "Cross Terminal", zone: "Connections", enemyCount: 4, enemyStepMs: 345, powerMs: 5000, movingBarrier: true, tunnel: true, map: 2, gate: "F31" },
    { name: "Priority Route", zone: "Gate 27", enemyCount: 4, enemyStepMs: 330, powerMs: 4700, movingBarrier: true, tunnel: true, map: 0, gate: "G27" },
    { name: "Last Transfer", zone: "Satellite Terminal", enemyCount: 4, enemyStepMs: 315, powerMs: 4400, movingBarrier: true, tunnel: true, map: 1, gate: "H09" },
    { name: "Final Call", zone: "Departure Pier", enemyCount: 5, enemyStepMs: 300, powerMs: 4100, movingBarrier: true, tunnel: true, map: 2, gate: "J16" },
    { name: "Terminal Chase", zone: "New Gate", enemyCount: 5, enemyStepMs: 285, powerMs: 3800, movingBarrier: true, tunnel: true, map: 0, gate: "K42" },
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
  let inputDir = "";
  let requestedDir = "";
  let playerTimer = 0;
  let enemyTimer = 0;
  let barrierTimer = 0;
  let lastFrame = 0;
  let barrierClosed = false;
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
    barrierCell = currentLevel().movingBarrier ? { x: Math.floor(cols / 2), y: 7 } : null;
    barrierClosed = false;

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

  function isWall(x, y) {
    if (y < 0 || y >= rows) return true;
    if (x < 0 || x >= cols) return !currentLevel().tunnel;
    const nx = (x + cols) % cols;
    if (barrierCell && barrierClosed && nx === barrierCell.x && y === barrierCell.y) return true;
    return board[y][nx] === "#";
  }

  function normalizeX(x) {
    if (x < 0) return cols - 1;
    if (x >= cols) return 0;
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
  }

  function spawnHazards() {
    hazards.forEach((hazard) => hazard.el.remove());
    hazards = [];
    const starts = [
      { x: 8, y: 7 }, { x: 7, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 8 }, { x: 8, y: 6 },
    ];
    const count = currentLevel().enemyCount;
    for (let index = 0; index < count; index += 1) {
      const start = starts[index % starts.length];
      const el = document.createElement("div");
      const type = ENEMY_TYPES[index % ENEMY_TYPES.length];
      el.className = `hazard ${type}`;
      el.textContent = type === "staff" ? "STA" : type === "cart" ? "CART" : type === "security" ? "SEC" : "PAX";
      game.appendChild(el);
      hazards.push({ x: start.x, y: start.y, startX: start.x, startY: start.y, dir: "left", type, el });
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
    remainingLabel.textContent = `${tokenCount} left`;
    gateLabel.textContent = currentLevel().gate;
    gateEl.classList.toggle("locked", tokenCount > 0);
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
    }
    updateHud();
  }

  function canMove(x, y, dir) {
    const delta = DIRS[dir];
    if (!delta) return false;
    return !isWall(x + delta.x, y + delta.y);
  }

  function stepPlayer() {
    if (requestedDir && canMove(player.x, player.y, requestedDir)) inputDir = requestedDir;
    if (!inputDir || !canMove(player.x, player.y, inputDir)) return;
    const delta = DIRS[inputDir];
    player.x = normalizeX(player.x + delta.x);
    player.y += delta.y;
    collectAtPlayer();
    checkPlayerCollision();
    if (tokenCount === 0 && player.x === gate.x && player.y === gate.y) completeLevel();
  }

  function validMoves(hazard) {
    return Object.keys(DIRS).filter((dir) => canMove(hazard.x, hazard.y, dir));
  }

  function enemyChoice(hazard) {
    const options = validMoves(hazard);
    if (!options.length) return hazard.dir;
    const powered = performance.now() < powerUntil;
    const scored = options.map((dir) => {
      const d = DIRS[dir];
      const nx = normalizeX(hazard.x + d.x);
      const ny = hazard.y + d.y;
      const distance = Math.abs(nx - player.x) + Math.abs(ny - player.y);
      const turnPenalty = dir === opposite(hazard.dir) ? 2.2 : 0;
      const jitter = Math.random() * 2.4;
      return { dir, value: powered ? -(distance + jitter) + turnPenalty : distance + turnPenalty + jitter };
    });
    scored.sort((a, b) => a.value - b.value);
    return scored[0].dir;
  }

  function opposite(dir) {
    return dir === "left" ? "right" : dir === "right" ? "left" : dir === "up" ? "down" : "up";
  }

  function stepHazards() {
    hazards.forEach((hazard) => {
      const dir = enemyChoice(hazard);
      if (!canMove(hazard.x, hazard.y, dir)) return;
      const delta = DIRS[dir];
      hazard.dir = dir;
      hazard.x = normalizeX(hazard.x + delta.x);
      hazard.y += delta.y;
    });
    checkPlayerCollision();
  }

  function checkPlayerCollision() {
    for (const hazard of hazards) {
      if (hazard.x !== player.x || hazard.y !== player.y) continue;
      if (performance.now() < powerUntil) {
        score += 400;
        hazard.x = hazard.startX;
        hazard.y = hazard.startY;
        flash("HAZARD REROUTED", 650);
        updateHud();
      } else {
        loseLife();
      }
      break;
    }
  }

  function loseLife() {
    lives -= 1;
    updateHud();
    if (lives <= 0) {
      finish(false);
      return;
    }
    paused = true;
    player.x = player.startX;
    player.y = player.startY;
    hazards.forEach((hazard) => {
      hazard.x = hazard.startX;
      hazard.y = hazard.startY;
    });
    inputDir = "";
    requestedDir = "";
    flash("ROUTE BLOCKED", 900);
    window.setTimeout(() => {
      paused = false;
    }, 900);
  }

  function completeLevel() {
    if (!running) return;
    paused = true;
    score += 1000 + level * 100;
    updateHud();
    flash(level === LEVEL_COUNT ? "NEW GATE REACHED" : "GATE REACHED", 1000);
    window.setTimeout(() => {
      if (level >= LEVEL_COUNT) finish(true);
      else {
        level += 1;
        setupLevel();
        paused = false;
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
    spawnHazards();
    powerUntil = 0;
    playerTimer = 0;
    enemyTimer = 0;
    barrierTimer = 0;
    inputDir = "";
    requestedDir = "";
    game.dataset.level = String(level);
    game.dataset.theme = currentLevel().map === 2 ? "security" : level >= 9 ? "final" : "terminal";
    updateHud();
    renderPositions();
    flash(currentLevel().name.toUpperCase(), 900);
  }

  function updatePowerState(now) {
    const active = now < powerUntil;
    hazards.forEach((hazard) => hazard.el.classList.toggle("safe", active));
    if (active) {
      const seconds = Math.max(1, Math.ceil((powerUntil - now) / 1000));
      powerStatus.textContent = `SAFE REROUTE · ${seconds}s`;
      powerStatus.classList.add("show");
    } else {
      powerStatus.classList.remove("show");
    }
  }

  function tick(now) {
    if (!running) return;
    const delta = Math.min(50, now - lastFrame || 16);
    lastFrame = now;
    if (!paused) {
      playerTimer += delta;
      enemyTimer += delta;
      barrierTimer += delta;
      if (playerTimer >= TICK_MS) {
        stepPlayer();
        playerTimer = 0;
      }
      if (enemyTimer >= currentLevel().enemyStepMs) {
        stepHazards();
        enemyTimer = 0;
      }
      if (barrierCell && barrierTimer >= 2600) {
        const playerOnBarrier = player.x === barrierCell.x && player.y === barrierCell.y;
        const hazardOnBarrier = hazards.some((hazard) => hazard.x === barrierCell.x && hazard.y === barrierCell.y);
        if (!playerOnBarrier && !hazardOnBarrier) {
          barrierClosed = !barrierClosed;
          updateBarrierCell();
        }
        barrierTimer = 0;
      }
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
    if (!inputDir) inputDir = dir;
  }

  function setPause(next) {
    if (!running) return;
    paused = next;
    resumeOverlay.classList.toggle("hidden", !paused);
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
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) setPause(true);
  });
  window.addEventListener("resize", renderPositions);
})();
