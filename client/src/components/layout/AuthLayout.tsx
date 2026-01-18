import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-red-50 via-background to-gray-50 dark:from-red-950/20 dark:via-background dark:to-gray-950/20">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-700 to-red-900 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold">RE</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Roof ER</h1>
              <p className="text-sm opacity-80">Command Center</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            One Platform.<br />
            All Your Operations.
          </h2>
          <p className="text-lg opacity-90">
            HR, Sales, Training, and Field Operations unified in a single powerful platform.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-1">HR Management</h3>
              <p className="text-sm opacity-80">PTO, recruiting, onboarding</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Sales Leaderboard</h3>
              <p className="text-sm opacity-80">Rankings, contests, bonuses</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Training Center</h3>
              <p className="text-sm opacity-80">AI roleplay, curriculum</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-semibold mb-1">Field Assistant</h3>
              <p className="text-sm opacity-80">Susan AI, documents</p>
            </div>
          </div>
        </div>

        <div className="text-sm opacity-60">
          &copy; {new Date().getFullYear()} Roof ER. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
