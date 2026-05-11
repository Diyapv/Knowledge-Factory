import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Upload from './pages/Upload';
import AssetDetail from './pages/AssetDetail';
import Documents from './pages/Documents';
import CodeSnippets from './pages/CodeSnippets';
import Analytics from './pages/Analytics';
import Review from './pages/Review';
import Approvals from './pages/Approvals';
import Drafts from './pages/Drafts';
import Settings from './pages/Settings';
import ActivityLog from './pages/ActivityLog';
import Favorites from './pages/Favorites';
import KnowledgeManager from './pages/KnowledgeManager';
import PersonalNotes from './pages/PersonalNotes';
import ResumeBuilder from './pages/ResumeBuilder';
import Feedback from './pages/Feedback';
import TaskTracker from './pages/TaskTracker';
import AssetManager from './pages/AssetManager';
import Recognition from './pages/Recognition';
import JobBoard from './pages/JobBoard';
import EmployeeDirectory from './pages/EmployeeDirectory';
import AskExpert from './pages/AskExpert';
import Polls from './pages/Polls';
import LeaveTracker from './pages/LeaveTracker';
import Announcements from './pages/Announcements';
import Bookings from './pages/Bookings';
import QuickLinks from './pages/QuickLinks';
import StandupNotes from './pages/StandupNotes';
import MeetingMinutes from './pages/MeetingMinutes';
import Celebrations from './pages/Celebrations';
import IdeaBox from './pages/IdeaBox';
import TriviaArena from './pages/TriviaArena';
import PhotoGallery from './pages/PhotoGallery';

function AppRoutes() {
  const { user, isAdmin } = useAuth();

  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/asset/:id" element={<AssetDetail />} />
        <Route path="/code" element={<CodeSnippets />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/review" element={<Review />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/drafts" element={!isAdmin ? <Drafts /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/activity" element={<ActivityLog />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/knowledge" element={isAdmin ? <KnowledgeManager /> : <Navigate to="/" replace />} />
        <Route path="/notes" element={<PersonalNotes />} />
        <Route path="/resume" element={<ResumeBuilder />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/tasks" element={<TaskTracker />} />
        <Route path="/devices" element={<AssetManager />} />
        <Route path="/recognition" element={<Recognition />} />
        <Route path="/jobs" element={<JobBoard />} />
        <Route path="/directory" element={<EmployeeDirectory />} />
        <Route path="/ask-expert" element={<AskExpert />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/leave" element={<LeaveTracker />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/quicklinks" element={<QuickLinks />} />
        <Route path="/standups" element={<StandupNotes />} />
        <Route path="/meetings" element={<MeetingMinutes />} />
        <Route path="/celebrations" element={<Celebrations />} />
        <Route path="/ideas" element={<IdeaBox />} />
        <Route path="/trivia" element={<TriviaArena />} />
        <Route path="/gallery" element={<PhotoGallery />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
