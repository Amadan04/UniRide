import React from 'react';
import { useUITheme } from '../context/UIThemeContext';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  const { theme } = useUITheme();

  return (
    <div className={theme === 'clean' ? 'clean-theme' : 'neon-theme'}>
      {children}
    </div>
  );
};