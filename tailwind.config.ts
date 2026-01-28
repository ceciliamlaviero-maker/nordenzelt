import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-white": "#FFFFFF",
        "brand-nordic-blue": "#1F3A5F",
        "brand-light-gray": "#E6E8EB",
        "brand-pine-green": "#2F4F4F",
        "brand-soft-gold": "#C9B27D",
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
