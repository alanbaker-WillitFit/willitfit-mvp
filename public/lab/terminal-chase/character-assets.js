(() => {
  "use strict";

  // Terminal Chase character derivative contract.
  // Approved source assets remain authoritative; these are transparent,
  // game-specific derivatives created from approved WillIt character sources.
  window.WILLIT_TERMINAL_CHASE_CHARACTERS = Object.freeze({
    player: Object.freeze({
      down: "./sprites/player-down.png",
      up: "./sprites/player-up.png",
      left: "./sprites/player-left.png",
      right: "./sprites/player-right.png",
    }),
    hazards: Object.freeze({
      staff: "./sprites/hazard-staff-female.png",
      cart: null,
      traveller: null,
      security: null,
    }),
  });
})();
