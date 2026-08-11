(() => {
  "use strict";

  const assets = window.WILLIT_TERMINAL_CHASE_CHARACTERS;
  if (!assets) return;

  const applySprite = (element, source) => {
    if (!element || !source || element.dataset.spriteReady === "true") return;
    const image = document.createElement("img");
    image.className = "character-sprite";
    image.src = source;
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.addEventListener("load", () => {
      element.classList.add("has-character-sprite");
      element.dataset.spriteReady = "true";
    }, { once: true });
    image.addEventListener("error", () => image.remove(), { once: true });
    element.appendChild(image);
  };

  const installDirectionalPlayer = () => {
    const element = document.getElementById("player");
    const sources = assets.player;
    if (!element || !sources || element.dataset.directionalSprite === "true") return;

    const image = document.createElement("img");
    image.className = "character-sprite";
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.src = sources.down;

    let previousLeft = Number.parseFloat(element.style.left || "0");
    let previousTop = Number.parseFloat(element.style.top || "0");
    let direction = "down";

    const updateDirection = () => {
      const left = Number.parseFloat(element.style.left || "0");
      const top = Number.parseFloat(element.style.top || "0");
      const dx = left - previousLeft;
      const dy = top - previousTop;
      previousLeft = left;
      previousTop = top;
      if (Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25) return;
      const nextDirection = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up");
      if (nextDirection !== direction && sources[nextDirection]) {
        direction = nextDirection;
        image.src = sources[direction];
      }
    };

    image.addEventListener("load", () => {
      element.classList.add("has-character-sprite");
      element.dataset.spriteReady = "true";
      element.dataset.directionalSprite = "true";
    }, { once: true });
    image.addEventListener("error", () => image.remove(), { once: true });
    element.appendChild(image);
    new MutationObserver(updateDirection).observe(element, { attributes: true, attributeFilter: ["style"] });
  };

  const hydrate = () => {
    installDirectionalPlayer();
    document.querySelectorAll(".hazard").forEach((hazard) => {
      const type = ["staff", "cart", "traveller", "security"].find((name) => hazard.classList.contains(name));
      if (type) applySprite(hazard, assets.hazards?.[type]);
    });
  };

  hydrate();
  const game = document.getElementById("game");
  if (game) new MutationObserver(hydrate).observe(game, { childList: true, subtree: false });
})();
