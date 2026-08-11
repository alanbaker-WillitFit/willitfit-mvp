(() => {
  "use strict";

  // Governed RC1 web derivatives held in WillItFly 14_Assets/game-web-assets.
  // All four game sprites are transparent, consistently framed and face right,
  // matching the left-to-right flight direction. Source masters remain governed in Drive.
  const REVISION = "rc1-loop2-right-facing";
  window.WILLITFLY_APPROVED_CRAFT_ASSETS = Object.freeze({
    4: `https://drive.google.com/uc?export=view&id=1_86SiYL-L5NfqB_xmDk726-GGt8j1klX&v=${REVISION}`,
    6: `https://drive.google.com/uc?export=view&id=1ojituB3kuN0Bs-yYyyRisD-T8E06WGC7&v=${REVISION}`,
    2: `https://drive.google.com/uc?export=view&id=1MHHK2TaF8aOC7qJ5t6-81Ds_f4JPVfIA&v=${REVISION}`,
    1: `https://drive.google.com/uc?export=view&id=1e0ZEK1IDYoTyCCTo9gCP6AtbMX8xJLlE&v=${REVISION}`
  });
})();