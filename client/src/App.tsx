import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";

// Layout
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";

// Auth pages
import { LoginPage } from "@/modules/auth/LoginPage";
import { PinLoginPage } from "@/modules/auth/PinLoginPage";

// Dashboard
import { DashboardPage } from "@/modules/dashboard/DashboardPage";

// HR Module
import { HRDashboard } from "@/modules/hr/HRDashboard";
import { EmployeesPage } from "@/modules/hr/EmployeesPage";
import { PTOPage } from "@/modules/hr/PTOPage";
import { RecruitingPage } from "@/modules/hr/RecruitingPage";

// Leaderboard Module
import { LeaderboardDashboard } from "@/modules/leaderboard/LeaderboardDashboard";
import { SalesLeaderboard } from "@/modules/leaderboard/SalesLeaderboard";
import { ContestsPage } from "@/modules/leaderboard/ContestsPage";
import { TVDisplayPage } from "@/modules/leaderboard/TVDisplayPage";

// Training Module
import { TrainingDashboard } from "@/modules/training/TrainingDashboard";
import { CoachModePage } from "@/modules/training/CoachModePage";
import { RoleplayPage } from "@/modules/training/RoleplayPage";
import { CurriculumPage } from "@/modules/training/CurriculumPage";
import { AchievementsPage } from "@/modules/training/AchievementsPage";

// Field Module
import { FieldDashboard } from "@/modules/field/FieldDashboard";
import { ChatPage } from "@/modules/field/ChatPage";
import { EmailGeneratorPage } from "@/modules/field/EmailGeneratorPage";
import { DocumentsPage } from "@/modules/field/DocumentsPage";

// Protected Route Component
function ProtectedRoute({
  children,
  requiredModule
}: {
  children: React.ReactNode;
  requiredModule?: 'hr' | 'leaderboard' | 'training' | 'field';
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check module access if required
  if (requiredModule) {
    const hasAccess =
      (requiredModule === 'hr' && user.hasHRAccess) ||
      (requiredModule === 'leaderboard' && user.hasLeaderboardAccess) ||
      (requiredModule === 'training' && user.hasTrainingAccess) ||
      (requiredModule === 'field' && user.hasFieldAccess);

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pin-login" element={<PinLoginPage />} />
        </Route>

        {/* Protected routes with AppShell */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          {/* Main Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* HR Module */}
          <Route path="/hr" element={<ProtectedRoute requiredModule="hr"><HRDashboard /></ProtectedRoute>} />
          <Route path="/hr/employees" element={<ProtectedRoute requiredModule="hr"><EmployeesPage /></ProtectedRoute>} />
          <Route path="/hr/pto" element={<ProtectedRoute requiredModule="hr"><PTOPage /></ProtectedRoute>} />
          <Route path="/hr/recruiting" element={<ProtectedRoute requiredModule="hr"><RecruitingPage /></ProtectedRoute>} />

          {/* Leaderboard Module */}
          <Route path="/leaderboard" element={<ProtectedRoute requiredModule="leaderboard"><LeaderboardDashboard /></ProtectedRoute>} />
          <Route path="/leaderboard/sales" element={<ProtectedRoute requiredModule="leaderboard"><SalesLeaderboard /></ProtectedRoute>} />
          <Route path="/leaderboard/contests" element={<ProtectedRoute requiredModule="leaderboard"><ContestsPage /></ProtectedRoute>} />

          {/* Training Module */}
          <Route path="/training" element={<ProtectedRoute requiredModule="training"><TrainingDashboard /></ProtectedRoute>} />
          <Route path="/training/coach" element={<ProtectedRoute requiredModule="training"><CoachModePage /></ProtectedRoute>} />
          <Route path="/training/roleplay" element={<ProtectedRoute requiredModule="training"><RoleplayPage /></ProtectedRoute>} />
          <Route path="/training/curriculum" element={<ProtectedRoute requiredModule="training"><CurriculumPage /></ProtectedRoute>} />
          <Route path="/training/achievements" element={<ProtectedRoute requiredModule="training"><AchievementsPage /></ProtectedRoute>} />

          {/* Field Module */}
          <Route path="/field" element={<ProtectedRoute requiredModule="field"><FieldDashboard /></ProtectedRoute>} />
          <Route path="/field/chat" element={<ProtectedRoute requiredModule="field"><ChatPage /></ProtectedRoute>} />
          <Route path="/field/email" element={<ProtectedRoute requiredModule="field"><EmailGeneratorPage /></ProtectedRoute>} />
          <Route path="/field/documents" element={<ProtectedRoute requiredModule="field"><DocumentsPage /></ProtectedRoute>} />
        </Route>

        {/* TV Display (no auth, full screen) */}
        <Route path="/tv-display" element={<TVDisplayPage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
