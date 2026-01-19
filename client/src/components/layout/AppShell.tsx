import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Users,
  Trophy,
  GraduationCap,
  MapPin,
  Home,
  Menu,
  X,
  LogOut,
  Settings,
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  UserPlus,
  UserCog,
  Calendar,
  CalendarClock,
  CalendarDays,
  Briefcase,
  FileText,
  Package,
  UserCheck,
  ShieldCheck,
  Award,
  Tv,
  UsersRound,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Mail,
  FileSearch,
  GitBranch,
  Wrench,
  Bot,
  ClipboardList,
  QrCode,
  KeyRound,
  Image,
  BookOpen,
  Moon,
  Sun,
  DollarSign,
  Target,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth, useModuleAccess } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MODULE_CONFIG } from "@shared/constants";
import { Breadcrumb } from "./Breadcrumb";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { user, logout, isLogoutPending } = useAuth();
  const { theme, setTheme } = useTheme();

  const hasHRAccess = useModuleAccess('hr');
  const hasLeaderboardAccess = useModuleAccess('leaderboard');
  const hasTrainingAccess = useModuleAccess('training');
  const hasFieldAccess = useModuleAccess('field');

  interface NavItem {
    name: string;
    href: string;
    icon: any;
    show: boolean;
    color?: string;
    section?: string;
    children?: Omit<NavItem, 'children'>[];
  }

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home, show: true },
    {
      name: "HR",
      href: "/hr",
      icon: Users,
      show: hasHRAccess,
      color: "text-purple-600",
      children: [
        // Consolidated navigation - 8 main items
        { name: "People", href: "/hr/people", icon: UsersRound, show: hasHRAccess },
        { name: "Recruiting", href: "/hr/recruiting", icon: UserPlus, show: hasHRAccess },
        { name: "Time & Attendance", href: "/hr/time", icon: CalendarClock, show: hasHRAccess },
        { name: "Documents", href: "/hr/documents", icon: FileSearch, show: hasHRAccess },
        { name: "Equipment", href: "/hr/equipment", icon: Package, show: hasHRAccess },
        { name: "Operations", href: "/hr/operations", icon: ClipboardList, show: hasHRAccess },
        { name: "Analytics", href: "/hr/analytics", icon: BarChart3, show: hasHRAccess },
        { name: "Admin", href: "/hr/admin", icon: Settings, show: hasHRAccess },
      ],
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      show: hasLeaderboardAccess,
      color: "text-green-600",
      children: [
        { name: "Rankings", href: "/leaderboard", icon: Trophy, show: hasLeaderboardAccess },
        { name: "Sales Performance", href: "/sales", icon: DollarSign, show: hasLeaderboardAccess },
        { name: "Contests", href: "/leaderboard/contests", icon: Award, show: hasLeaderboardAccess },
        { name: "Teams", href: "/leaderboard/teams", icon: UsersRound, show: hasLeaderboardAccess },
        { name: "TV Display", href: "/leaderboard/tv", icon: Tv, show: hasLeaderboardAccess },
      ],
    },
    {
      name: "Training",
      href: "/training",
      icon: GraduationCap,
      show: hasTrainingAccess,
      color: "text-amber-600",
      children: [
        { name: "Dashboard", href: "/training", icon: Home, show: hasTrainingAccess },
        { name: "Curriculum", href: "/training/curriculum", icon: BookOpen, show: hasTrainingAccess },
        { name: "Roleplay", href: "/training/roleplay", icon: MessageSquare, show: hasTrainingAccess },
        { name: "Achievements", href: "/training/achievements", icon: Award, show: hasTrainingAccess },
        { name: "Leaderboard", href: "/training/leaderboard", icon: Trophy, show: hasTrainingAccess },
      ],
    },
    {
      name: "Field",
      href: "/field",
      icon: MapPin,
      show: hasFieldAccess,
      color: "text-sky-600",
      children: [
        { name: "Chat", href: "/field/chat", icon: MessageSquare, show: hasFieldAccess },
        { name: "Email Generator", href: "/field/email", icon: Mail, show: hasFieldAccess },
        { name: "Documents", href: "/field/documents", icon: FileSearch, show: hasFieldAccess },
        { name: "Images", href: "/field/images", icon: Image, show: hasFieldAccess },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  const toggleSection = (name: string) => {
    setExpandedSections(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isPathActive = (href: string) => {
    // Consolidated HR navigation - People section
    if (href === "/hr/people") {
      return [
        "/hr/people", "/hr/employees", "/hr/team-dashboard", "/hr/team-directory",
        "/hr/org-chart", "/hr/employee-assignments", "/hr/employee-portal"
      ].some(p => location.pathname.startsWith(p));
    }
    // Recruiting section
    if (href === "/hr/recruiting") {
      return [
        "/hr/recruiting", "/hr/recruiting-analytics", "/hr/resume-uploader",
        "/hr/ai-criteria", "/hr/onboarding", "/hr/onboarding-templates"
      ].some(p => location.pathname.startsWith(p));
    }
    // Time & Attendance section
    if (href === "/hr/time") {
      return [
        "/hr/time", "/hr/pto", "/hr/pto-policies", "/hr/attendance",
        "/hr/meeting-rooms", "/hr/calendar", "/hr/qr-codes", "/hr/workplace"
      ].some(p => location.pathname.startsWith(p));
    }
    // Documents section
    if (href === "/hr/documents") {
      return [
        "/hr/documents", "/hr/coi-documents", "/hr/email-templates", "/hr/contracts"
      ].some(p => location.pathname.startsWith(p));
    }
    // Operations section
    if (href === "/hr/operations") {
      return [
        "/hr/operations", "/hr/tools", "/hr/territories", "/hr/reviews",
        "/hr/workflows", "/hr/tasks"
      ].some(p => location.pathname.startsWith(p));
    }
    // Analytics section
    if (href === "/hr/analytics") {
      return [
        "/hr/analytics", "/hr/enterprise-analytics", "/hr/safety", "/hr/roadmap"
      ].some(p => location.pathname.startsWith(p));
    }
    // Admin section
    if (href === "/hr/admin") {
      return [
        "/hr/admin", "/hr/admin-hub", "/hr/susan-ai-admin",
        "/hr/scheduled-reports", "/hr/google-integration"
      ].some(p => location.pathname.startsWith(p));
    }
    return location.pathname === href ||
      (href !== '/dashboard' && location.pathname.startsWith(href));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">RE</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Mobile breadcrumb */}
        <div className="px-3 pb-2">
          <Breadcrumb />
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">RE</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Roof ER</span>
                <span className="text-xs text-muted-foreground">Command Center</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation
            .filter((item) => item.show)
            .map((item) => {
              const isActive = isPathActive(item.href);
              const isExpanded = expandedSections[item.name] ?? isActive;
              const hasChildren = item.children && item.children.length > 0;
              const children = item.children?.filter((child) => child.show) ?? [];
              const groupedChildren = (() => {
                if (!children.some((child) => child.section)) return null;
                const groups: Array<{ section: string; items: typeof children }> = [];
                for (const child of children) {
                  const label = child.section || "Other";
                  const group = groups.find((entry) => entry.section === label);
                  if (group) {
                    group.items.push(child);
                  } else {
                    groups.push({ section: label, items: [child] });
                  }
                }
                return groups;
              })();

              return (
                <div key={item.name}>
                  {/* Parent item */}
                  {hasChildren && sidebarOpen ? (
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 flex-shrink-0", item.color)} />
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        !sidebarOpen && "justify-center"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 flex-shrink-0", item.color)} />
                      {sidebarOpen && <span>{item.name}</span>}
                    </Link>
                  )}

                  {/* Child items */}
                  {hasChildren && sidebarOpen && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
                      {groupedChildren
                        ? groupedChildren.map((group) => (
                            <div key={group.section} className="space-y-1">
                              <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {group.section}
                              </div>
                              {group.items.map((child) => {
                                const isChildActive = isPathActive(child.href);
                                return (
                                  <Link
                                    key={child.href}
                                    to={child.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                                      isChildActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                  >
                                    <child.icon className="h-4 w-4 flex-shrink-0" />
                                    <span>{child.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          ))
                        : children.map((child) => {
                            const isChildActive = isPathActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                to={child.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                                  isChildActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <child.icon className="h-4 w-4 flex-shrink-0" />
                                <span>{child.name}</span>
                              </Link>
                            );
                          })}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Toggle sidebar button (desktop only) */}
        <div className="hidden lg:block px-2 py-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                sidebarOpen ? "rotate-90" : "-rotate-90"
              )}
            />
          </Button>
        </div>

        {/* User section */}
        <div className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full",
                  sidebarOpen ? "justify-start px-3" : "justify-center px-0"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.role?.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLogoutPending}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLogoutPending ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 pt-24 lg:pt-0",
          sidebarOpen ? "lg:pl-64" : "lg:pl-16"
        )}
      >
        {/* Top bar (desktop) */}
        <header className="hidden lg:flex items-center justify-between h-16 px-6 border-b bg-background">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
