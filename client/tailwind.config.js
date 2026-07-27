module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Accent colors mapped to CSS variables so they adapt to theme
        gold: 'var(--accent-primary)',
        goldDark: 'var(--accent-secondary)',
        dark: '#0F0F0F',
        // Neutral text colors with dark mode variants
        textLight: {
          primary: '#000000',
          secondary: '#1F2937',
          tertiary: '#4B5563',
          disabled: '#9CA3AF',
        },
        textDark: {
          primary: '#FFFFFF',
          secondary: '#E5E7EB',
          tertiary: '#D1D5DB',
          disabled: '#6B7280',
        },
        // Neutral background colors with dark mode variants
        bgLight: {
          primary: '#FFFFFF',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6',
        },
        bgDark: {
          primary: '#111827',
          secondary: '#1F2937',
          tertiary: '#374151',
        },
        // Border colors with dark mode variants
        borderLight: {
          primary: '#E5E7EB',
          secondary: '#D1D5DB',
          tertiary: '#9CA3AF',
        },
        borderDark: {
          primary: '#374151',
          secondary: '#4B5563',
          tertiary: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      borderColor: {
        gold: '#FFD700',
      },
    },
  },
  plugins: [],
}