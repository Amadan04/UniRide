import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import { SplashScreen } from './components/SplashScreen';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { CreateRidePage } from './pages/CreateRidePage';
import { JoinRidePage } from './pages/JoinRidePage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { ActivityPage } from './pages/ActivityPage';
import { MapPage } from './pages/MapPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { FloatingChatButton } from './components/FloatingChatButton';
import { ToastProvider } from './context/ToastContext';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return ( 
    <ToastProvider>
     <ThemeProvider>
      <AuthProvider>
        <Router>
          <FloatingChatButton />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ride-create"
                element={
                  <ProtectedRoute requireRole="driver">
                    <CreateRidePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rides"
                element={
                  <ProtectedRoute requireRole="rider">
                    <JoinRidePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat/:rideID"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <ActivityPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/map/:rideID"
                element={
                  <ProtectedRoute>
                    <MapPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai-assistant"
                element={
                  <ProtectedRoute>
                    <AIAssistantPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </ToastProvider>
  );
}

export default App;
