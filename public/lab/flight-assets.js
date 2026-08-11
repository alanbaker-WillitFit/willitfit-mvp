(() => {
  "use strict";

  // Governed RC1 web derivatives held in the WillItFly 14_Assets/game-web-assets folder.
  // This bridge keeps the Lab prototype on the approved four-craft progression until
  // the binary derivatives are folded into the production deployment package.
  const assets = {
    4: "https://drive.google.com/uc?export=view&id=1_86SiYL-L5NfqB_xmDk726-GGt8j1klX",
    6: "https://drive.google.com/uc?export=view&id=1ojituB3kuN0Bs-yYyyRisD-T8E06WGC7",
    2: "https://drive.google.com/uc?export=view&id=1MHHK2TaF8aOC7qJ5t6-81Ds_f4JPVfIA",
    1: "https://drive.google.com/uc?export=view&id=1e0ZEK1IDYoTyCCTo9gCP6AtbMX8xJLlE"
  };

  function craftForLevel(level) {
    if (level <= 4) return 4;
    if (level <= 9) return 6;
    if (level <= 14) return 2;
    return 1;
  }

  function currentLevel() {
    const label = document.getElementById("level-label");
    const match = label?.textContent?.match(/\d+/);
    return match ? Math.max(1, Math.min(20, Number(match[0]))) : 1;
  }

  function applyApprovedCraft() {
    const player = document.getElementById("player-sprite");
    if (!player) return;
    const source = assets[craftForLevel(currentLevel())];
    if (player.src !== source) player.src = source;
  }

  const label = document.getElementById("level-label");
  if (label) {
    new MutationObserver(applyApprovedCraft).observe(label, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  window.WILLITFLY_APPROVED_CRAFT_ASSETS = Object.freeze({ ...assets });
  applyApprovedCraft();
})();
