import { ChevronRight, ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Define hub page mappings for consolidated navigation
const hubPageMappings: Record<string, { hub: string; hubLabel: string }> = {
  // People section
  "/hr/employees": { hub: "/hr/people", hubLabel: "People" },
  "/hr/team-dashboard": { hub: "/hr/people", hubLabel: "People" },
  "/hr/team-directory": { hub: "/hr/people", hubLabel: "People" },
  "/hr/org-chart": { hub: "/hr/people", hubLabel: "People" },
  "/hr/employee-assignments": { hub: "/hr/people", hubLabel: "People" },
  "/hr/employee-portal": { hub: "/hr/people", hubLabel: "People" },
  // Recruiting section
  "/hr/onboarding": { hub: "/hr/recruiting", hubLabel: "Recruiting" },
  "/hr/onboarding-templates": { hub: "/hr/recruiting", hubLabel: "Recruiting" },
  "/hr/resume-uploader": { hub: "/hr/recruiting", hubLabel: "Recruiting" },
  "/hr/ai-criteria": { hub: "/hr/recruiting", hubLabel: "Recruiting" },
  "/hr/recruiting-analytics": { hub: "/hr/recruiting", hubLabel: "Recruiting" },
  // Time & Attendance section
  "/hr/pto": { hub: "/hr/time", hubLabel: "Time & Attendance" },
  "/hr/pto-policies": { hub: "/hr/time", hubLabel: "Time & Attendance" },
  "/hr/attendance": { hub: "/hr/time", hubLabel: "Time & Attendance" },
  "/hr/meeting-rooms": { hub: "/hr/time", hubLabel: "Time & Attendance" },
  "/hr/calendar": { hub: "/hr/time", hubLabel: "Time & Attendance" },
  "/hr/qr-codes": { hub: "/hr/time", hubLabel: "Time & Attendance" },
  "/hr/workplace": { hub: "/hr/time", hubLabel: "Time & Attendance" },
  // Documents section
  "/hr/contracts": { hub: "/hr/documents", hubLabel: "Documents" },
  "/hr/coi-documents": { hub: "/hr/documents", hubLabel: "Documents" },
  "/hr/email-templates": { hub: "/hr/documents", hubLabel: "Documents" },
  // Operations section
  "/hr/tasks": { hub: "/hr/operations", hubLabel: "Operations" },
  "/hr/reviews": { hub: "/hr/operations", hubLabel: "Operations" },
  "/hr/workflows": { hub: "/hr/operations", hubLabel: "Operations" },
  "/hr/territories": { hub: "/hr/operations", hubLabel: "Operations" },
  "/hr/tools": { hub: "/hr/operations", hubLabel: "Operations" },
  // Analytics section
  "/hr/enterprise-analytics": { hub: "/hr/analytics", hubLabel: "Analytics" },
  "/hr/safety": { hub: "/hr/analytics", hubLabel: "Analytics" },
  "/hr/roadmap": { hub: "/hr/analytics", hubLabel: "Analytics" },
  // Admin section
  "/hr/admin-hub": { hub: "/hr/admin", hubLabel: "Admin" },
  "/hr/susan-ai-admin": { hub: "/hr/admin", hubLabel: "Admin" },
  "/hr/scheduled-reports": { hub: "/hr/admin", hubLabel: "Admin" },
  "/hr/google-integration": { hub: "/hr/admin", hubLabel: "Admin" },
};

export function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  // Find if current path has a hub parent
  const basePath = "/" + location.pathname.split("/").slice(1, 3).join("/");
  const hubMapping = hubPageMappings[basePath];

  // Get back destination
  const getBackDestination = () => {
    if (hubMapping) {
      return hubMapping.hub;
    }
    // For nested paths, go up one level
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      return "/" + segments.slice(0, -1).join("/");
    }
    return "/dashboard";
  };

  const backDestination = getBackDestination();

  // Build breadcrumb items
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/dashboard" }];

    const pathnames = location.pathname.split("/").filter((x) => x);

    // Determine module name
    const moduleName = pathnames[0];
    if (moduleName === "hr") {
      items.push({ label: "HR", href: "/hr" });

      // Check if we have a hub parent
      if (hubMapping) {
        items.push({ label: hubMapping.hubLabel, href: hubMapping.hub });
      }

      // Add current page (last segment)
      if (pathnames.length > 1) {
        const lastSegment = pathnames[pathnames.length - 1];
        // Don't duplicate if it's the hub page itself
        const currentLabel = formatLabel(lastSegment);
        const lastItem = items[items.length - 1];
        if (lastItem?.label !== currentLabel) {
          items.push({ label: currentLabel });
        }
      }
    } else {
      // For non-HR routes, use simple path-based breadcrumbs
      pathnames.forEach((segment, index) => {
        const href = `/${pathnames.slice(0, index + 1).join("/")}`;
        const label = formatLabel(segment);
        const isLast = index === pathnames.length - 1;
        items.push({ label, href: isLast ? undefined : href });
      });
    }

    return items;
  };

  const items = buildBreadcrumbs();

  // Don't show breadcrumb on dashboard page
  if (location.pathname === "/dashboard" || location.pathname === "/") {
    return null;
  }

  const showBackButton = location.pathname !== "/dashboard" && location.pathname !== "/";

  return (
    <div className="flex items-center gap-2">
      {/* Back button - visible on all screens */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => navigate(backDestination)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      )}

      {/* Breadcrumb trail - hidden on mobile */}
      <nav className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={item.href || index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
              )}
              {isLast || !item.href ? (
                <span className="font-medium text-foreground">{item.label}</span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile page title */}
      <span className="md:hidden font-medium text-foreground">
        {items[items.length - 1]?.label}
      </span>
    </div>
  );
}

// Format path segment to readable label
function formatLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    hr: "HR",
    pto: "PTO",
    tv: "TV Display",
    "admin-hub": "Admin Hub",
    "susan-ai-admin": "Susan AI",
    "enterprise-analytics": "Enterprise Analytics",
    "team-dashboard": "Team Dashboard",
    "team-directory": "Team Directory",
    "org-chart": "Org Chart",
    "employee-assignments": "Assignments",
    "employee-portal": "Employee Portal",
    "qr-codes": "QR Codes",
    "scheduled-reports": "Scheduled Reports",
    "google-integration": "Google Integration",
    "recruiting-analytics": "Recruiting Analytics",
    "resume-uploader": "Resume Uploader",
    "ai-criteria": "AI Criteria",
    "onboarding-templates": "Onboarding Templates",
    "pto-policies": "PTO Policies",
    "meeting-rooms": "Meeting Rooms",
    "coi-documents": "COI Documents",
    "email-templates": "Email Templates",
  };

  if (specialCases[segment]) {
    return specialCases[segment];
  }

  // Handle IDs (numbers or UUIDs)
  if (/^\d+$/.test(segment) || /^[a-f0-9-]{36}$/i.test(segment)) {
    return `#${segment.slice(0, 8)}`;
  }

  // Convert kebab-case or snake_case to Title Case
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
