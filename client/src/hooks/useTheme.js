import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Custom React hook for accessing theme context
 * 
 * @returns {Object} Theme context object containing:
 *   - theme {string} - Current resolved theme ('light' or 'dark')
 *   - themeMode {string} - Current user preference ('light', 'dark', or 'system')
 *   - setThemeMode(mode) {function} - Function to set the theme preference
 *   - toggleTheme() {function} - Function to toggle explicitly between light and dark
 *   - isLight {boolean} - True if current resolved theme is 'light'
 *   - isDark {boolean} - True if current resolved theme is 'dark'
 *   - isSystem {boolean} - True if current user preference is 'system'
 *   - isInitialized {boolean} - True when theme has been initialized
 * 
 * @throws {Error} If used outside of ThemeProvider
 * 
 * @example
 * const { theme, toggleTheme, setTheme } = useTheme();
 * 
 * return (
 *   <button onClick={toggleTheme}>
 *     Current theme: {theme}
 *   </button>
 * );
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure your component is wrapped with <ThemeProvider> in App.js or a parent component.'
    );
  }

  return context;
};

export default useTheme;
