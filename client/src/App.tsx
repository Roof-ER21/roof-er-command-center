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
import { ResumeUploaderPage } from "@/modules/hr/pages/ResumeUploaderPage";
import { ContractsPage } from "@/modules/hr/pages/ContractsPage";
import { EquipmentPage } from "@/modules/hr/pages/EquipmentPage";
import { OnboardingPage } from "@/modules/hr/pages/OnboardingPage";
import { EmployeeDetailPage } from "@/modules/hr/pages/EmployeeDetailPage";
import { DocumentsPage } from "@/modules/hr/pages/DocumentsPage";
import { ReviewsPage } from "@/modules/hr/pages/ReviewsPage";
import { TeamDirectoryPage } from "@/modules/hr/pages/TeamDirectoryPage";
import { OrgChartPage } from "@/modules/hr/pages/OrgChartPage";
import { AttendancePage } from "@/modules/hr/pages/AttendancePage";
import { MeetingRoomsPage } from "@/modules/hr/pages/MeetingRoomsPage";
import { TerritoriesPage } from "@/modules/hr/pages/TerritoriesPage";
import { EmployeeAssignmentsPage } from "@/modules/hr/pages/EmployeeAssignmentsPage";
import { WorkflowBuilderPage } from "@/modules/hr/pages/WorkflowBuilderPage";
import { ToolsPage } from "@/modules/hr/pages/ToolsPage";
import { EmployeePortalPage } from "@/modules/hr/pages/EmployeePortalPage";
import { SusanAIAdminPage } from "@/modules/hr/pages/SusanAIAdminPage";
import { PublicContractPage } from "@/modules/hr/pages/PublicContractPage";
import { EquipmentAgreementFormPage } from "@/modules/hr/pages/EquipmentAgreementFormPage";
import { EquipmentChecklistFormPage } from "@/modules/hr/pages/EquipmentChecklistFormPage";
import { EquipmentReturnFormPage } from "@/modules/hr/pages/EquipmentReturnFormPage";
import { SignEquipmentReceiptPage } from "@/modules/hr/pages/SignEquipmentReceiptPage";
import { TasksPage } from "@/modules/hr/pages/TasksPage";
import { MyCalendarPage } from "@/modules/hr/pages/MyCalendarPage";
import { WorkplacePage } from "@/modules/hr/pages/WorkplacePage";
import { ScheduledReportsPage } from "@/modules/hr/pages/ScheduledReportsPage";
import { QrCodesPage } from "@/modules/hr/pages/QrCodesPage";
import { AdminControlHubPage } from "@/modules/hr/pages/AdminControlHubPage";
import { GoogleIntegrationPage } from "@/modules/hr/pages/GoogleIntegrationPage";
import { TeamDashboardPage } from "@/modules/hr/pages/TeamDashboardPage";
import { EnterpriseAnalyticsPage } from "@/modules/hr/pages/EnterpriseAnalyticsPage";
import { SafetyDashboardPage } from "@/modules/hr/pages/SafetyDashboardPage";
import { RoadmapPage } from "@/modules/hr/pages/RoadmapPage";
// Consolidated HR Hub Pages
import { PeoplePage } from "@/modules/hr/pages/PeoplePage";
import { TimePage } from "@/modules/hr/pages/TimePage";
import { OperationsPage } from "@/modules/hr/pages/OperationsPage";
import { AnalyticsPage } from "@/modules/hr/pages/AnalyticsPage";
import { AdminPage } from "@/modules/hr/pages/AdminPage";

