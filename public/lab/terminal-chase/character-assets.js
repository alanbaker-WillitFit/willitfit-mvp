(() => {
  "use strict";

  // Terminal Chase character derivative contract.
  // Approved source assets remain authoritative; these are transparent,
  // game-specific derivatives created from the approved Female Traveller 04 set.
  window.WILLIT_TERMINAL_CHASE_CHARACTERS = Object.freeze({
    player: Object.freeze({
      down: "./sprites/player-down.png",
      up: "./sprites/player-up.png",
      left: "./sprites/player-left.png",
      right: "./sprites/player-right.png",
    }),
    hazards: Object.freeze({
      staff: null,
      cart: null,
      traveller: null,
      security: null,
    }),
  });
})();
