import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Send, User } from 'lucide-react';
import { slideInFromLeft, slideInFromRight, glowButton } from '../animations/motionVariants';
import AnimatedHeader from '../components/AnimatedHeader';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hey! Ready for the ride tomorrow?',
      sender: 'other',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 2,
      text: 'Yes! What time are we meeting?',
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const particles = particlesRef.current;
    particles.forEach((particle, index) => {
      if (particle) {
        gsap.to(particle, {
          y: `+=${Math.random() * 40 - 20}`,
          x: `+=${Math.random() * 40 - 20}`,
          opacity: Math.random() * 0.2 + 0.1,
          duration: Math.random() * 3 + 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.1,
        });
      }
    });
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, messageData]);
    setNewMessage('');
    setLoading(true);

    setTimeout(() => {
      const replyMessage = {
        id: messages.length + 2,
        text: 'Sounds good! See you then!',
        sender: 'other',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMessage]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <AnimatedHeader />

      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (particlesRef.current[i] = el)}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-10"
            style={{
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              filter: 'blur(25px)',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8 h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 rounded-t-3xl border border-white/20 p-6 shadow-xl"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Ride Group Chat</h2>
              <p className="text-sm text-blue-200">3 members online</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          ref={chatContainerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 backdrop-blur-xl bg-white/5 border-x border-white/20 overflow-y-auto p-6 space-y-4"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                variants={message.sender === 'me' ? slideInFromRight : slideInFromLeft}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-6 py-3 rounded-2xl ${
                    message.sender === 'me'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none'
                      : 'bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-bl-none'
                  }`}
                  style={{
                    boxShadow:
                      message.sender === 'me'
                        ? '0 0 20px rgba(59, 130, 246, 0.4)'
                        : '0 0 15px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'me' ? 'text-blue-100' : 'text-blue-200'
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl rounded-bl-none px-6 py-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{
                        y: [-3, 3, -3],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 rounded-b-3xl border border-white/20 p-6 shadow-xl"
        >
          <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-6 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
            />
            <motion.button
              variants={glowButton}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)',
              }}
            >
              <Send size={20} />
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-center text-blue-200/60 text-xs"
          >
            Press Enter to send • Connected to real-time chat
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
