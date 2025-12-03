import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, push, set } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Map, Users, X } from 'lucide-react';
import { messageVariant, pageTransition } from '../animations/motionVariants';
import { checkMessageProfanity } from '../utils/profanityFilter';
import { useToast } from '../context/ToastContext';


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

export const ChatPage: React.FC = () => {
  const { rideID } = useParams<{ rideID: string }>();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔹 Load ride info + live chat listener
  useEffect(() => {
    if (!rideID || !userData) return;
    fetchRideInfo();

    // ✅ Match your Firebase structure (/chats/{rideId}/{messageId})
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

  // 🔹 Listen for typing indicators
  useEffect(() => {
    if (!rideID || !userData) return;

    const typingRef = ref(rtdb, `typing/${rideID}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter out own typing status and inactive typers
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

  // 🔹 Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      if (rideID && userData) {
        const userTypingRef = ref(rtdb, `typing/${rideID}/${userData.uid}`);
        set(userTypingRef, { isTyping: false, userName: userData.name });
      }
    };
  }, [rideID, userData]);

  // 🔹 Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 🔹 Fetch ride details from Firestore
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

  // 🔹 Handle typing indicator
  const handleTyping = () => {
    if (!rideID || !userData) return;

    const userTypingRef = ref(rtdb, `typing/${rideID}/${userData.uid}`);

    // Set typing to true
    set(userTypingRef, {
      isTyping: true,
      userName: userData.name,
      timestamp: Date.now()
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to clear typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      set(userTypingRef, {
        isTyping: false,
        userName: userData.name
      });
    }, 3000);
  };

  // 🔹 Send a new message
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
      // Clear typing indicator
      const userTypingRef = ref(rtdb, `typing/${rideID}/${userData.uid}`);
      await set(userTypingRef, {
        isTyping: false,
        userName: userData.name
      });

      // Send message
      const messagesRef = ref(rtdb, `chats/${rideID}`);
      const newMessageRef = push(messagesRef);

      // ✅ Matches your Firebase rules exactly
      await set(newMessageRef, {
        senderID: userData.uid,
        senderRole: userData.role, // must be 'driver' or 'rider'
        senderName: userData.name,
        text: messageText,
        timestamp: Date.now(), // must be numeric
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 flex flex-col"
      {...pageTransition}
    >
      {/* 🔹 Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-cyan-400/30 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-cyan-400/20 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            </button>
            {rideInfo && (
              <div>
                <h2 className="text-xl font-bold text-white">
                  {rideInfo.pickup} → {rideInfo.destination}
                </h2>
                <p className="text-cyan-300 text-sm">
                  {rideInfo.date} at {rideInfo.time}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/tracking/${rideID}`)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition"
            >
              <Map className="w-5 h-5" />
              <span className="hidden md:inline">Live Tracking</span>
            </button>

            {rideInfo && (
              <button
                onClick={() => setShowPassengerModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg hover:bg-cyan-500/20 transition cursor-pointer"
              >
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-white">{rideInfo.passengers?.length || 0}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => {
              const isOwn = message.senderID === userData?.uid;
              return (
                <motion.div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  variants={messageVariant(isOwn)}
                  initial="initial"
                  animate="animate"
                >
                  <div
                    className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                      isOwn
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-white/10 backdrop-blur-xl border border-cyan-400/30 text-white'
                    }`}
                    style={{
                      boxShadow: isOwn ? '0 0 20px rgba(34, 211, 238, 0.3)' : 'none',
                    }}
                  >
                    {!isOwn && (
                      <p className="text-cyan-300 text-xs font-semibold mb-1">
                        {message.senderName}
                        <span className="ml-2 text-cyan-400 text-[10px]">
                          ({message.senderRole})
                        </span>
                      </p>
                    )}
                    <p className="break-words">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-cyan-100' : 'text-cyan-300'
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

          {/* 🔹 Typing Indicator */}
          <AnimatePresence>
            {Object.keys(typingUsers).length > 0 && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-cyan-400/30">
                  <p className="text-cyan-300 text-sm italic">
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

      {/* 🔹 Message Input */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-t border-cyan-400/30 p-4">
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
            className="flex-1 px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-full text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
            maxLength={1000}
          />
          <motion.button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="backdrop-blur-xl bg-white/10 border border-cyan-400/30 rounded-2xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Passengers</h3>
                <button
                  onClick={() => setShowPassengerModal(false)}
                  className="text-cyan-400 hover:text-cyan-300 transition"
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
                      className="bg-white/5 border border-cyan-400/20 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold hover:text-cyan-400 transition">{passenger.name}</p>
                          {passenger.joinedAt && (
                            <p className="text-cyan-300/70 text-sm">
                              Joined {new Date(passenger.joinedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                        <Users className="w-5 h-5 text-cyan-400" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-cyan-400/50 mx-auto mb-2" />
                    <p className="text-cyan-300/70">No passengers yet</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-cyan-400/20">
                <p className="text-cyan-300 text-sm text-center">
                  {rideInfo.passengers?.length || 0} {rideInfo.passengers?.length === 1 ? 'passenger' : 'passengers'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
