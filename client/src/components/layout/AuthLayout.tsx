import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/30 via-transparent to-transparent" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col justify-between text-white w-full">
          <div>
            <div className="flex items-center gap-6">
              <img
                src="/logo.png"
                alt="Roof ER Command Center"
                className="w-32 h-32 object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              <span className="text-slate-300">One Platform.</span><br />
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                All Your Operations.
              </span>
            </h2>
            <p className="text-lg text-slate-400">
              HR, Sales, Training, and Field Operations unified in a single powerful platform.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <h3 className="font-semibold mb-1 text-slate-200">HR Management</h3>
                <p className="text-sm text-slate-400">PTO, recruiting, onboarding</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <h3 className="font-semibold mb-1 text-slate-200">Sales Leaderboard</h3>
                <p className="text-sm text-slate-400">Rankings, contests, bonuses</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <h3 className="font-semibold mb-1 text-slate-200">Training Center</h3>
                <p className="text-sm text-slate-400">AI roleplay, curriculum</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <h3 className="font-semibold mb-1 text-slate-200">Field Assistant</h3>
                <p className="text-sm text-slate-400">Susan AI, documents</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Roof ER - The Roof Docs. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-[#0a0a0a] to-slate-950">
        <div className="w-full max-w-md">
          {/* Logo above login card */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="Roof ER Command Center"
              className="w-44 h-44 object-contain drop-shadow-2xl"
            />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
