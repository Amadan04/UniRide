import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const FloatingChatButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide button on pages where it might interfere with UI
  const hiddenPaths = [
    '/ai-assistant',
    '/chat',  // Hides on all chat pages
  ];

  // Check if current path should hide the button
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  const handleClick = () => {
    navigate('/ai-assistant');
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center z-50"
      whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(6, 182, 212, 0.6)' }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </motion.button>
  );
};