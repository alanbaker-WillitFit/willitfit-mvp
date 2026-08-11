(() => {
  "use strict";

  const game = document.getElementById("game");
  const levelLabel = document.getElementById("level-label");
  const routeTitle = document.querySelector(".route-header strong");
  if (!game || !levelLabel) return;

  const atmosphereForLevel = (level) => {
    if (level >= 10) return { band: "final", title: "FINAL LOADING ROUTE", zone: "ZONE 10" };
    if (level >= 7) return { band: "priority", title: "PRIORITY BAG ROUTE", zone: `ZONE ${level}` };
    if (level >= 5) return { band: "heavy", title: "HEAVY BAG SORT", zone: `ZONE ${level}` };
    if (level >= 4) return { band: "moving", title: "MOVING BELT SORT", zone: `ZONE ${level}` };
    return { band: "intro", title: "BAGGAGE SORTING ROUTE", zone: `ZONE ${level}` };
  };

  const applyAtmosphere = () => {
    const parsed = Number.parseInt(levelLabel.textContent || "1", 10);
    const level = Number.isFinite(parsed) ? Math.max(1, Math.min(10, parsed)) : 1;
    const atmosphere = atmosphereForLevel(level);
    game.dataset.level = String(level);
    game.dataset.atmosphere = atmosphere.band;
    game.dataset.zone = atmosphere.zone;
    if (routeTitle) routeTitle.textContent = atmosphere.title;
  };

  new MutationObserver(applyAtmosphere).observe(levelLabel, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  applyAtmosphere();
})();
