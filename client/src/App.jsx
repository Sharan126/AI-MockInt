// ============================================
// App.jsx - Root Component with Routing
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewPage from './pages/InterviewPage';
import FeedbackPage from './pages/FeedbackPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import ResumeOptimizerPage from './pages/ResumeOptimizerPage/index.jsx';
import SharedReviewPage from './pages/SharedReviewPage/index.jsx';
import StarBankPage from './pages/StarBankPage/index.jsx';
import SalaryNegotiatorPage from './pages/SalaryNegotiatorPage/index.jsx';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/feedback/share/:token"
          element={
            <>
              <Navbar />
              <SharedReviewPage />
            </>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navbar />
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <Navbar />
              <InterviewSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/setup"
          element={
            <ProtectedRoute>
              <Navbar />
              <InterviewSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/star-bank"
          element={
            <ProtectedRoute>
              <Navbar />
              <StarBankPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/negotiate"
          element={
            <ProtectedRoute>
              <Navbar />
              <SalaryNegotiatorPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume-optimizer"
          element={
            <ProtectedRoute>
              <Navbar />
              <ResumeOptimizerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/:id"
          element={
            <ProtectedRoute>
              <InterviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback/:id"
          element={
            <ProtectedRoute>
              <Navbar />
              <FeedbackPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Navbar />
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Navbar />
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
