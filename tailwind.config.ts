import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
