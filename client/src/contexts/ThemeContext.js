import React, { createContext, useState, useEffect, useCallback } from 'react';
import { themeConfig, THEMES, THEME_STORAGE_KEY } from '../utils/themeConfig';

// Create the Theme Context
export const ThemeContext = createContext();

// Themes map to CSS class names
const THEME_CLASS_MAP = {
  [THEMES.LIGHT]: themeConfig[THEMES.LIGHT].className,
  [THEMES.DARK]: themeConfig[THEMES.DARK].className,
};

/**
 * ThemeProvider component that manages theme state and provides theme utilities
 * Handles system preference detection, localStorage persistence, and real-time OS theme detection
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(THEMES.LIGHT);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaQueryListener, setMediaQueryListener] = useState(null);

  /**
   * Applies the theme class to the document element
   * Prevents FOUC (Flash of Unstyled Content) by updating DOM immediately
   */
  const applyThemeToDOM = useCallback((themeValue) => {
    try {
      if (typeof document !== 'undefined' && document.documentElement) {
        // Remove all theme classes
        Object.values(THEME_CLASS_MAP).forEach((className) => {
          document.documentElement.classList.remove(className);
        });

        // Add the new theme class
        const themeClass = THEME_CLASS_MAP[themeValue];
        if (themeClass) {
          document.documentElement.classList.add(themeClass);
        }

        // Store as data attribute for additional flexibility
        document.documentElement.setAttribute('data-theme', themeValue);

        // Apply CSS variables from the centralized theme configuration
        const themeColors = themeConfig[themeValue]?.colors;
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
   * Uses prefers-color-scheme media query to determine user's OS-level preference
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
    return THEMES.LIGHT; // Default fallback
  }, []);

  /**
   * Loads saved theme from localStorage or detects system preference
   * Called during component initialization to restore or detect theme
   */
  const initializeTheme = useCallback(() => {
    try {
      // First, try to load saved theme preference from localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        
        if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
          setThemeState(savedTheme);
          applyThemeToDOM(savedTheme);
          return savedTheme;
        }
      }
      
      // No saved preference, use system preference
      const systemTheme = detectSystemTheme();
      setThemeState(systemTheme);
      applyThemeToDOM(systemTheme);
      return systemTheme;
    } catch (error) {
      console.error('Error initializing theme:', error);
      applyThemeToDOM(THEMES.LIGHT);
      setThemeState(THEMES.LIGHT);
      return THEMES.LIGHT;
    }
  }, [applyThemeToDOM, detectSystemTheme]);

  /**
   * Changes the theme to a specific value and persists to localStorage
   * Also cleans up system preference listener if manual preference is set
   */
  /**
   * Cleans up the media query listener for system theme changes
   */
  const cleanupMediaQueryListener = useCallback(() => {
    try {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        mediaQueryListener
      ) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.removeEventListener('change', mediaQueryListener);
        setMediaQueryListener(null);
      }
    } catch (error) {
      console.error('Error cleaning up media query listener:', error);
    }
  }, [mediaQueryListener]);

  /**
   * Changes the theme to a specific value and persists to localStorage
   * Also cleans up system preference listener if manual preference is set
   */
  const setTheme = useCallback((newTheme) => {
    try {
      if (!Object.values(THEMES).includes(newTheme)) {
        console.warn(`Invalid theme: ${newTheme}. Must be one of: ${Object.values(THEMES).join(', ')}`);
        return;
      }

      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (storageError) {
          console.warn('Failed to save theme to localStorage:', storageError);
        }
      }

      // Update state and apply to DOM
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);

      // Clean up system preference listener when user sets manual preference
      if (mediaQueryListener) {
        cleanupMediaQueryListener();
      }
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  }, [mediaQueryListener, applyThemeToDOM, cleanupMediaQueryListener]);

  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  }, [theme, setTheme]);

  /**
   * Sets up real-time OS theme detection
   * Only listens for system preference changes when no manual preference is saved
   * Uses addEventListener (modern API) instead of deprecated addListener
   */
  const setupSystemThemeListener = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        // Create the media query
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Define the listener function
        const listener = (e) => {
          const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
          setThemeState(newTheme);
          applyThemeToDOM(newTheme);
        };

        // Use modern addEventListener API (replaces deprecated addListener)
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', listener);
        } else if (mediaQuery.addListener) {
          // Fallback for older browsers (deprecated but provides compatibility)
          mediaQuery.addListener(listener);
        }

        setMediaQueryListener(() => listener);
      }
    } catch (error) {
      console.error('Error setting up system theme listener:', error);
    }
  }, [applyThemeToDOM]);

  /**
   * Initialize theme on component mount
   * Apply theme to DOM before first render to prevent FOUC
   */
  useEffect(() => {
    // Initialize theme immediately to prevent FOUC
    initializeTheme();

    // Check if a manual preference was saved
    let hasSavedPreference = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        hasSavedPreference = localStorage.getItem(THEME_STORAGE_KEY) !== null;
      }
    } catch (error) {
      console.warn('Error checking for saved theme:', error);
    }

    // Only setup system theme listener if no manual preference is saved
    if (!hasSavedPreference) {
      setupSystemThemeListener();
    }

    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      cleanupMediaQueryListener();
    };
  }, [initializeTheme, setupSystemThemeListener, cleanupMediaQueryListener]);

  // Context value with theme and utility functions
  const value = {
    theme,
    setTheme,
    toggleTheme,
    initializeTheme,
    isLight: theme === THEMES.LIGHT,
    isDark: theme === THEMES.DARK,
    isInitialized,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
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
