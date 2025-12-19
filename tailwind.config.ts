import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F5F5FF",
          100: "#EBEBFF",
          200: "#D6D6FF",
          300: "#B8B8FF",
          400: "#9A9AFF",
          500: "#615FFF",
          600: "#615FFF",
        },
        stone: {
          0: "#FFFFFF",
          50: "#FBFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
        primary: {
          DEFAULT: "#7C3AED",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#7C3AED",
          600: "#6B46C1",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B1A6E",
        },
        accent: {
          DEFAULT: "#E16540",
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#E16540",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        dark: {
          DEFAULT: "#282828",
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#282828",
          900: "#111827",
        },
        // Success/Positive (Green)
        success: {
          DEFAULT: "#10B981", // Green for positive indicators, checkmarks
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        // Danger/Negative (Red)
        danger: {
          DEFAULT: "#EF4444", // Red for negative indicators, errors
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        // Background colors
        background: {
          DEFAULT: "#FFFFFF", // White background for most sections
          secondary: "#FBFAF9", // Off-white for subtle backgrounds
          dark: "#282828", // Dark background for footer
        },
        // Text colors
        text: {
          primary: "#282828", // Dark text for headings and body
          secondary: "#9CA3AF", // Gray text for secondary content
          muted: "#6B7280", // Muted text
          inverse: "#FFFFFF", // White text for dark backgrounds
        },
        // Border colors
        border: {
          DEFAULT: "#E5E7EB", // Light gray for borders
          light: "#E0E0E0", // Lighter gray
          medium: "#CCCCCC", // Medium gray
          dark: "#9CA3AF", // Darker gray
        },
        // Legacy aliases for backward compatibility
        secondary: "#282828",
        textPrimary: "#282828",
        textSecondary: "#9CA3AF",
        borderColor: "#CCCCCC",
      },
      fontFamily: {
        cooper: ["Georgia", "serif"],
        mono: ["ui-monospace", "monospace"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "0.75rem", // Consistent rounded corners for cards
        button: "0.5rem", // Rounded corners for buttons
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "pricing-highlight":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      spacing: {
        section: "5rem", // Generous vertical spacing between sections
        "card-padding": "1.5rem", // Consistent padding for cards
        30: "7.5rem",
        100: "25rem",
      },
      lineHeight: {
        120: "1.2",
        22: "1.375rem",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
