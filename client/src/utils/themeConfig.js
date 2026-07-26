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
    },
  },
};

export const getThemeConfig = (theme) => themeConfig[theme] || themeConfig[THEMES.LIGHT];
