// This file exports themed versions of pages based on active theme
import { useUITheme } from '../context/UIThemeContext';

// Neon theme pages (original)
import { HomePage as NeonHomePage } from '../pages/HomePage';
import { AuthPage as NeonAuthPage } from '../pages/AuthPage';
import { JoinRidePage as NeonJoinRidePage } from '../pages/JoinRidePage';
import { CreateRidePage as NeonCreateRidePage } from '../pages/CreateRidePage';
import { ChatPage as NeonChatPage } from '../pages/ChatPage';
import { ProfilePage as NeonProfilePage } from '../pages/ProfilePage';
import { ActivityPage as NeonActivityPage } from '../pages/ActivityPage';
import { AIAssistantPage as NeonAIAssistantPage } from '../pages/AIAssistantPage';
import { ClassSchedulePage as NeonClassSchedulePage } from '../pages/ClassSchedulePage';
import { LeaderboardPage as NeonLeaderboardPage } from '../pages/LeaderboardPage';
import { ForgotPasswordPage as NeonForgotPasswordPage } from '../pages/ForgotPasswordPage';

// Clean theme pages (new)
import { CleanHomePage } from './newUI/pages/CleanHomePage';
import { CleanAuthPage } from './newUI/pages/CleanAuthPage';
import { CleanJoinRidePage } from './newUI/pages/CleanJoinRidePage';
import { CleanCreateRidePage } from './newUI/pages/CleanCreateRidePage';
import { CleanChatPage } from './newUI/pages/CleanChatPage';
import { CleanProfilePage } from './newUI/pages/CleanProfilePage';
import { CleanActivityPage } from './newUI/pages/CleanActivityPage';
import { CleanAIAssistantPage } from './newUI/pages/CleanAIAssistantPage';
import { CleanClassSchedulePage } from './newUI/pages/CleanClassSchedulePage';
import { CleanLeaderboardPage } from './newUI/pages/CleanLeaderboardPage';
import { CleanForgotPasswordPage } from './newUI/pages/CleanForgotPasswordPage';

// Themed page exports
export const ThemedHomePage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanHomePage /> : <NeonHomePage />;
};

export const ThemedAuthPage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanAuthPage /> : <NeonAuthPage />;
};

export const ThemedJoinRidePage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanJoinRidePage /> : <NeonJoinRidePage />;
};

export const ThemedCreateRidePage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanCreateRidePage /> : <NeonCreateRidePage />;
};

export const ThemedChatPage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanChatPage /> : <NeonChatPage />;
};

export const ThemedProfilePage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanProfilePage /> : <NeonProfilePage />;
};

export const ThemedActivityPage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanActivityPage /> : <NeonActivityPage />;
};

export const ThemedAIAssistantPage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanAIAssistantPage /> : <NeonAIAssistantPage />;
};

export const ThemedClassSchedulePage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanClassSchedulePage /> : <NeonClassSchedulePage />;
};

export const ThemedLeaderboardPage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanLeaderboardPage /> : <NeonLeaderboardPage />;
};

export const ThemedForgotPasswordPage = () => {
  const { theme } = useUITheme();
  return theme === 'clean' ? <CleanForgotPasswordPage /> : <NeonForgotPasswordPage />;
};

// Pages that don't have clean versions yet (use neon only)
export { MapPage } from '../pages/MapPage';
export { LiveTrackingPage } from '../pages/LiveTrackingPage';
export { LiveTrackingDemoPage } from '../pages/LiveTrackingDemoPage';
export { UserStatsPage } from '../pages/UserStatsPage';