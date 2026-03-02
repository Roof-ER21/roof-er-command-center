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

// Pipeline Module
import { ActiveLeadsPage } from "@/modules/pipeline/ActiveLeadsPage";
import { CanvassingPage } from "@/modules/pipeline/CanvassingPage";

// Jobs Module
import { JobsDashboardPage } from "@/modules/jobs/JobsDashboardPage";
import { JobDetailPage } from "@/modules/jobs/JobDetailPage";

// Leaderboard Module
import { LeaderboardDashboard } from "@/modules/leaderboard/LeaderboardDashboard";
import { SalesLeaderboard } from "@/modules/leaderboard/SalesLeaderboard";
import { ContestsPage } from "@/modules/leaderboard/ContestsPage";
import { TVDisplayPage } from "@/modules/leaderboard/pages/TVDisplayPage";
import { TeamsPage } from "@/modules/leaderboard/TeamsPage";

// Notifications Module
import { NotificationsDashboardPage } from "@/modules/notifications/NotificationsDashboardPage";
import { MessagesPage } from "@/modules/notifications/MessagesPage";
import { TaskListPage } from "@/modules/notifications/TaskListPage";
import { RemindersPage } from "@/modules/notifications/RemindersPage";

// Billing Module
import { BillingDashboardPage } from "@/modules/billing/BillingDashboardPage";
import { DownpaymentTrackerPage } from "@/modules/billing/DownpaymentTrackerPage";
import { ARTrackerPage } from "@/modules/billing/ARTrackerPage";

// Claims Module
import { ClaimsDashboardPage } from "@/modules/claims/ClaimsDashboardPage";
import { SupplementTrackerPage } from "@/modules/claims/SupplementTrackerPage";

// Production Module
import { ProductionDashboardPage } from "@/modules/production/ProductionDashboardPage";
import { MaterialTrackerPage } from "@/modules/production/MaterialTrackerPage";
import { PunchOutTrackerPage } from "@/modules/production/PunchOutTrackerPage";
import { QualityInspectionsPage } from "@/modules/production/QualityInspectionsPage";
import { EventCalendarPage } from "@/modules/production/EventCalendarPage";

// Admin Module
import { AutomationControlPage } from "@/modules/admin/AutomationControlPage";
import { DiagnosticsLabPage } from "@/modules/admin/DiagnosticsLabPage";
import { PayrollPage } from "@/modules/admin/PayrollPage";
import { RolesPermissionsPage } from "@/modules/admin/RolesPermissionsPage";
import { PricingLibraryPage } from "@/modules/admin/PricingLibraryPage";
import { FixesImprovementsPage } from "@/modules/admin/FixesImprovementsPage";
import { UserManagementPage } from "@/modules/admin/UserManagementPage";

// Archive Module
import { ArchivedJobsPage } from "@/modules/archive/ArchivedJobsPage";

// Sales Module
import { SalesPerformancePage } from "@/modules/sales/SalesPerformancePage";

// Training Module
import { TrainingDashboard } from "@/modules/training/TrainingDashboard";
import { CoachModePage } from "@/modules/training/CoachModePage";
import { RoleplayPage } from "@/modules/training/RoleplayPage";
import { CurriculumPage } from "@/modules/training/pages/CurriculumPage";
import { AchievementsPage } from "@/modules/training/pages/AchievementsPage";
import { TrainingLeaderboardPage } from "@/modules/training/TrainingLeaderboardPage";
import { ModulePage } from "@/modules/training/pages/ModulePage";

// Field Module
import { FieldDashboard } from "@/modules/field/FieldDashboard";
import { ChatPage } from "@/modules/field/ChatPage";
import { EmailGeneratorPage } from "@/modules/field/EmailGeneratorPage";
import { DocumentsPage as FieldDocumentsPage } from "@/modules/field/DocumentsPage";
import { DocumentAnalysisPage } from "@/modules/field/DocumentAnalysisPage";
import { ImageAnalysisPage } from "@/modules/field/ImageAnalysisPage";
import { ProfilePage } from "@/pages/ProfilePage";

