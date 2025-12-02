import React from 'react';
import { motion } from 'framer-motion';
import { Menu, ArrowLeft, Bell } from 'lucide-react';

interface CleanHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
}

export const CleanHeader: React.FC<CleanHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  onMenuClick,
  showNotifications = false,
  notificationCount = 0,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <motion.button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </motion.button>
          ) : (
            <motion.button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </motion.button>
          )}
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        {/* Right Side */}
        {showNotifications && (
          <motion.button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </motion.button>
        )}
      </div>
    </header>
  );
};