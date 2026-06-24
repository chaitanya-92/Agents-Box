import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(255,255,255,0.14)",
        background: "#0b0d0f",
        foreground: "#f5f7fb",
        muted: "#8a90a0",
        panel: "#111416"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.1), 0 0 40px rgba(148, 201, 255, 0.08)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

