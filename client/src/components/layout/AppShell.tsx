import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home,
  Menu,
  X,
  LogOut,
  Settings,
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  Moon,
  Sun,
  // CRM Icons
  Target,
  MapPin,
  Briefcase,
  Trophy,
  MessageSquare,
  DollarSign,
  FileCheck,
  Hammer,
  Shield,
  Archive,
  GraduationCap,
  // Sub-nav icons
  Users,
  Navigation,
  ClipboardList,
  Clock,
  AlertTriangle,
  CreditCard,
  BarChart3,
  Package,
  Wrench,
  ClipboardCheck,
  CalendarDays,
  Zap,
  PieChart,
  Calculator,
  LayoutTemplate,
  Bug,
  UserPlus,
  Mail,
  FileSearch,
  Image,
  Scale,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
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
import { Breadcrumb } from "./Breadcrumb";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { user, logout, isLogoutPending } = useAuth();
  const { theme, setTheme } = useTheme();

  interface NavItem {
    name: string;
    href: string;
    icon: any;
    color?: string;
    children?: Omit<NavItem, 'children'>[];
  }

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    {
      name: "Pipeline",
      href: "/pipeline/leads",
      icon: Target,
      color: "text-blue-600",
      children: [
        { name: "Active Leads", href: "/pipeline/leads", icon: Users },
        { name: "Canvassing", href: "/pipeline/canvassing", icon: Navigation },
      ],
    },
    {
      name: "Jobs",
      href: "/jobs",
      icon: Briefcase,
      color: "text-indigo-600",
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      color: "text-green-600",
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      color: "text-amber-600",
      children: [
        { name: "Dashboard", href: "/notifications", icon: Bell },
        { name: "Messages", href: "/notifications/messages", icon: MessageSquare },
        { name: "Task List", href: "/notifications/tasks", icon: ClipboardList },
        { name: "Reminders", href: "/notifications/reminders", icon: Clock },
      ],
    },
    {
      name: "Billing & Recovery",
      href: "/billing",
      icon: DollarSign,
      color: "text-emerald-600",
      children: [
        { name: "Dashboard", href: "/billing", icon: DollarSign },
        { name: "Downpayment Tracker", href: "/billing/downpayments", icon: CreditCard },
        { name: "A/R Tracker", href: "/billing/ar", icon: BarChart3 },
      ],
    },
    {
      name: "Claims Center",
      href: "/claims",
      icon: FileCheck,
      color: "text-purple-600",
      children: [
        { name: "Dashboard", href: "/claims", icon: FileCheck },
        { name: "Supplement Tracker", href: "/claims/supplements", icon: ClipboardList },
      ],
    },
    {
      name: "Production Hub",
      href: "/production",
      icon: Hammer,
      color: "text-orange-600",
      children: [
        { name: "Dashboard", href: "/production", icon: Hammer },
        { name: "Material Tracker", href: "/production/materials", icon: Package },
        { name: "Punch Out Tracker", href: "/production/punch-outs", icon: Wrench },
        { name: "Quality Inspections", href: "/production/inspections", icon: ClipboardCheck },
        { name: "Event Calendar", href: "/production/calendar", icon: CalendarDays },
      ],
    },
    {
      name: "Admin Tools",
      href: "/admin/automation",
      icon: Shield,
      color: "text-red-600",
      children: [
        { name: "Automation Control", href: "/admin/automation", icon: Zap },
        { name: "Diagnostics Lab", href: "/admin/diagnostics", icon: PieChart },
        { name: "Payroll & Compensation", href: "/admin/payroll", icon: Calculator },
        { name: "Roles & Permissions", href: "/admin/roles", icon: Shield },
        { name: "Pricing Library", href: "/admin/pricing", icon: LayoutTemplate },
        { name: "Fixes / Improvements", href: "/admin/fixes", icon: Bug },
        { name: "Users", href: "/admin/users", icon: UserPlus },
      ],
    },
    {
      name: "Archived Jobs",
      href: "/archived",
      icon: Archive,
      color: "text-gray-600",
    },
    {
      name: "Training",
      href: "/training",
      icon: GraduationCap,
      color: "text-amber-600",
    },
    {
      name: "Field",
      href: "/field",
      icon: MapPin,
      color: "text-sky-600",
      children: [
        { name: "Chat", href: "/field/chat", icon: MessageSquare },
        { name: "Email Generator", href: "/field/email", icon: Mail },
        { name: "Documents", href: "/field/documents", icon: FileSearch },
        { name: "Images", href: "/field/images", icon: Image },
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
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === href ||
      location.pathname.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (isPathActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isPathActive(child.href));
    }
    return false;
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
            <img src="/logo.png" alt="Roof ER" className="w-8 h-8 object-contain" />
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
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link to="/notifications"><Bell className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
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
            <img src="/logo.png" alt="Roof ER" className="w-8 h-8 object-contain flex-shrink-0" />
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
          {navigation.map((item) => {
            const isActive = isParentActive(item);
            const isExpanded = expandedSections[item.name] ?? isActive;
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.name}>
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
                    {item.children!.map((child) => {
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
            <Button variant="ghost" size="icon" asChild>
              <Link to="/notifications"><Bell className="h-5 w-5" /></Link>
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
