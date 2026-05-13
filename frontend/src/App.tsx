import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ModulesPage from '@/pages/ModulesPage';
import TopicPage from '@/pages/TopicPage';
import TestPage from '@/pages/TestPage';
import ProgressPage from '@/pages/ProgressPage';
import LabsPage from '@/pages/LabsPage';
import GlossaryPage from '@/pages/GlossaryPage';
import TeacherContentPage from '@/pages/teacher/ContentPage';
import TeacherLabsPage from '@/pages/teacher/LabsPage';
import TeacherStatsPage from '@/pages/teacher/StatsPage';
import TeacherStudentsPage from '@/pages/teacher/StudentsPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/modules" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/modules" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/modules"
          element={
            <ProtectedRoute>
              <ModulesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/topic/:topicId"
          element={
            <ProtectedRoute>
              <TopicPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/topic/:topicId/test"
          element={
            <ProtectedRoute>
              <TestPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/labs"
          element={
            <ProtectedRoute>
              <LabsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/glossary"
          element={
            <ProtectedRoute>
              <GlossaryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/content"
          element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherContentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/labs"
          element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherLabsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/stats"
          element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherStatsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherStudentsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
