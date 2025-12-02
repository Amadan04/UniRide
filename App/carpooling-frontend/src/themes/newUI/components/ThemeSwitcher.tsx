import React from 'react';
import { motion } from 'framer-motion';
import { Palette } from 'lucide-react';
import { useUITheme } from '../../../context/UIThemeContext';

export const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useUITheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
        font-medium transition-all duration-300
        ${theme === 'clean'
          ? 'bg-white border-2 border-gray-200 text-gray-900 hover:shadow-xl'
          : 'bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/30'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${theme === 'clean' ? 'Neon' : 'Clean'} theme`}
    >
      <Palette className="w-5 h-5" />
      <span className="text-sm">
        {theme === 'clean' ? 'Neon Theme' : 'Clean Theme'}
      </span>
    </motion.button>
  );
};