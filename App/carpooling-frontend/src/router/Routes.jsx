import { Routes as RouterRoutes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AuthPage from '../pages/AuthPage';
import CreateRidePage from '../pages/CreateRidePage';
import ChatPage from '../pages/ChatPage';

export default function Routes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <RouterRoutes location={location} key={location.pathname}>
        <Route path="/" element={<AuthPage />} />
        <Route path="/ride" element={<CreateRidePage />} />
        <Route path="/chat" element={<ChatPage />} />
      </RouterRoutes>
    </AnimatePresence>
  );
}
