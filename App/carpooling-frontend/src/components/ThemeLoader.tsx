import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUITheme } from '../context/UIThemeContext';

/**
 * ThemeLoader component loads user's theme preferences from their profile
 * when they log in, ensuring theme settings sync across devices.
 */
export const ThemeLoader: React.FC = () => {
  const { userData } = useAuth();
  const { loadPreferencesFromUser } = useUITheme();

  useEffect(() => {
    if (userData?.preferences) {
      const { theme, colorMode } = userData.preferences;
      loadPreferencesFromUser(theme, colorMode);
    }
  }, [userData?.uid]); // Only run when user logs in/out

  return null; // This component doesn't render anything
};
