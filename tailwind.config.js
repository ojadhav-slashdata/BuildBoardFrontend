/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'surface': '#f9f9ff',
        'surface-bright': '#f9f9ff',
        'surface-dim': '#d3daea',
        'surface-container-low': '#f0f3ff',
        'surface-container': '#e7eefe',
        'surface-container-high': '#e2e8f8',
        'surface-container-highest': '#dce2f3',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#151c27',
        'on-surface-variant': '#464555',
        'on-background': '#151c27',
        'primary': 'var(--c-primary, #3525cd)',
        'primary-container': 'var(--c-primary-container, #4f46e5)',
        'primary-light': 'var(--c-primary-light, #6366f1)',
        'on-primary': '#ffffff',
        'on-primary-container': '#dad7ff',
        'secondary': 'var(--c-secondary, #525d83)',
        'secondary-container': '#c8d3ff',
        'on-secondary': '#ffffff',
        'tertiary': 'var(--c-tertiary, #3a4a54)',
        'outline': '#777587',
        'outline-variant': '#c7c4d8',
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'inverse-surface': '#2a313d',
        'inverse-on-surface': '#ebf1ff',
      },
      fontFamily: {
        'manrope': ['Manrope', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        'tight-headline': '-0.025em',
      },
      boxShadow: {
        'tonal': 'var(--shadow-tonal, 0 1px 3px 0 rgba(21,28,39,0.04), 0 1px 2px -1px rgba(21,28,39,0.04))',
        'tonal-md': 'var(--shadow-tonal-md, 0 4px 12px -2px rgba(21,28,39,0.06), 0 2px 6px -2px rgba(21,28,39,0.04))',
        'tonal-lg': 'var(--shadow-tonal-lg, 0 8px 24px -4px rgba(21,28,39,0.08), 0 4px 8px -4px rgba(21,28,39,0.04))',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