// Leaderboard Module
import { LeaderboardDashboard } from "@/modules/leaderboard/LeaderboardDashboard";
import { SalesLeaderboard } from "@/modules/leaderboard/SalesLeaderboard";
import { ContestsPage } from "@/modules/leaderboard/ContestsPage";
import { TVDisplayPage } from "@/modules/leaderboard/pages/TVDisplayPage";
import { TeamsPage } from "@/modules/leaderboard/TeamsPage";

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
          {/* Consolidated HR Hub Pages */}
          <Route path="/hr/people" element={<ProtectedRoute requiredModule="hr"><PeoplePage /></ProtectedRoute>} />
          <Route path="/hr/time" element={<ProtectedRoute requiredModule="hr"><TimePage /></ProtectedRoute>} />
          <Route path="/hr/operations" element={<ProtectedRoute requiredModule="hr"><OperationsPage /></ProtectedRoute>} />
          <Route path="/hr/analytics" element={<ProtectedRoute requiredModule="hr"><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/hr/admin" element={<ProtectedRoute requiredModule="hr"><AdminPage /></ProtectedRoute>} />
          {/* Individual HR Pages (accessed via hub pages) */}
          <Route path="/hr/employees" element={<ProtectedRoute requiredModule="hr"><EmployeesPage /></ProtectedRoute>} />
          <Route path="/hr/employees/:id" element={<ProtectedRoute requiredModule="hr"><EmployeeDetailPage /></ProtectedRoute>} />
          <Route path="/hr/pto" element={<ProtectedRoute requiredModule="hr"><PTOPage /></ProtectedRoute>} />
          <Route path="/hr/recruiting" element={<ProtectedRoute requiredModule="hr"><RecruitingPage /></ProtectedRoute>} />
          <Route path="/hr/contracts" element={<ProtectedRoute requiredModule="hr"><ContractsPage /></ProtectedRoute>} />
          <Route path="/hr/equipment" element={<ProtectedRoute requiredModule="hr"><EquipmentPage /></ProtectedRoute>} />
          <Route path="/hr/equipment-agreement" element={<ProtectedRoute requiredModule="hr"><EquipmentPage /></ProtectedRoute>} />
          <Route path="/hr/equipment-checklist" element={<ProtectedRoute requiredModule="hr"><EquipmentPage /></ProtectedRoute>} />
          <Route path="/hr/equipment-return" element={<ProtectedRoute requiredModule="hr"><EquipmentPage /></ProtectedRoute>} />
          <Route path="/hr/equipment-receipt" element={<ProtectedRoute requiredModule="hr"><EquipmentPage /></ProtectedRoute>} />
          <Route path="/hr/onboarding" element={<ProtectedRoute requiredModule="hr"><OnboardingPage /></ProtectedRoute>} />
          <Route path="/hr/documents" element={<ProtectedRoute requiredModule="hr"><DocumentsPage /></ProtectedRoute>} />
          <Route path="/hr/reviews" element={<ProtectedRoute requiredModule="hr"><ReviewsPage /></ProtectedRoute>} />
          <Route path="/hr/team-directory" element={<ProtectedRoute requiredModule="hr"><TeamDirectoryPage /></ProtectedRoute>} />
          <Route path="/hr/org-chart" element={<ProtectedRoute requiredModule="hr"><OrgChartPage /></ProtectedRoute>} />
          <Route path="/hr/attendance" element={<ProtectedRoute requiredModule="hr"><AttendancePage /></ProtectedRoute>} />
          <Route path="/hr/meeting-rooms" element={<ProtectedRoute requiredModule="hr"><MeetingRoomsPage /></ProtectedRoute>} />
          <Route path="/hr/pto-policies" element={<ProtectedRoute requiredModule="hr"><PTOPage /></ProtectedRoute>} />
          <Route path="/hr/territories" element={<ProtectedRoute requiredModule="hr"><TerritoriesPage /></ProtectedRoute>} />
          <Route path="/hr/onboarding-templates" element={<ProtectedRoute requiredModule="hr"><OnboardingPage /></ProtectedRoute>} />
          <Route path="/hr/email-templates" element={<ProtectedRoute requiredModule="hr"><DocumentsPage /></ProtectedRoute>} />
          <Route path="/hr/recruiting-analytics" element={<ProtectedRoute requiredModule="hr"><RecruitingPage /></ProtectedRoute>} />
          <Route path="/hr/enterprise-analytics" element={<ProtectedRoute requiredModule="hr"><EnterpriseAnalyticsPage /></ProtectedRoute>} />
          <Route path="/hr/safety" element={<ProtectedRoute requiredModule="hr"><SafetyDashboardPage /></ProtectedRoute>} />
          <Route path="/hr/roadmap" element={<ProtectedRoute requiredModule="hr"><RoadmapPage /></ProtectedRoute>} />
          <Route path="/hr/coi-documents" element={<ProtectedRoute requiredModule="hr"><DocumentsPage /></ProtectedRoute>} />
          <Route path="/hr/employee-assignments" element={<ProtectedRoute requiredModule="hr"><EmployeeAssignmentsPage /></ProtectedRoute>} />
          <Route path="/hr/workflows" element={<ProtectedRoute requiredModule="hr"><WorkflowBuilderPage /></ProtectedRoute>} />
          <Route path="/hr/tools" element={<ProtectedRoute requiredModule="hr"><ToolsPage /></ProtectedRoute>} />
          <Route path="/hr/employee-portal" element={<ProtectedRoute requiredModule="hr"><EmployeePortalPage /></ProtectedRoute>} />
          <Route path="/hr/susan-ai-admin" element={<ProtectedRoute requiredModule="hr"><SusanAIAdminPage /></ProtectedRoute>} />
          <Route path="/hr/tasks" element={<ProtectedRoute requiredModule="hr"><TasksPage /></ProtectedRoute>} />
          <Route path="/hr/workplace" element={<ProtectedRoute requiredModule="hr"><WorkplacePage /></ProtectedRoute>} />
          <Route path="/hr/calendar" element={<Navigate to="/hr/workplace?tab=calendar" replace />} />
          <Route path="/hr/meeting-rooms" element={<Navigate to="/hr/workplace?tab=rooms" replace />} />
          <Route path="/hr/qr-codes" element={<Navigate to="/hr/workplace?tab=qr" replace />} />
          <Route path="/hr/scheduled-reports" element={<ProtectedRoute requiredModule="hr"><ScheduledReportsPage /></ProtectedRoute>} />
          <Route path="/hr/attendance/check-in" element={<ProtectedRoute requiredModule="hr"><AttendancePage /></ProtectedRoute>} />
          <Route path="/hr/admin-hub" element={<ProtectedRoute requiredModule="hr"><AdminControlHubPage /></ProtectedRoute>} />
          <Route path="/hr/google-integration" element={<ProtectedRoute requiredModule="hr"><GoogleIntegrationPage /></ProtectedRoute>} />
          <Route path="/hr/team-dashboard" element={<ProtectedRoute requiredModule="hr"><TeamDashboardPage /></ProtectedRoute>} />
          <Route path="/hr/resume-uploader" element={<ProtectedRoute requiredModule="hr"><ResumeUploaderPage /></ProtectedRoute>} />
          <Route path="/hr/ai-criteria" element={<ProtectedRoute requiredModule="hr"><RecruitingPage /></ProtectedRoute>} />
          <Route path="/hr/profile" element={<ProtectedRoute requiredModule="hr"><ProfilePage /></ProtectedRoute>} />

          {/* Leaderboard Module */}
          <Route path="/leaderboard" element={<ProtectedRoute requiredModule="leaderboard"><LeaderboardDashboard /></ProtectedRoute>} />
          <Route path="/leaderboard/sales" element={<ProtectedRoute requiredModule="leaderboard"><SalesLeaderboard /></ProtectedRoute>} />
          <Route path="/leaderboard/contests" element={<ProtectedRoute requiredModule="leaderboard"><ContestsPage /></ProtectedRoute>} />
          <Route path="/leaderboard/teams" element={<ProtectedRoute requiredModule="leaderboard"><TeamsPage /></ProtectedRoute>} />

          {/* Sales Module */}
          <Route path="/sales" element={<ProtectedRoute requiredModule="leaderboard"><SalesPerformancePage /></ProtectedRoute>} />
          <Route path="/sales/performance" element={<ProtectedRoute requiredModule="leaderboard"><SalesPerformancePage /></ProtectedRoute>} />

          {/* Training Module */}
          <Route path="/training" element={<ProtectedRoute requiredModule="training"><TrainingDashboard /></ProtectedRoute>} />
          <Route path="/training/coach" element={<ProtectedRoute requiredModule="training"><CoachModePage /></ProtectedRoute>} />
          <Route path="/training/roleplay" element={<ProtectedRoute requiredModule="training"><RoleplayPage /></ProtectedRoute>} />
          <Route path="/training/curriculum" element={<ProtectedRoute requiredModule="training"><CurriculumPage /></ProtectedRoute>} />
          <Route path="/training/leaderboard" element={<ProtectedRoute requiredModule="training"><TrainingLeaderboardPage /></ProtectedRoute>} />
          <Route path="/training/modules/:moduleId" element={<ProtectedRoute requiredModule="training"><ModulePage /></ProtectedRoute>} />
          <Route path="/training/achievements" element={<ProtectedRoute requiredModule="training"><AchievementsPage /></ProtectedRoute>} />

          {/* Field Module */}
          <Route path="/field" element={<ProtectedRoute requiredModule="field"><FieldDashboard /></ProtectedRoute>} />
          <Route path="/field/chat" element={<ProtectedRoute requiredModule="field"><ChatPage /></ProtectedRoute>} />
          <Route path="/field/email" element={<ProtectedRoute requiredModule="field"><EmailGeneratorPage /></ProtectedRoute>} />
          <Route path="/field/documents" element={<ProtectedRoute requiredModule="field"><FieldDocumentsPage /></ProtectedRoute>} />
          <Route path="/field/document-analysis" element={<ProtectedRoute requiredModule="field"><DocumentAnalysisPage /></ProtectedRoute>} />
          <Route path="/field/images" element={<ProtectedRoute requiredModule="field"><ImageAnalysisPage /></ProtectedRoute>} />
        </Route>

        {/* TV Display (no auth, full screen) */}
        <Route path="/leaderboard/tv" element={<TVDisplayPage />} />
        <Route path="/tv-display" element={<TVDisplayPage />} />

        {/* Public Employee Directory (NO AUTH) */}
        <Route path="/directory" element={<PublicDirectoryPage />} />
        <Route path="/team/:slug" element={<PublicProfilePage />} />

        {/* Public HR forms */}
        <Route path="/public/contract/:token" element={<PublicContractPage />} />
        <Route path="/public/equipment-agreement/:token" element={<EquipmentAgreementFormPage />} />
        <Route path="/public/equipment-checklist/:token" element={<EquipmentChecklistFormPage />} />
        <Route path="/public/equipment-return/:token" element={<EquipmentReturnFormPage />} />
        <Route path="/public/equipment-receipt/:token" element={<SignEquipmentReceiptPage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
