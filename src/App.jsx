import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
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

        {/* Employee */}
        <Route path="/ideas/:id/bid" element={<PlaceBid />} />
        <Route path="/my-bids" element={<MyBids />} />
        <Route path="/profile" element={<Profile />} />

        {/* Manager / Admin */}
        <Route
          path="/approvals"
          element={
            <ProtectedRoute roles={['Manager', 'Admin']}>
              <Approvals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bids/:ideaId"
          element={
            <ProtectedRoute roles={['Manager', 'Admin']}>
              <BidReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['Manager', 'Admin']}>
              <Analytics />
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
      </Route>

      <Route path="*" element={<Navigate to="/portal" replace />} />
    </Routes>
  );
}
