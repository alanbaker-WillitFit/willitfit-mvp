export const colours = {
  navy: { DEFAULT: "#0D1B3D", 50: "#E1E8F9", 100: "#C6D3F3", 200: "#97AFE9", 300: "#5179DA", 400: "#254EB0", 500: "#183271", 600: "#132757", 700: "#0D1B3D", 800: "#09132B", 900: "#050B18" },
  green: { DEFAULT: "#22C55E", 50: "#F2FDF6", 100: "#DFFBE9", 200: "#C5F5D7", 300: "#87EAAB", 400: "#4AE081", 500: "#22C55E", 600: "#1CA44E", 700: "#178640", 800: "#126B33", 900: "#0E5227" },
  amber: { DEFAULT: "#F59E0B", 100: "#FBDAA2", 500: "#F59E0B", 700: "#A06707" },
  red: { DEFAULT: "#EF4444", 100: "#FCD8D8", 500: "#EF4444", 700: "#C61111" },
  ink: "#101826",
  paper: "#FBFAF7",
} as const;

export const typography = {
  heading: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  body: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
  mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
};

export const radii = { card: "1rem", control: "0.75rem", pill: "9999px" } as const;
export const shadows = {
  soft: "0 4px 8px rgba(13, 27, 61, 0.03), 0 12px 32px rgba(13, 27, 61, 0.06)",
  lifted: "0 8px 20px rgba(13, 27, 61, 0.05), 0 20px 40px rgba(13, 27, 61, 0.08)",
} as const;
export const motion = { fast: "150ms", standard: "250ms", slow: "400ms" } as const;
