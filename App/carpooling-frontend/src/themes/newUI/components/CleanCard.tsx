import React from 'react';
import { motion } from 'framer-motion';
import { useUITheme } from '../../../context/UIThemeContext';

interface CleanCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const CleanCard: React.FC<CleanCardProps> = ({
  children,
  onClick,
  hoverable = false,
  padding = 'md',
  className = '',
}) => {
  const { isDark } = useUITheme();

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseStyles = isDark
    ? 'bg-gray-800 rounded-xl border border-gray-700 transition-all duration-200'
    : 'bg-white rounded-xl border border-gray-200 transition-all duration-200';

  const hoverStyles = hoverable
    ? (isDark
        ? 'cursor-pointer hover:shadow-lg hover:shadow-teal-500/10 hover:border-gray-600'
        : 'cursor-pointer hover:shadow-lg hover:border-gray-300')
    : 'shadow-sm';

  const clickableStyles = onClick ? 'cursor-pointer' : '';

  return (
    <motion.div
      onClick={onClick}
      className={`${baseStyles} ${hoverStyles} ${paddingStyles[padding]} ${clickableStyles} ${className}`}
      whileHover={hoverable ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};