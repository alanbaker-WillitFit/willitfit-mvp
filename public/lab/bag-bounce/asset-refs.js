(() => {
  "use strict";
  const drive = (id) => `https://drive.google.com/uc?export=view&id=${id}`;
  window.WILLIT_BAG_BOUNCE_ASSETS = Object.freeze({
    approvalToken: drive("1HlxANuv0gjjqQGwMfIKSW9sFVrb9y8OV"),
    playerBag: drive("1J5nE20QlhaWDv-DpGK5WUQniuXDF7Ham"),
    standardBag: drive("1CcTeFvedpdUfZWyvsca3rQbw4V-xNNWv"),
    introAgent: drive("12yX70NOWAO3v4_e-u7UUFM-5FWSCY4yy"),
    outroAgent: drive("1a-JzJj_oWIbgdyibteTwKN1yDhKfKVw6")
  });
})();