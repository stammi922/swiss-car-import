import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'swiss-red': '#FF0000',
        'swiss-red-dark': '#CC0000',
        'swiss-red-light': '#FFF0F0',
        'dark': '#1a1a1a',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
