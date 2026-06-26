import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0E2A47",
          50: "#EEF2F7",
          100: "#D8E1EC",
          200: "#B2C3D9",
          300: "#7E96B8",
          400: "#4D6993",
          500: "#27456D",
          600: "#1B345A",
          700: "#0E2A47", // primary
          800: "#0A1F35",
          900: "#061322",
        },
        green: {
          DEFAULT: "#179A72",
          50: "#EAFBF4",
          100: "#CDF4E3",
          200: "#9CE8C8",
          300: "#65D6A8",
          400: "#33C189",
          500: "#179A72", // primary accent
          600: "#11795B",
          700: "#0C5B45",
          800: "#083F30",
          900: "#04261D",
        },
        amber: {
          DEFAULT: "#F0A93B",
          100: "#FDEBCB",
          500: "#F0A93B",
          700: "#B97A19",
        },
        coral: {
          DEFAULT: "#E15B4F",
          100: "#FBDAD6",
          500: "#E15B4F",
          700: "#A33A31",
        },
        ink: "#101826",
        paper: "#FBFAF7",
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(14, 42, 71, 0.06), 0 12px 32px rgba(14, 42, 71, 0.08)",
        liftedh: "0 8px 24px rgba(14, 42, 71, 0.12), 0 24px 48px rgba(14, 42, 71, 0.10)",
      },
      maxWidth: {
        prose: "68ch",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
