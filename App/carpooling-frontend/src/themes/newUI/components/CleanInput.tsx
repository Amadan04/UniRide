import React from 'react';
import { useUITheme } from '../../../context/UIThemeContext';

interface CleanInputProps {
  type?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  error?: string;
  label?: string;
}

export const CleanInput: React.FC<CleanInputProps> = ({
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  icon,
  error,
  label,
}) => {
  const { isDark } = useUITheme();

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-lg border transition-all duration-200
            ${icon ? 'pl-10' : 'pl-4'}
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : isDark
                ? 'border-gray-700 focus:border-teal-500 focus:ring-teal-500/20'
                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-200'
            }
            ${disabled
              ? (isDark ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-100 cursor-not-allowed')
              : (isDark ? 'bg-gray-900' : 'bg-white')
            }
            ${isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
            focus:outline-none focus:ring-4
          `}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};