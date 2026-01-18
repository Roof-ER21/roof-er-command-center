import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Generate breadcrumb items from pathname
  const breadcrumbItems: BreadcrumbItem[] = pathnames.map((segment, index) => {
    const href = `/${pathnames.slice(0, index + 1).join('/')}`;
    const label = formatLabel(segment);
    return { label, href };
  });

  // Add home
  const items: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    ...breadcrumbItems
  ];

  // Don't show breadcrumb on dashboard page
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.href || index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                to={item.href || '#'}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Format path segment to readable label
function formatLabel(segment: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'hr': 'HR',
    'pto': 'PTO',
    'tv': 'TV Display',
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
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
