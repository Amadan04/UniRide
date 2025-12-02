import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useUITheme } from '../../../context/UIThemeContext';
import {
  sendMessage,
  generateMessageId,
  Message,
  UserContext
} from '../../../services/aiAssistant';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CleanButton } from '../components/CleanButton';

export const CleanAIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const { isDark } = useUITheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateMessageId(),
      role: 'assistant',
      content: 'Hi! I\'m your UniRide assistant. I can help you with creating rides, checking your schedule, or answering questions about the app. How can I help you today?',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({
    upcomingRides: [],
    pastRides: [],
    activeBookings: [],
    userProfile: null
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserContext();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUserContext = async () => {
    if (!currentUser) return;

    try {
      const ridesQuery = query(
        collection(db, 'rides'),
        where('driverID', '==', currentUser.uid)
      );
      const ridesSnapshot = await getDocs(ridesQuery);
      const allRides = ridesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const now = Date.now();

      const upcomingRides = allRides
        .filter((ride: any) => {
          const rideTime = ride.rideDateTime?.toMillis?.() || 0;
          return ['active', 'scheduled'].includes(ride.status) && rideTime > now;
        })
        .sort((a: any, b: any) => {
          const aTime = a.rideDateTime?.toMillis?.() || 0;
          const bTime = b.rideDateTime?.toMillis?.() || 0;
          return aTime - bTime;
        })
        .slice(0, 10);

      const pastRides = allRides
        .filter((ride: any) => {
          const rideTime = ride.rideDateTime?.toMillis?.() || 0;
          return ride.status === 'completed' || rideTime <= now;
        })
        .sort((a: any, b: any) => {
          const aTime = a.rideDateTime?.toMillis?.() || 0;
          const bTime = b.rideDateTime?.toMillis?.() || 0;
          return bTime - aTime;
        })
        .slice(0, 10);

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('riderID', '==', currentUser.uid)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const activeBookings = bookingsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((booking: any) => {
          const bookingDate = new Date(booking.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          return booking.status === 'active' && bookingDate >= today;
        })
        .slice(0, 10);

      const userProfile = userData;

      setUserContext({
        upcomingRides,
        pastRides,
        activeBookings,
        userProfile
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendMessage(
        userMessage.content,
        userContext,
        messages
      );

      const assistantMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the API key is configured correctly.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-50 shadow-sm ${
          isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>AI Assistant</h1>
              <p className="text-sm text-teal-600">UniRide Helper</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Messages Container */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`mb-4 flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex gap-3 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-teal-500'
                      : 'bg-gradient-to-br from-teal-400 to-blue-500'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-teal-500 text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-100 border border-gray-700'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-teal-100' : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 mb-4"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className={`rounded-2xl px-4 py-3 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 shadow-lg ${
        isDark ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about UniRide..."
            className={`flex-1 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDark
                ? 'bg-gray-700 text-gray-100 placeholder-gray-500 border border-gray-600'
                : 'bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200'
            }`}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-teal-500 text-white rounded-full p-3 hover:bg-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};