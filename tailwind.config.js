/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          border: "hsl(var(--card-border))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
          border: "hsl(var(--popover-border))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          border: "var(--destructive-border)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          "primary-border": "var(--sidebar-primary-border)",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          "accent-border": "var(--sidebar-accent-border)",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
      },
      fontFamily: {
        sans: ["var(--app-font-sans)"],
        serif: ["var(--app-font-serif)"],
        mono: ["var(--app-font-mono)"],
      },
      keyframes: {
        enter: {
          from: {
            opacity: "var(--tw-enter-opacity, 1)",
            transform:
              "translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1))",
          },
        },
        exit: {
          to: {
            opacity: "var(--tw-exit-opacity, 1)",
            transform:
              "translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1))",
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%, 70%, 100%": { opacity: "1" },
          "20%, 50%": { opacity: "0" },
        },
      },
      animation: {
        in: "enter 150ms ease",
        out: "exit 150ms ease",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [
    ({ addUtilities, matchUtilities, theme }) => {
      addUtilities({
        ".fade-in": { "--tw-enter-opacity": "0" },
        ".fade-out": { "--tw-exit-opacity": "0" },
        ".zoom-in": { "--tw-enter-scale": "0" },
        ".zoom-out": { "--tw-exit-scale": "0" },
        ".slide-in-from-top": { "--tw-enter-translate-y": "-100%" },
        ".slide-in-from-bottom": { "--tw-enter-translate-y": "100%" },
        ".slide-in-from-left": { "--tw-enter-translate-x": "-100%" },
        ".slide-in-from-right": { "--tw-enter-translate-x": "100%" },
        ".slide-out-to-top": { "--tw-exit-translate-y": "-100%" },
        ".slide-out-to-bottom": { "--tw-exit-translate-y": "100%" },
        ".slide-out-to-left": { "--tw-exit-translate-x": "-100%" },
        ".slide-out-to-right": { "--tw-exit-translate-x": "100%" },
      });

      matchUtilities(
        {
          "fade-in": (value) => ({ "--tw-enter-opacity": value }),
          "fade-out": (value) => ({ "--tw-exit-opacity": value }),
        },
        { values: theme("opacity") },
      );

      matchUtilities(
        {
          "zoom-in": (value) => ({ "--tw-enter-scale": value }),
          "zoom-out": (value) => ({ "--tw-exit-scale": value }),
        },
        { values: theme("scale") },
      );

      matchUtilities(
        {
          "slide-in-from-top": (value) => ({ "--tw-enter-translate-y": `-${value}` }),
          "slide-in-from-bottom": (value) => ({ "--tw-enter-translate-y": value }),
          "slide-in-from-left": (value) => ({ "--tw-enter-translate-x": `-${value}` }),
          "slide-in-from-right": (value) => ({ "--tw-enter-translate-x": value }),
          "slide-out-to-top": (value) => ({ "--tw-exit-translate-y": `-${value}` }),
          "slide-out-to-bottom": (value) => ({ "--tw-exit-translate-y": value }),
          "slide-out-to-left": (value) => ({ "--tw-exit-translate-x": `-${value}` }),
          "slide-out-to-right": (value) => ({ "--tw-exit-translate-x": value }),
        },
        { values: theme("translate") },
      );
    },
  ],
}
