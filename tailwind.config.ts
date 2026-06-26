import type { Config } from "tailwindcss";
const withMT = require("@material-tailwind/react/utils/withMT");
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8b5cf6",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInDelayed: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '30%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        borderFlow: {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '0.3' }
        },
        floatSlow: {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-20px, -20px)' },
          '100%': { transform: 'translate(0, 0)' }
        },
        floatMedium: {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20px, -10px)' },
          '100%': { transform: 'translate(0, 0)' }
        },
        floatFast: {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-10px, 20px)' },
          '100%': { transform: 'translate(0, 0)' }
        },
        glassShine: {
          '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        fadeInDelayed: 'fadeInDelayed 0.8s ease-out forwards',
        borderFlow: 'borderFlow 4s ease infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
        floatSlow: 'floatSlow 10s ease-in-out infinite',
        floatMedium: 'floatMedium 8s ease-in-out infinite',
        floatFast: 'floatFast 12s ease-in-out infinite',
        glassShine: 'glassShine 8s ease infinite'
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        "noto-sans": ["Noto Sans", "sans-serif"],
        "open-sans": ["Open Sans", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        "passion-one": ["Passion One", "sans-serif"],
        karla: ["Karla", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default withMT(config);
