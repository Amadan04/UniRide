import React from 'react';
import { useUITheme } from '../../../context/UIThemeContext';

interface CleanSelectOption {
  value: string;
  label: string;
}

interface CleanSelectProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: CleanSelectOption[];
  required?: boolean;
  icon?: React.ReactNode;
  label?: string;
  placeholder?: string;
}

export const CleanSelect: React.FC<CleanSelectProps> = ({
  name,
  value,
  onChange,
  options,
  required = false,
  icon,
  label,
  placeholder = 'Select...',
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
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {icon}
          </div>
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`
            w-full px-4 py-2.5 rounded-lg border transition-all duration-200
            ${icon ? 'pl-10' : 'pl-4'}
            ${isDark
              ? 'bg-gray-900 border-gray-700 text-gray-100 focus:border-teal-500 focus:ring-teal-500/20'
              : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-200'
            }
            focus:outline-none focus:ring-4
            appearance-none cursor-pointer
          `}
        >
          <option value="" disabled className={isDark ? 'text-gray-500' : 'text-gray-400'}>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className={isDark ? 'bg-gray-900' : 'bg-white'}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};