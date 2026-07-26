import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Custom React hook for accessing theme context
 * 
 * @returns {Object} Theme context object containing:
 *   - theme {string} - Current theme ('light' or 'dark')
 *   - setTheme(theme) {function} - Function to set theme
 *   - toggleTheme() {function} - Function to toggle between light and dark
 *   - isLight {boolean} - True if current theme is 'light'
 *   - isDark {boolean} - True if current theme is 'dark'
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
