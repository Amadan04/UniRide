import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

type UITheme = 'neon' | 'clean';
type ColorMode = 'light' | 'dark';

interface UIThemeContextType {
  theme: UITheme;
  colorMode: ColorMode;
  isDark: boolean;
  setTheme: (theme: UITheme) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleTheme: () => void;
  toggleColorMode: () => void;
  savePreferencesToDatabase: (userId: string) => Promise<void>;
  loadPreferencesFromUser: (userTheme?: UITheme, userColorMode?: ColorMode) => void;
}

const UIThemeContext = createContext<UIThemeContextType | undefined>(undefined);

export const UIThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<UITheme>('neon');
  const [colorMode, setColorModeState] = useState<ColorMode>('dark');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved preferences on mount (localStorage first, then user profile will override)
  useEffect(() => {
    const savedTheme = localStorage.getItem('uiTheme') as UITheme | null;
    const savedColorMode = localStorage.getItem('colorMode') as ColorMode | null;

    if (savedTheme) {
      setThemeState(savedTheme);
    }

    if (savedColorMode) {
      setColorModeState(savedColorMode);
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorModeState(prefersDark ? 'dark' : 'light');
    }

    setIsInitialized(true);
  }, []);

  // Apply dark class to document and save to localStorage
  useEffect(() => {
    if (colorMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('colorMode', colorMode);
  }, [colorMode]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('uiTheme', theme);
  }, [theme]);

  const setTheme = (newTheme: UITheme) => {
    setThemeState(newTheme);
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'neon' ? 'clean' : 'neon'));
  };

  const toggleColorMode = () => {
    setColorModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Save theme preferences to user's database profile
  const savePreferencesToDatabase = async (userId: string) => {
    if (!userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        preferences: {
          theme,
          colorMode
        },
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving theme preferences to database:', error);
    }
  };

  // Load preferences from user profile (call this when user logs in)
  const loadPreferencesFromUser = (userTheme?: UITheme, userColorMode?: ColorMode) => {
    if (userTheme) {
      setThemeState(userTheme);
      localStorage.setItem('uiTheme', userTheme);
    }

    if (userColorMode) {
      setColorModeState(userColorMode);
      localStorage.setItem('colorMode', userColorMode);
    }
  };

  return (
    <UIThemeContext.Provider
      value={{
        theme,
        colorMode,
        isDark: colorMode === 'dark',
        setTheme,
        setColorMode,
        toggleTheme,
        toggleColorMode,
        savePreferencesToDatabase,
        loadPreferencesFromUser
      }}
    >
      {children}
    </UIThemeContext.Provider>
  );
};

export const useUITheme = () => {
  const context = useContext(UIThemeContext);
  if (!context) {
    throw new Error('useUITheme must be used within UIThemeProvider');
  }
  return context;
};

// Backwards compatibility - export as useTheme as well
export const useTheme = useUITheme;