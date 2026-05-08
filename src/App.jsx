import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import AutoTemplates from './pages/AutoTemplates';
import PersonalNotes from './pages/PersonalNotes';

function AppRoutes() {
  const { user } = useAuth();

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
        <Route path="/drafts" element={<Drafts />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/activity" element={<ActivityLog />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/knowledge" element={<KnowledgeManager />} />
        <Route path="/auto-templates" element={<AutoTemplates />} />
        <Route path="/notes" element={<PersonalNotes />} />
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
