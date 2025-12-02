import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, push, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useUITheme } from '../../../context/UIThemeContext';
import { Send, ArrowLeft, Map, Users, X } from 'lucide-react';
import { CleanCard } from '../components/CleanCard';
import { CleanButton } from '../components/CleanButton';
import { checkMessageProfanity } from '../../../utils/profanityFilter';
import { useToast } from '../../../context/ToastContext';

interface Message {
  id: string;
  senderID: string;
  senderRole: 'driver' | 'rider';
  senderName?: string;
  text: string;
  timestamp: number;
}

interface RideInfo {
  driverName: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  passengers: { uid: string; name: string; joinedAt: string }[];
}

export const CleanChatPage: React.FC = () => {
  const { rideID } = useParams<{ rideID: string }>();
  const { userData } = useAuth();
  const { isDark } = useUITheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!rideID || !userData) return;
    fetchRideInfo();

    const messagesRef = ref(rtdb, `chats/${rideID}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList: Message[] = Object.entries(data).map(
          ([id, msg]: [string, any]) => ({
            id,
            senderID: msg.senderID,
            senderRole: msg.senderRole,
            senderName: msg.senderName,
            text: msg.text,
            timestamp: msg.timestamp,
          })
        );
        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [rideID, userData]);

  useEffect(() => {
    if (!rideID || !userData) return;

    const typingRef = ref(rtdb, `typing/${rideID}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activeTypers: { [key: string]: string } = {};
        Object.entries(data).forEach(([uid, info]: [string, any]) => {
          if (uid !== userData.uid && info.isTyping && info.userName) {
            activeTypers[uid] = info.userName;
          }
        });
        setTypingUsers(activeTypers);
      } else {
        setTypingUsers({});
      }
    });

    return () => unsubscribe();
  }, [rideID, userData]);

  useEffect(() => {
    return () => {
      if (rideID && userData) {
        const userTypingRef = ref(rtdb, `typing/${rideID}/${userData.uid}`);
        set(userTypingRef, { isTyping: false, userName: userData.name });
      }
    };
  }, [rideID, userData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRideInfo = async () => {
    if (!rideID) return;
    try {
      const rideDoc = await getDoc(doc(db, 'rides', rideID));
      if (rideDoc.exists()) {
        setRideInfo(rideDoc.data() as RideInfo);
      }
    } catch (error) {
      console.error('Error fetching ride info:', error);
    }
  };

  const handleTyping = () => {
    if (!rideID || !userData) return;

    const userTypingRef = ref(rtdb, `typing/${rideID}/${userData.uid}`);

    set(userTypingRef, {
      isTyping: true,
      userName: userData.name,
      timestamp: Date.now()
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      set(userTypingRef, {
        isTyping: false,
        userName: userData.name
      });
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData || !rideID) return;

    const messageText = newMessage.trim();
    if (messageText.length > 1000) {
      toast.error('Message too long (max 1000 characters)');
      return;
    }

    // Check for profanity
    const profanityCheck = checkMessageProfanity(messageText);
    if (profanityCheck.isProfane) {
      toast.error(profanityCheck.message);
      return;
    }

    try {
      const userTypingRef = ref(rtdb, `typing/${rideID}/${userData.uid}`);
      await set(userTypingRef, {
        isTyping: false,
        userName: userData.name
      });

      const messagesRef = ref(rtdb, `chats/${rideID}`);
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        senderID: userData.uid,
        senderRole: userData.role,
        senderName: userData.name,
        text: messageText,
        timestamp: Date.now(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`p-4 shadow-sm ${isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            {rideInfo && (
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  {rideInfo.pickup} → {rideInfo.destination}
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {rideInfo.date} at {rideInfo.time}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/tracking/${rideID}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isDark
                  ? 'bg-teal-900/30 border border-teal-700 text-teal-400 hover:bg-teal-900/50'
                  : 'bg-teal-50 border border-teal-200 text-teal-600 hover:bg-teal-100'
              }`}
            >
              <Map className="w-5 h-5" />
              <span className="hidden md:inline">Live Tracking</span>
            </button>

            {rideInfo && (
              <button
                onClick={() => setShowPassengerModal(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
                  isDark
                    ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Users className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={isDark ? 'text-gray-100' : 'text-gray-900'}>{rideInfo.passengers?.length || 0}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => {
              const isOwn = message.senderID === userData?.uid;
              return (
                <motion.div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                      isOwn
                        ? 'bg-teal-500 text-white'
                        : isDark
                        ? 'bg-gray-800 border border-gray-700 text-gray-100'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-teal-600 text-xs font-semibold mb-1">
                        {message.senderName}
                        <span className={`ml-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          ({message.senderRole})
                        </span>
                      </p>
                    )}
                    <p className="break-words">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-teal-100' : isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {Object.keys(typingUsers).length > 0 && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <p className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Object.values(typingUsers).length === 1
                      ? `${Object.values(typingUsers)[0]} is typing`
                      : Object.values(typingUsers).length === 2
                      ? `${Object.values(typingUsers).join(' and ')} are typing`
                      : `${Object.values(typingUsers).length} people are typing`}
                    <span className="typing-dots">
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                    </span>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className={`p-4 ${isDark ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-200'}`}>
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onBlur={() => {
              if (rideID && userData) {
                const userTypingRef = ref(rtdb, `typing/${rideID}/${userData.uid}`);
                set(userTypingRef, { isTyping: false, userName: userData.name });
              }
            }}
            placeholder="Type your message..."
            className={`flex-1 px-4 py-3 rounded-full focus:outline-none focus:border-teal-500 transition ${
              isDark
                ? 'bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500'
                : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            maxLength={1000}
          />
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-teal-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Send className="w-6 h-6 text-white" />
          </motion.button>
        </form>
      </div>

      {/* Passenger List Modal */}
      <AnimatePresence>
        {showPassengerModal && rideInfo && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPassengerModal(false)}
          >
            <motion.div
              className={`rounded-2xl p-6 max-w-md w-full shadow-xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Passengers</h3>
                <button
                  onClick={() => setShowPassengerModal(false)}
                  className={`transition ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                {rideInfo.passengers && rideInfo.passengers.length > 0 ? (
                  rideInfo.passengers.map((passenger, index) => (
                    <motion.div
                      key={passenger.uid}
                      onClick={() => {
                        setShowPassengerModal(false);
                        navigate(`/user-stats/${passenger.uid}`);
                      }}
                      className={`rounded-lg p-4 cursor-pointer transition ${
                        isDark
                          ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold hover:text-teal-600 transition ${
                            isDark ? 'text-gray-100' : 'text-gray-900'
                          }`}>{passenger.name}</p>
                          {passenger.joinedAt && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Joined {new Date(passenger.joinedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                        <Users className="w-5 h-5 text-teal-500" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No passengers yet</p>
                  </div>
                )}
              </div>

              <div className={`mt-4 pt-4 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {rideInfo.passengers?.length || 0} {rideInfo.passengers?.length === 1 ? 'passenger' : 'passengers'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};