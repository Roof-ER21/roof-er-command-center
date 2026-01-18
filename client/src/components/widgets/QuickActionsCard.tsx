import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  iconColor?: string;
  disabled?: boolean;
}

export interface QuickActionsCardProps {
  title?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActionsCard({
  title = "Quick Actions",
  actions,
  columns = 2,
  className,
}: QuickActionsCardProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("grid gap-3", gridCols[columns])}>
          {actions.map((action) => {
            const Icon = action.icon;
            const content = (
              <div className="flex flex-col items-center justify-center gap-2 p-4">
                <Icon
                  className={cn(
                    "h-6 w-6",
                    action.iconColor || "text-muted-foreground"
                  )}
                />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </div>
            );

            if (action.href) {
              return (
                <a
                  key={action.id}
                  href={action.href}
                  className={cn(
                    "rounded-lg border bg-card transition-colors hover:bg-accent hover:text-accent-foreground",
                    action.disabled && "pointer-events-none opacity-50"
                  )}
                >
                  {content}
                </a>
              );
            }

            return (
              <Button
                key={action.id}
                variant={action.variant || "outline"}
                onClick={action.onClick}
                disabled={action.disabled}
                className="h-auto flex-col py-4 px-2"
              >
                {content}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
