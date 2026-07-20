import type { Config } from "tailwindcss";
import { colours, radii, shadows, typography } from "./tokens/designTokens";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  // Recovery components are authored as semantic CSS rather than utility
  // strings. Keep their selectors in optimized production output.
  safelist: [
    "wf-bag-visual",
    "wf-bag-visual__status",
    "wf-primary-journey",
    "has-rail",
    "wf-affiliate-rail",
    "wf-affiliate-fixture",
    "wf-top-airlines",
    "wf-home-tips",
    "wf-home-tips__grid",
    "wf-section-heading",
    "wf-mobile-recommendation",
    "wf-trust-strip",
    "wf-runtime-source",
    "wf-compact-footer",
    "wf-footer-tagline",
    "wf-travel-essentials",
    "wf-travel-essentials--grid",
    "wf-travel-essentials--rail",
    "wf-travel-essentials__cards",
    "wf-travel-essentials-mobile",
    "wf-essential-card",
    "wf-essential-card__image",
    "wf-essential-card__copy",
    "wf-essentials-overlay",
    "wf-essentials-sheet",
    "wf-essentials-sheet__header",
    "wf-essentials-sheet__content",
    "wf-home-workspace",
    "wf-home-workspace__main",
  ],
  theme: {
    extend: {
      colors: colours,
      fontFamily: typography,
      borderRadius: { card: radii.card },
      boxShadow: shadows,
      maxWidth: { prose: "68ch" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 0.4s ease-out forwards" },
    },
  },
  plugins: [],
};

export default config;
