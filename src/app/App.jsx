import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import AdminRoute from '../features/auth/AdminRoute.jsx';
import { Skeleton } from '../components/ui/index.jsx';

const Landing = lazy(() => import('../pages/Landing.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const AuthPage = lazy(() => import('../features/auth/AuthPage.jsx'));
const AuthCallback = lazy(() => import('../features/auth/AuthCallback.jsx'));
const Learn = lazy(() => import('../features/learning/LearnPage.jsx'));
const Course = lazy(() => import('../features/learning/CoursePage.jsx'));
const Lesson = lazy(() => import('../features/learning/LessonPage.jsx'));
const Games = lazy(() => import('../features/games/GamesPage.jsx'));
const Game = lazy(() => import('../features/games/GameDetailPage.jsx'));
const Leaderboard = lazy(() => import('../features/leaderboard/LeaderboardPage.jsx'));
const Characters = lazy(() => import('../features/characters/CharactersPage.jsx'));
const Character = lazy(() => import('../features/characters/CharacterDetailPage.jsx'));
const Conversation = lazy(() => import('../features/aiConversations/ConversationPage.jsx'));
const Avatar = lazy(() => import('../features/avatar/AvatarPage.jsx'));
const Opportunities = lazy(() => import('../features/opportunities/OpportunitiesPage.jsx'));
const Rooms = lazy(() => import('../features/rooms/RoomsPage.jsx'));
const Profile = lazy(() => import('../features/profile/ProfilePage.jsx'));
const Settings = lazy(() => import('../features/profile/SettingsPage.jsx'));
const Achievements = lazy(() => import('../features/achievements/AchievementsPage.jsx'));
const Library = lazy(() => import('../features/pdfs/LibraryPage.jsx'));
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard.jsx'));
const PdfTemplates = lazy(() => import('../features/admin/PdfTemplatesPage.jsx'));

export default function App() {
  const location = useLocation();
  useEffect(() => {
    document.title = 'Kotoba — Your next chapter';
  }, [location.pathname]);
  return (
    <Suspense
      fallback={
        <div className="route-loading">
          <Skeleton />
        </div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route
            path="games"
            element={
              <div className="public-content">
                <Games />
              </div>
            }
          />
          <Route
            path="games/:gameId"
            element={
              <div className="public-content">
                <Game />
              </div>
            }
          />
          <Route
            path="opportunities"
            element={
              <div className="public-content">
                <Opportunities />
              </div>
            }
          />
        </Route>
        <Route path="auth/login" element={<AuthPage mode="login" />} />
        <Route path="auth/register" element={<AuthPage mode="register" />} />
        <Route path="auth/reset-password" element={<AuthPage mode="reset" />} />
        <Route path="auth/update-password" element={<AuthPage mode="update" />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route element={<ProtectedRoute />}>
          <Route path="app" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="learn" element={<Learn />} />
            <Route path="course/:courseId" element={<Course />} />
            <Route path="lesson/:lessonId" element={<Lesson />} />
            <Route path="games" element={<Games />} />
            <Route path="games/:gameId" element={<Game />} />
            <Route path="leaderboards" element={<Leaderboard />} />
            <Route path="ai" element={<Navigate to="characters" replace />} />
            <Route path="ai/characters" element={<Characters />} />
            <Route path="ai/characters/:characterId" element={<Character />} />
            <Route path="ai/conversation/:characterId" element={<Conversation />} />
            <Route path="avatar" element={<Avatar />} />
            <Route path="avatar/customize" element={<Navigate to="/app/avatar" replace />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="profile/:username" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="library" element={<Library />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pdf-templates" element={<PdfTemplates />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
