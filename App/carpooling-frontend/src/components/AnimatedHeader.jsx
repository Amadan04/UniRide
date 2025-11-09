import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

export default function AnimatedHeader() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-lg bg-gray-900/70 border-b border-blue-500/30"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-3"
        >
          <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-2">
            <Car size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            UniCarpool
          </span>
        </motion.div>

        <nav className="flex items-center space-x-6">
          <motion.a
            href="/"
            whileHover={{ scale: 1.1 }}
            className="text-blue-200 hover:text-white transition-colors"
          >
            Home
          </motion.a>
          <motion.a
            href="/ride"
            whileHover={{ scale: 1.1 }}
            className="text-blue-200 hover:text-white transition-colors"
          >
            Rides
          </motion.a>
          <motion.a
            href="/chat"
            whileHover={{ scale: 1.1 }}
            className="text-blue-200 hover:text-white transition-colors"
          >
            Chat
          </motion.a>
        </nav>
      </div>
    </motion.header>
  );
}
