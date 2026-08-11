(() => {
  "use strict";

  const game = document.getElementById("game");
  const field = document.getElementById("bag-field");
  const message = document.getElementById("message");
  const livesLabel = document.getElementById("lives-label");
  const levelLabel = document.getElementById("level-label");
  if (!game || !field || !message || !livesLabel || !levelLabel) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const comboWindowMs = 1400;
  let combo = 0;
  let lastClearAt = -Infinity;
  let previousLives = Number(livesLabel.textContent || 3);
  let impactTimer = 0;

  const feedback = document.createElement("div");
  feedback.className = "feedback-layer";
  feedback.setAttribute("aria-hidden", "true");
  feedback.innerHTML = '<div class="feedback-status" data-feedback-status></div><div class="combo-chip" data-combo-chip></div><div class="feedback-burst" data-feedback-burst></div>';
  game.appendChild(feedback);

  const status = feedback.querySelector("[data-feedback-status]");
  const comboChip = feedback.querySelector("[data-combo-chip]");
  const burst = feedback.querySelector("[data-feedback-burst]");

  function currentLevel() {
    const match = String(levelLabel.textContent || "").match(/\d+/);
    return match ? Number(match[0]) : 1;
  }

  function clearImpactClass() {
    game.classList.remove("feedback-hit", "feedback-heavy", "feedback-priority", "feedback-token-lost", "feedback-belt-clear", "feedback-final-clear");
  }

  function impact(kind, text, duration = 520) {
    window.clearTimeout(impactTimer);
    clearImpactClass();
    game.classList.add(`feedback-${kind}`);
    if (status) {
      status.textContent = text;
      status.classList.remove("show");
      void status.offsetWidth;
      status.classList.add("show");
    }
    impactTimer = window.setTimeout(() => {
      game.classList.remove(`feedback-${kind}`);
      if (status) status.classList.remove("show");
    }, reducedMotion ? Math.min(180, duration) : duration);
  }

  function updateCombo(now) {
    combo = now - lastClearAt <= comboWindowMs ? combo + 1 : 1;
    lastClearAt = now;
    if (!comboChip) return;
    if (combo < 3) {
      comboChip.classList.remove("show");
      comboChip.textContent = "";
      return;
    }
    comboChip.textContent = `${combo} BAG STREAK`;
    comboChip.classList.remove("show");
    void comboChip.offsetWidth;
    comboChip.classList.add("show");
  }

  function resetCombo() {
    combo = 0;
    lastClearAt = -Infinity;
    if (comboChip) {
      comboChip.classList.remove("show");
      comboChip.textContent = "";
    }
  }

  function placeBurst(bag) {
    if (!burst || reducedMotion) return;
    const gameRect = game.getBoundingClientRect();
    const bagRect = bag.getBoundingClientRect();
    burst.style.left = `${bagRect.left - gameRect.left + bagRect.width / 2}px`;
    burst.style.top = `${bagRect.top - gameRect.top + bagRect.height / 2}px`;
    burst.classList.remove("show");
    void burst.offsetWidth;
    burst.classList.add("show");
  }

  function registerBagState(bag) {
    if (!(bag instanceof HTMLElement) || !bag.classList.contains("bag")) return;

    if (bag.classList.contains("damaged") && !bag.dataset.feedbackDamaged) {
      bag.dataset.feedbackDamaged = "1";
      impact("heavy", "HEAVY BAG · ONE MORE HIT", 650);
    }

    if (bag.classList.contains("cleared") && !bag.dataset.feedbackCleared) {
      bag.dataset.feedbackCleared = "1";
      const now = performance.now();
      updateCombo(now);
      placeBurst(bag);
      if (bag.classList.contains("priority")) impact("priority", "PRIORITY BAG CLEARED", 720);
      else impact("hit", combo >= 3 ? `${combo} BAG STREAK` : "BAG ROUTED", 430);
    }
  }

  const bagObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes") registerBagState(mutation.target);
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            registerBagState(node);
            node.querySelectorAll?.(".bag").forEach(registerBagState);
          }
        });
      }
    }
  });
  bagObserver.observe(field, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });

  const livesObserver = new MutationObserver(() => {
    const nextLives = Number(livesLabel.textContent || previousLives);
    if (Number.isFinite(nextLives) && nextLives < previousLives) {
      resetCombo();
      impact("token-lost", "TOKEN RETURNED · STREAK RESET", 760);
    }
    previousLives = nextLives;
  });
  livesObserver.observe(livesLabel, { childList: true, characterData: true, subtree: true });

  const levelObserver = new MutationObserver(() => resetCombo());
  levelObserver.observe(levelLabel, { childList: true, characterData: true, subtree: true });

  const messageObserver = new MutationObserver(() => {
    const text = String(message.textContent || "").trim().toUpperCase();
    if (text === "BELT CLEAR") {
      resetCombo();
      impact("belt-clear", "ZONE CLEAR · ROUTE OPEN", 900);
    }
    if (text === "ROUTE CLEAR" && currentLevel() === 10) {
      resetCombo();
      impact("final-clear", "FINAL ROUTE CLEAR · BAG TO LOADING", 1350);
      game.classList.add("final-payoff");
      window.setTimeout(() => game.classList.remove("final-payoff"), reducedMotion ? 220 : 1350);
    }
  });
  messageObserver.observe(message, { childList: true, characterData: true, subtree: true });
})();
