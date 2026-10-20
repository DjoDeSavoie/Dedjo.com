import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Charte typographique Dedjo (polices chargées dans src/main.tsx)
      fontFamily: {
        brand: ['"Young Serif"', "Georgia", "serif"], // nom de marque « Dedjo » uniquement
        display: ['"Fraunces Variable"', '"Fraunces"', "Georgia", "serif"], // titres et accroches
        body: ['"Nunito Variable"', '"Nunito"', "system-ui", "sans-serif"], // texte courant
      },
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
        // Logo-inspired colors
        "sky-blue": "hsl(var(--sky-blue))",
        "sky-blue-intense": "hsl(var(--sky-blue-intense))",
        "orange": "hsl(var(--orange))",
        "orange-intense": "hsl(var(--orange-intense))",
        "yellow": "hsl(var(--yellow))",
        "yellow-intense": "hsl(var(--yellow-intense))",
        // Section backgrounds
        "section-sky": "hsl(var(--section-sky))",
        "section-orange": "hsl(var(--section-orange))",
        "section-yellow": "hsl(var(--section-yellow))",
        "section-cream": "hsl(var(--section-cream))",
        // Handmade colors
        "handmade": "hsl(var(--handmade))",
        "handmade-dark": "hsl(var(--handmade-dark))",
        // Nom de marque « Dedjo » : bleu nuit sur fond clair, crème sur fond sombre
        "brand-night": "#163F6B",
        "brand-cream": "#FBF5E9",
        // Product colors (pastries) - more contrasted for salty
        "product-goet": "#7bc98a",
        "product-montagne": "#ffaa8c",
        "product-noix": "#c9a67a",
        "product-foret": "#ffb84d",
        "product-rose": "#ffa7e1",
        "product-raisin": "#b1a1ed",
        "product-chocolat": "#d4a87a",
        "product-croissant": "#f5d547",
        // Pizza colors
        "pizza-classique": "#ff6b6b",
        "pizza-flam": "#ffd9a0",
        "pizza-vege": "#98d89e",
        "pizza-praline": "#ffb3d9",
        "pizza-nut": "#c49870",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Jauge « livraison offerte » (page Commander)
        "jauge-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "jauge-bump": {
          "0%, 100%": { transform: "scaleY(1)" },
          "40%": { transform: "scaleY(1.8)" },
        },
        "jauge-reflet": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
        // Atelier : feuille qui monte du bas de l'écran
        "feuille": {
          from: { transform: "translateY(24px)", opacity: "0.6" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        // Particules : chaque grain part dans sa direction (--dx, --dy), puis retombe en s'effaçant
        "confetti": {
          "0%": { transform: "translate(-50%, 0) scale(1)", opacity: "1" },
          "70%": { transform: "translate(calc(-50% + var(--dx)), var(--dy)) scale(1)", opacity: "1" },
          "100%": { transform: "translate(calc(-50% + var(--dx)), calc(var(--dy) + 18px)) scale(0.5)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "jauge-pop": "jauge-pop 0.55s cubic-bezier(.34,1.56,.64,1) both",
        "jauge-bump": "jauge-bump 0.6s ease-out",
        "jauge-reflet": "jauge-reflet 0.9s ease-out 0.3s both",
        "confetti": "confetti 1s cubic-bezier(.2,.7,.3,1) both",
        "feuille": "feuille 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
