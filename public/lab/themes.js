window.WILLITFLY_THEMES = {
  default: {
    id: "default",
    label: "Original",
    accessory: "",
    collectibleSwap: {},
    particles: "",
    skyClass: "theme-default"
  },
  summer: {
    id: "summer",
    label: "Summer",
    accessory: "🕶️",
    collectibleSwap: { security: "☀️" },
    particles: "☀️",
    skyClass: "theme-summer"
  },
  christmas: {
    id: "christmas",
    label: "Christmas",
    accessory: "🎅",
    collectibleSwap: { boarding: "🎁" },
    particles: "❄️",
    skyClass: "theme-christmas"
  },
  easter: {
    id: "easter",
    label: "Easter",
    accessory: "🐰",
    collectibleSwap: { passport: "🥚" },
    particles: "🌸",
    skyClass: "theme-easter"
  },
  fringe: {
    id: "fringe",
    label: "Fringe",
    accessory: "🎭",
    collectibleSwap: { security: "🎟️" },
    particles: "🎉",
    skyClass: "theme-fringe"
  }
};

window.WILLITFLY_THEME_ORDER = ["default", "summer", "christmas", "easter", "fringe"];

window.getAutomaticWillItFlyTheme = function(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 12 && day >= 1) return "christmas";
  if (month === 4) return "easter";
  if (month >= 6 && month <= 8) return "summer";
  if (month === 8) return "fringe";
  return "default";
};
