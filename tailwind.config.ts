import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./client/src/**/*.{ts,tsx}",
    "./client/index.html",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom module colors
        hr: {
          DEFAULT: "hsl(var(--hr-primary))",
          foreground: "hsl(var(--hr-foreground))",
        },
        leaderboard: {
          DEFAULT: "hsl(var(--leaderboard-primary))",
          foreground: "hsl(var(--leaderboard-foreground))",
        },
        training: {
          DEFAULT: "hsl(var(--training-primary))",
          foreground: "hsl(var(--training-foreground))",
        },
        field: {
          DEFAULT: "hsl(var(--field-primary))",
          foreground: "hsl(var(--field-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        celebration: {
          "0%, 100%": { transform: "scale(1) rotate(0deg)" },
          "25%": { transform: "scale(1.05) rotate(2deg)" },
          "75%": { transform: "scale(1.05) rotate(-2deg)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scroll: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        celebration: "celebration 2s ease-in-out infinite",
        fadeIn: "fadeIn 0.5s ease-out",
        scroll: "scroll 20s linear infinite",
      },
      dropShadow: {
        glow: [
          "0 0 10px rgba(255, 255, 255, 0.35)",
          "0 0 20px rgba(255, 255, 255, 0.2)"
        ],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
