import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        approved: {
          DEFAULT: "hsl(var(--approved))",
          foreground: "hsl(var(--approved-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        primary2: {
          DEFAULT: "hsl(var(--primary-2))",
          foreground: "hsl(var(--primary-2-foreground))",
        },
        orange: {
          DEFAULT: "hsl(var(--orange))",
        },
        themebackground: "hsl(var(--theme-background))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        ticket: {
          yellow: {
            DEFAULT: "hsl(var(--ticket-yellow))",
            foreground: "hsl(var(--ticket-yellow-foreground))",
          },
          orange: {
            DEFAULT: "hsl(var(--ticket-orange))",
            foreground: "hsl(var(--ticket-orange-foreground))",
          },
          purple: {
            DEFAULT: "hsl(var(--ticket-purple))",
            foreground: "hsl(var(--ticket-purple-foreground))",
          },
          gray: {
            DEFAULT: "hsl(var(--ticket-gray))",
            foreground: "hsl(var(--ticket-gray-foreground))",
          },
          cyan: {
            DEFAULT: "hsl(var(--ticket-cyan))",
            foreground: "hsl(var(--ticket-cyan-foreground))",
          },
          green: {
            DEFAULT: "hsl(var(--ticket-green))",
            foreground: "hsl(var(--ticket-green-foreground))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
