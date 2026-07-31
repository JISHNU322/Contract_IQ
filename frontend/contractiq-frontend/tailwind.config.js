/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        canvas: "#FAFAF9",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#14151A",
          muted: "#5B5F6B",
          faint: "#9497A3",
        },
        border: {
          DEFAULT: "#E4E4E7",
          strong: "#D1D1D6",
        },
        primary: {
          50: "#EEF0FA",
          100: "#DBDEF3",
          400: "#5A67B8",
          600: "#3A4699",
          700: "#2E3A8C",
          800: "#232C6E",
          900: "#1B2255",
        },
        accent: {
          50: "#ECFAF8",
          100: "#D3F2ED",
          500: "#0F9488",
          600: "#0F766E",
          700: "#0C5C56",
        },
        status: {
          uploaded: "#71717A",
          processing: "#D97706",
          parsed: "#059669",
          failed: "#DC2626",
        },
        severity: {
          low: "#CA8A04",
          medium: "#EA580C",
          high: "#DC2626",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(20, 21, 26, 0.04), 0 1px 3px 0 rgba(20, 21, 26, 0.06)",
        panel: "0 1px 3px 0 rgba(20, 21, 26, 0.06), 0 4px 12px -2px rgba(20, 21, 26, 0.05)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
