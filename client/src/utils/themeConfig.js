export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const THEME_STORAGE_KEY = 'theme';

export const themeConfig = {
  [THEMES.LIGHT]: {
    className: 'light',
    colors: {
    'text-primary': '#000000',
    'text-secondary': '#374151',
    'text-tertiary': '#4B5563',
    'text-muted': '#6B7280',
    'bg-primary': '#FFFFFF',
    'bg-secondary': '#F3F4F6',
    'bg-tertiary': '#E5E7EB',
    'border-primary': '#D1D5DB',
    'border-secondary': '#E5E7EB',
    'border-tertiary': '#F3F4F6',
    'overlay-bg': 'rgba(0, 0, 0, 0.5)',
    // Accent / brand colors (use darker shades in light mode)
    'accent-primary': '#A67C00',
    'accent-secondary': '#8C6A00',
    'accent-gradient-start': '#A67C00',
    'accent-gradient-end': '#FFD423',
    'link': '#004b99',
    'link-hover': '#003a7a',
    'selection-bg': '#A67C00',
    'glass-border': 'rgba(166,124,0,0.28)',
    'glass-glow': 'rgba(166,124,0,0.08)',
    'cursor-dot': '#CDA83F',
    'accent-primary-rgba-08': 'rgba(166,124,0,0.08)',
    'accent-primary-rgba-12': 'rgba(166,124,0,0.12)',
    'accent-primary-rgba-18': 'rgba(166,124,0,0.18)',
    'accent-primary-rgba-22': 'rgba(166,124,0,0.22)',
    'accent-primary-rgba-33': 'rgba(166,124,0,0.33)',
    },
  },
  [THEMES.DARK]: {
    className: 'dark',
    colors: {
    'text-primary': '#FFFFFF',
    'text-secondary': '#D1D5DB',
    'text-tertiary': '#9CA3AF',
    'text-muted': '#6B7280',
    'bg-primary': '#0F0F0F',
    'bg-secondary': '#1F2937',
    'bg-tertiary': '#374151',
    'border-primary': '#4B5563',
    'border-secondary': '#374151',
    'border-tertiary': '#1F2937',
    'overlay-bg': 'rgba(0, 0, 0, 0.6)',
    // Accent / brand colors (use lighter shades in dark mode)
    'accent-primary': '#FFD963',
    'accent-secondary': '#FFE28A',
    'accent-gradient-start': '#FFD963',
    'accent-gradient-end': '#FFF2B5',
    'link': '#99ccff',
    'link-hover': '#cce6ff',
    'selection-bg': '#FFD963',
    'glass-border': 'rgba(255,217,99,0.28)',
    'glass-glow': 'rgba(255,217,99,0.12)',
    'cursor-dot': '#FFD963',
        'accent-primary-rgba-08': 'rgba(255,217,99,0.08)',
        'accent-primary-rgba-12': 'rgba(255,217,99,0.12)',
        'accent-primary-rgba-18': 'rgba(255,217,99,0.18)',
        'accent-primary-rgba-22': 'rgba(255,217,99,0.22)',
        'accent-primary-rgba-33': 'rgba(255,217,99,0.33)',
        },
      },
    };

export const getThemeConfig = (theme) => themeConfig[theme] || themeConfig[THEMES.LIGHT];
