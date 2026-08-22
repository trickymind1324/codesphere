import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LegalPage } from '@/pages/LegalPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProblemsPage } from '@/pages/ProblemsPage';
import { ProblemRouter } from '@/pages/ProblemRouter';
import { SubmissionsPage } from '@/pages/SubmissionsPage';
import { PlaybackPage } from '@/pages/PlaybackPage';
import { RecruiterDashboard } from '@/pages/RecruiterDashboard';
import { RecruiterProfilePage } from '@/pages/RecruiterProfilePage';
import { AssessmentForm } from '@/pages/AssessmentForm';
import { AssessmentDetail } from '@/pages/AssessmentDetail';
import { InvitationForm } from '@/pages/InvitationForm';
import { ResultsPage } from '@/pages/ResultsPage';
import { AssessmentLanding } from '@/pages/AssessmentLanding';
import { AssessmentIDE } from '@/pages/AssessmentIDE';
import { AssessmentCompleted } from '@/pages/AssessmentCompleted';
import { EmailVerificationPage } from '@/pages/EmailVerificationPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomeRedirect } from '@/components/auth/HomeRedirect';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          {/* Public, shareable profile */}
          <Route path="/profile/:userId" element={<ProfilePage />} />
          {/* Own profile (any signed-in user) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/problems"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <ProblemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/problems/:slug"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <ProblemRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <SubmissionsPage />
              </ProtectedRoute>
            }
          />
          {/* Candidates replay their own sessions; recruiter-side roles can
              open a shared playback link when reviewing a candidate. */}
          <Route
            path="/playback/:sessionId"
            element={
              <ProtectedRoute
                allowedRoles={['candidate', 'recruiter', 'company_admin', 'platform_admin']}
              >
                <PlaybackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'company_admin', 'platform_admin']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/profile"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'company_admin', 'platform_admin']}>
                <RecruiterProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/assessments/new"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'company_admin', 'platform_admin']}>
                <AssessmentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/assessments/:id"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'company_admin', 'platform_admin']}>
                <AssessmentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/assessments/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'company_admin', 'platform_admin']}>
                <AssessmentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/assessments/:id/invite"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'company_admin', 'platform_admin']}>
                <InvitationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/assessments/:id/results"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'company_admin', 'platform_admin']}>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/assessment/:token" element={<AssessmentLanding />} />
          <Route path="/assessment/:token/problem/:index" element={<AssessmentIDE />} />
          <Route path="/assessment/:token/completed" element={<AssessmentCompleted />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
