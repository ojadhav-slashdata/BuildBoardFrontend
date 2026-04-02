import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';

function SmartRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? '/portal' : '/login'} replace />;
}
import Portal from './pages/Portal';
import SubmitIdea from './pages/SubmitIdea';
import PlaceBid from './pages/PlaceBid';
import MyBids from './pages/MyBids';
import IdeaDetail from './pages/IdeaDetail';
import Profile from './pages/Profile';
import Approvals from './pages/Approvals';
import BidReview from './pages/BidReview';
import Analytics from './pages/Analytics';
import AdminUsers from './pages/AdminUsers';
import Feedback from './pages/Feedback';
import BidResults from './pages/BidResults';
import Marketplace from './pages/Marketplace';
import Guide from './pages/Guide';
import BidDashboard from './pages/BidDashboard';
import BrowseIdeas from './pages/BrowseIdeas';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import Projects from './pages/Projects';
import ProjectWorkspace from './pages/ProjectWorkspace';
import AllIdeas from './pages/AllIdeas';
import DepartmentLeads from './pages/DepartmentLeads';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* All roles */}
        <Route path="/portal" element={<Portal />} />
        <Route path="/ideas/submit" element={<SubmitIdea />} />
        <Route path="/ideas/:id" element={<IdeaDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectWorkspace />} />

        {/* Employee */}
        <Route path="/all-ideas" element={<AllIdeas />} />
        <Route path="/ideas/:ideaId/results" element={<ProtectedRoute><BidResults /></ProtectedRoute>} />
        <Route path="/browse-ideas" element={<BrowseIdeas />} />
        <Route path="/ideas/:id/bid" element={<PlaceBid />} />
        <Route path="/my-bids" element={<MyBids />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />

        {/* Admin only (approvals, analytics, dashboards) */}
        <Route path="/bids/dashboard" element={<ProtectedRoute><BidDashboard /></ProtectedRoute>} />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Approvals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bids/:ideaId"
          element={
            <ProtectedRoute roles={['Admin']}>
              <BidReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ideas/:id/feedback"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/executive"
          element={
            <ProtectedRoute roles={['Admin']}>
              <ExecutiveDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/department-leads"
          element={
            <ProtectedRoute roles={['Admin']}>
              <DepartmentLeads />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<SmartRedirect />} />
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
}
