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

  const hydrate = () => {
    applySprite(document.getElementById("player"), assets.player);
    document.querySelectorAll(".hazard").forEach((hazard) => {
      const type = ["staff", "cart", "traveller", "security"].find((name) => hazard.classList.contains(name));
      if (type) applySprite(hazard, assets.hazards?.[type]);
    });
  };

  hydrate();
  const game = document.getElementById("game");
  if (game) new MutationObserver(hydrate).observe(game, { childList: true, subtree: false });
})();
