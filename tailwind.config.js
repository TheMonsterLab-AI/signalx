/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Exact color system from Stitch design files ──────────────────────
      colors: {
        // Primary greens
        "primary":                  "#006c4d",
        "primary-container":        "#3eb489",
        "primary-fixed":            "#86f8c8",
        "primary-fixed-dim":        "#69dbad",
        "on-primary":               "#ffffff",
        "on-primary-container":     "#00402d",
        "on-primary-fixed":         "#002115",
        "on-primary-fixed-variant": "#005139",
        "inverse-primary":          "#69dbad",
        "surface-tint":             "#006c4d",

        // Secondary
        "secondary":                    "#4a6455",
        "secondary-container":          "#ccead7",
        "secondary-fixed":              "#ccead7",
        "secondary-fixed-dim":          "#b0cdbb",
        "on-secondary":                 "#ffffff",
        "on-secondary-container":       "#506a5b",
        "on-secondary-fixed":           "#062015",
        "on-secondary-fixed-variant":   "#324c3e",

        // Tertiary / Error
        "tertiary":                     "#9c413f",
        "tertiary-container":           "#ef817d",
        "tertiary-fixed":               "#ffdad7",
        "tertiary-fixed-dim":           "#ffb3af",
        "on-tertiary":                  "#ffffff",
        "on-tertiary-container":        "#691b1c",
        "on-tertiary-fixed":            "#410005",
        "on-tertiary-fixed-variant":    "#7e2a2a",
        "error":                        "#ba1a1a",
        "error-container":              "#ffdad6",
        "on-error":                     "#ffffff",
        "on-error-container":           "#93000a",

        // Surface
        "background":                   "#f3fbf5",
        "surface":                      "#f3fbf5",
        "surface-bright":               "#f3fbf5",
        "surface-dim":                  "#d4dcd6",
        "surface-variant":              "#dce4df",
        "surface-container-lowest":     "#ffffff",
        "surface-container-low":        "#eef6f0",
        "surface-container":            "#e8f0ea",
        "surface-container-high":       "#e2eae4",
        "surface-container-highest":    "#dce4df",
        "inverse-surface":              "#2a322e",
        "inverse-on-surface":           "#ebf3ed",

        // On-surface
        "on-background":                "#161d1a",
        "on-surface":                   "#161d1a",
        "on-surface-variant":           "#3d4943",

        // Outline
        "outline":                      "#6d7a72",
        "outline-variant":              "#bccac1",
      },

      fontFamily: {
        headline: ['Inter', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Inter', 'sans-serif'],
      },

      borderRadius: {
        DEFAULT: '0.25rem',
        lg:      '0.5rem',
        xl:      '0.75rem',
        '2xl':   '1rem',
        '3xl':   '1.5rem',
        full:    '9999px',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'globe-spin': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