// Public Pages (NO AUTH)
import { PublicDirectoryPage } from "@/pages/PublicDirectoryPage";
import { PublicProfilePage } from "@/pages/PublicProfilePage";

// Protected Route Component
function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
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

          {/* Pipeline Module */}
          <Route path="/pipeline/leads" element={<ActiveLeadsPage />} />
          <Route path="/pipeline/canvassing" element={<CanvassingPage />} />

          {/* Jobs Module */}
          <Route path="/jobs" element={<JobsDashboardPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />

          {/* Leaderboard Module */}
          <Route path="/leaderboard" element={<LeaderboardDashboard />} />
          <Route path="/leaderboard/sales" element={<SalesLeaderboard />} />
          <Route path="/leaderboard/contests" element={<ContestsPage />} />
          <Route path="/leaderboard/teams" element={<TeamsPage />} />

          {/* Sales Module */}
          <Route path="/sales" element={<SalesPerformancePage />} />
          <Route path="/sales/performance" element={<SalesPerformancePage />} />

          {/* Notifications Module */}
          <Route path="/notifications" element={<NotificationsDashboardPage />} />
          <Route path="/notifications/messages" element={<MessagesPage />} />
          <Route path="/notifications/tasks" element={<TaskListPage />} />
          <Route path="/notifications/reminders" element={<RemindersPage />} />

          {/* Billing & Recovery Module */}
          <Route path="/billing" element={<BillingDashboardPage />} />
          <Route path="/billing/downpayments" element={<DownpaymentTrackerPage />} />
          <Route path="/billing/ar" element={<ARTrackerPage />} />

          {/* Claims Center Module */}
          <Route path="/claims" element={<ClaimsDashboardPage />} />
          <Route path="/claims/supplements" element={<SupplementTrackerPage />} />

          {/* Production Hub Module */}
          <Route path="/production" element={<ProductionDashboardPage />} />
          <Route path="/production/materials" element={<MaterialTrackerPage />} />
          <Route path="/production/punch-outs" element={<PunchOutTrackerPage />} />
          <Route path="/production/inspections" element={<QualityInspectionsPage />} />
          <Route path="/production/calendar" element={<EventCalendarPage />} />

          {/* Admin Tools Module */}
          <Route path="/admin/automation" element={<AutomationControlPage />} />
          <Route path="/admin/diagnostics" element={<DiagnosticsLabPage />} />
          <Route path="/admin/payroll" element={<PayrollPage />} />
          <Route path="/admin/roles" element={<RolesPermissionsPage />} />
          <Route path="/admin/pricing" element={<PricingLibraryPage />} />
          <Route path="/admin/fixes" element={<FixesImprovementsPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />

          {/* Archived Jobs */}
          <Route path="/archived" element={<ArchivedJobsPage />} />

          {/* Training Module */}
          <Route path="/training" element={<TrainingDashboard />} />
          <Route path="/training/coach" element={<CoachModePage />} />
          <Route path="/training/roleplay" element={<RoleplayPage />} />
          <Route path="/training/curriculum" element={<CurriculumPage />} />
          <Route path="/training/leaderboard" element={<TrainingLeaderboardPage />} />
          <Route path="/training/modules/:moduleId" element={<ModulePage />} />
          <Route path="/training/achievements" element={<AchievementsPage />} />

          {/* Field Module */}
          <Route path="/field" element={<FieldDashboard />} />
          <Route path="/field/chat" element={<ChatPage />} />
          <Route path="/field/email" element={<EmailGeneratorPage />} />
          <Route path="/field/documents" element={<FieldDocumentsPage />} />
          <Route path="/field/document-analysis" element={<DocumentAnalysisPage />} />
          <Route path="/field/images" element={<ImageAnalysisPage />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* TV Display (no auth, full screen) */}
        <Route path="/leaderboard/tv" element={<TVDisplayPage />} />
        <Route path="/tv-display" element={<TVDisplayPage />} />

        {/* Public Employee Directory (NO AUTH) */}
        <Route path="/directory" element={<PublicDirectoryPage />} />
        <Route path="/team/:slug" element={<PublicProfilePage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
