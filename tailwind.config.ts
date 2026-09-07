import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "var(--bg-primary)",
          card: "var(--bg-card)",
          "card-hover": "var(--bg-card-hover)",
          secondary: "var(--bg-secondary)",
          text: "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          muted: "var(--text-muted)",
          accent: "var(--accent)",
          "accent-hover": "var(--accent-hover)",
          border: "var(--border)",
          focus: "var(--border-focus)",
        },
        peacock: "#053229",
        spruce: "#355E58",
        lace: "#FFEDD1",
        arctic: "#BCDDDC",
        coral: "#FE9179",
        sapphire: "#72B0AB",
        sage: "#CFB97E",
        pistachio: "#B89D47",
      },
    },
  },
  plugins: [],
};
export default config;
