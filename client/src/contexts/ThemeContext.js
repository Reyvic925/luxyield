import React, { createContext, useState, useEffect, useCallback } from 'react';
import { themeConfig, THEMES, THEME_STORAGE_KEY } from '../utils/themeConfig';

// Create the Theme Context
export const ThemeContext = createContext();

// Define theme modes for user preference selection
export const THEME_MODES = {
  LIGHT: THEMES.LIGHT,
  DARK: THEMES.DARK,
  SYSTEM: 'system',
};

// Themes map to CSS class names
const THEME_CLASS_MAP = {
  [THEMES.LIGHT]: themeConfig[THEMES.LIGHT].className,
  [THEMES.DARK]: themeConfig[THEMES.DARK].className,
};

// Default theme mode when no preference is set
const DEFAULT_THEME_MODE = THEME_MODES.SYSTEM;

const isValidThemeMode = (value) =>
  [THEME_MODES.LIGHT, THEME_MODES.DARK, THEME_MODES.SYSTEM].includes(value);

/**
 * ThemeProvider component that manages theme state and provides theme utilities
 * Handles system preference detection, localStorage persistence, and real-time OS theme detection
 */
export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(DEFAULT_THEME_MODE);
  const [theme, setThemeState] = useState(THEMES.LIGHT);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaQueryListener, setMediaQueryListener] = useState(null);

  /**
   * Applies the theme class to the document element
   * Prevents FOUC (Flash of Unstyled Content) by updating DOM immediately
   */
  const applyThemeToDOM = useCallback((resolvedTheme) => {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        Object.values(THEME_CLASS_MAP).forEach((className) => {
          document.documentElement.classList.remove(className);
        });

        const themeClass = THEME_CLASS_MAP[resolvedTheme];
        if (themeClass) {
          document.documentElement.classList.add(themeClass);
        }

        document.documentElement.setAttribute('data-theme', resolvedTheme);

        const themeColors = themeConfig[resolvedTheme]?.colors;
        if (themeColors) {
          Object.entries(themeColors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(`--${key}`, value);
          });
        }
      }
    } catch (error) {
      console.error('Error applying theme to DOM:', error);
    }
  }, []);

  /**
   * Detects the system preference for color scheme
   */
  const detectSystemTheme = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? THEMES.DARK : THEMES.LIGHT;
      }
    } catch (error) {
      console.error('Error detecting system theme:', error);
    }
    return THEMES.LIGHT;
  }, []);

  /**
   * Loads saved theme mode from localStorage or defaults to system preference
   */
  const initializeTheme = useCallback(() => {
    try {
      let savedThemeMode = DEFAULT_THEME_MODE;
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && isValidThemeMode(savedTheme)) {
          savedThemeMode = savedTheme;
        }
      }

      setThemeModeState(savedThemeMode);
      const resolvedTheme = savedThemeMode === THEME_MODES.SYSTEM ? detectSystemTheme() : savedThemeMode;
      setThemeState(resolvedTheme);
      applyThemeToDOM(resolvedTheme);
      return { savedThemeMode, resolvedTheme };
    } catch (error) {
      console.error('Error initializing theme:', error);
      setThemeModeState(DEFAULT_THEME_MODE);
      setThemeState(THEMES.LIGHT);
      applyThemeToDOM(THEMES.LIGHT);
      return { savedThemeMode: DEFAULT_THEME_MODE, resolvedTheme: THEMES.LIGHT };
    }
  }, [applyThemeToDOM, detectSystemTheme]);

  /**
   * Cleans up the media query listener for system theme changes
   */
  const cleanupMediaQueryListener = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia && mediaQueryListener) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', mediaQueryListener);
        } else if (mediaQuery.removeListener) {
          mediaQuery.removeListener(mediaQueryListener);
        }
        setMediaQueryListener(null);
      }
    } catch (error) {
      console.error('Error cleaning up media query listener:', error);
    }
  }, [mediaQueryListener]);

  /**
   * Sets up real-time OS theme detection
   */
  const setupSystemThemeListener = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e) => {
          // Defensive: some environments may call the listener with a null/undefined event
          // or otherwise provide no `matches` property. Fall back to mediaQuery.matches or
          // query the matchMedia result directly.
          const matches = (e && typeof e.matches === 'boolean')
            ? e.matches
            : (mediaQuery && typeof mediaQuery.matches === 'boolean')
              ? mediaQuery.matches
              : (typeof window !== 'undefined' && window.matchMedia)
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                : false;

          const newTheme = matches ? THEMES.DARK : THEMES.LIGHT;
          setThemeState(newTheme);
          applyThemeToDOM(newTheme);
        };

        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', listener);
        } else if (mediaQuery.addListener) {
          mediaQuery.addListener(listener);
        }

        setMediaQueryListener(listener);
      }
    } catch (error) {
      console.error('Error setting up system theme listener:', error);
    }
  }, [applyThemeToDOM]);

  /**
   * Sets the theme mode and persists the preference
   */
  const setThemeMode = useCallback(
    (newThemeMode) => {
      try {
        if (!isValidThemeMode(newThemeMode)) {
          console.warn(`Invalid theme mode: ${newThemeMode}. Must be one of: ${Object.values(THEME_MODES).join(', ')}`);
          return;
        }

        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(THEME_STORAGE_KEY, newThemeMode);
          } catch (storageError) {
            console.warn('Failed to save theme mode to localStorage:', storageError);
          }
        }

        setThemeModeState(newThemeMode);

        if (newThemeMode === THEME_MODES.SYSTEM) {
          cleanupMediaQueryListener();
          const resolvedTheme = detectSystemTheme();
          setThemeState(resolvedTheme);
          applyThemeToDOM(resolvedTheme);
          setupSystemThemeListener();
        } else {
          cleanupMediaQueryListener();
          setThemeState(newThemeMode);
          applyThemeToDOM(newThemeMode);
        }
      } catch (error) {
        console.error('Error setting theme mode:', error);
      }
    },
    [applyThemeToDOM, cleanupMediaQueryListener, detectSystemTheme, setupSystemThemeListener]
  );

  /**
   * Toggles theme between light and dark explicitly
   */
  const toggleTheme = useCallback(() => {
    const nextTheme = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setThemeMode(nextTheme);
  }, [theme, setThemeMode]);

  useEffect(() => {
    const { savedThemeMode } = initializeTheme();
    if (savedThemeMode === THEME_MODES.SYSTEM) {
      setupSystemThemeListener();
    }
    setIsInitialized(true);
    return () => {
      cleanupMediaQueryListener();
    };
  }, [cleanupMediaQueryListener, initializeTheme, setupSystemThemeListener]);

  const value = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    initializeTheme,
    isLight: theme === THEMES.LIGHT,
    isDark: theme === THEMES.DARK,
    isSystem: themeMode === THEME_MODES.SYSTEM,
    isInitialized,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Custom hook to use the ThemeContext
 * Throws error if used outside of ThemeProvider
 */
export const useTheme = () => {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export default ThemeContext;
