import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Map, Users } from 'lucide-react';
import { messageVariant, pageTransition } from '../animations/motionVariants';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface RideInfo {
  driverName: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  passengers: { uid: string; name: string }[];
}

export const ChatPage: React.FC = () => {
  const { rideID } = useParams<{ rideID: string }>();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rideID) return;

    fetchRideInfo();

    const messagesRef = ref(rtdb, `chats/${rideID}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, msg]: [string, any]) => ({
          id,
          ...msg,
        }));
        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      }
    });

    return () => unsubscribe();
  }, [rideID]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData || !rideID) return;

    try {
      const messagesRef = ref(rtdb, `chats/${rideID}/messages`);
      await push(messagesRef, {
        senderId: userData.uid,
        senderName: userData.name,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 dark:from-slate-950 dark:to-blue-950 flex flex-col"
      {...pageTransition}
    >
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
              onClick={() => navigate(`/map/${rideID}`)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition"
            >
              <Map className="w-5 h-5" />
              <span className="hidden md:inline">View Map</span>
            </button>

            {rideInfo && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-cyan-400/30 rounded-lg">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-white">{rideInfo.passengers?.length || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => {
              const isOwn = message.senderId === userData?.uid;
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border-t border-cyan-400/30 p-4">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-center gap-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-white/5 border border-cyan-400/30 rounded-full text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 transition"
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
    </motion.div>
  );
};
