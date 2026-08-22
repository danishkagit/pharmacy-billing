import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ACCENTS = [
  { id: 'emerald', label: 'Clinical Emerald', swatch: '#10B981' },
  { id: 'blue', label: 'Trust Blue', swatch: '#3B82F6' },
  { id: 'violet', label: 'Royal Violet', swatch: '#8B5CF6' },
  { id: 'amber', label: 'Herbal Amber', swatch: '#F59E0B' },
];

const VALID_ACCENTS = ACCENTS.map(a => a.id);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem('crx_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      // If no preference saved, check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  const [accent, setAccentState] = useState(() => {
    try {
      const saved = localStorage.getItem('crx_accent');
      if (saved && VALID_ACCENTS.includes(saved)) return saved;
    } catch {}
    return 'emerald';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem('crx_theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (VALID_ACCENTS.includes(accent)) {
      root.setAttribute('data-accent', accent);
    } else {
      root.removeAttribute('data-accent');
    }
    try {
      localStorage.setItem('crx_accent', accent);
    } catch {}
  }, [accent]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const setAccent = (newAccent) => {
    if (VALID_ACCENTS.includes(newAccent)) {
      setAccentState(newAccent);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
