import React from 'react';
import { motion } from 'framer-motion';
import { useUITheme } from '../../../context/UIThemeContext';

interface CleanButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const CleanButton: React.FC<CleanButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  type = 'button',
  icon,
  loading = false,
}) => {
  const { isDark } = useUITheme();

  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';

  const variantStyles = {
    primary: isDark
      ? 'bg-teal-600 text-white hover:bg-teal-500 active:bg-teal-700 shadow-md hover:shadow-lg hover:shadow-teal-500/20'
      : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700 shadow-md hover:shadow-lg hover:shadow-teal-500/20',
    secondary: isDark
      ? 'bg-gray-700 text-gray-100 hover:bg-gray-600 active:bg-gray-800 shadow-sm'
      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 shadow-sm',
    outline: isDark
      ? 'bg-transparent border-2 border-teal-500 text-teal-400 hover:bg-teal-900/30 active:bg-teal-900/50'
      : 'bg-transparent border-2 border-teal-500 text-teal-600 hover:bg-teal-50 active:bg-teal-100',
    ghost: isDark
      ? 'bg-transparent text-gray-200 hover:bg-gray-800 active:bg-gray-700'
      : 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';
  const widthStyles = fullWidth ? 'w-full' : '';

  const className = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${disabled || loading ? disabledStyles : ''}
    ${widthStyles}
  `.trim().replace(/\s+/g, ' ');

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </motion.button>
  );
};