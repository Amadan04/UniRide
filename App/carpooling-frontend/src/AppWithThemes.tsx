import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { UIThemeProvider } from './context/UIThemeContext';
import { ProtectedRoute } from './router/ProtectedRoute';
import { SplashScreen } from './components/SplashScreen';
import { FloatingChatButton } from './components/FloatingChatButton';
import { ToastProvider } from './context/ToastContext';
import { ThemeLoader } from './components/ThemeLoader';

// Import themed pages
import {
  ThemedHomePage,
  ThemedAuthPage,
  ThemedJoinRidePage,
  ThemedCreateRidePage,
  ThemedChatPage,
  ThemedProfilePage,
  ThemedActivityPage,
  ThemedAIAssistantPage,
  ThemedClassSchedulePage,
  ThemedLeaderboardPage,
  ThemedForgotPasswordPage,
  MapPage,
  LiveTrackingPage,
  LiveTrackingDemoPage,
  UserStatsPage,
} from './themes/ThemedPages';

function AppWithThemes() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ToastProvider>
      <UIThemeProvider>
        <AuthProvider>
          <ThemeLoader />
          <Router>
            <FloatingChatButton />
            <AnimatePresence mode="wait">
              <Routes>
                  <Route path="/auth" element={<ThemedAuthPage />} />
                  <Route path="/forgot-password" element={<ThemedForgotPasswordPage />} />

                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <ThemedHomePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/ride-create"
                    element={
                      <ProtectedRoute requireRole="driver">
                        <ThemedCreateRidePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/rides"
                    element={
                      <ProtectedRoute requireRole="rider">
                        <ThemedJoinRidePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/chat/:rideID"
                    element={
                      <ProtectedRoute>
                        <ThemedChatPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ThemedProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/activity"
                    element={
                      <ProtectedRoute>
                        <ThemedActivityPage />
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
                        <ThemedAIAssistantPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/schedule"
                    element={
                      <ProtectedRoute>
                        <ThemedClassSchedulePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/tracking/:rideID"
                    element={
                      <ProtectedRoute>
                        <LiveTrackingPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/tracking-demo"
                    element={
                      <ProtectedRoute>
                        <LiveTrackingDemoPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/user-stats/:userID"
                    element={
                      <ProtectedRoute>
                        <UserStatsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRoute>
                        <ThemedLeaderboardPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Router>
          </AuthProvider>
        </UIThemeProvider>
    </ToastProvider>
  );
}

export default AppWithThemes;