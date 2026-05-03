import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Exclude log files from content scanning to prevent build artifacts being processed as class names
  safelist: [],
  theme: {
    extend: {
      borderColor: {
        input: "rgb(var(--input))",
        ring: "var(--ring)",
      },
      colors: {
        input: "rgb(var(--input))",
        ring: "var(--ring)",
      },
    },
  },
  plugins: [],
};

export default config;
