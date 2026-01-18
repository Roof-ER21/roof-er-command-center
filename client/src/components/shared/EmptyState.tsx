import { LucideIcon } from 'lucide-react';
import {
  Users,
  TrendingUp,
  BookOpen,
  MessageSquare,
  FileText,
  Calendar,
  Trophy,
  Inbox,
  Search,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 min-h-[400px]',
        className
      )}
    >
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button onClick={action.onClick} size="default">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Module-specific variants
export function NoEmployeesEmptyState({
  onAddEmployee,
}: {
  onAddEmployee: () => void;
}) {
  return (
    <EmptyState
      icon={Users}
      title="No employees yet"
      description="Get started by adding your first team member to the system."
      action={{
        label: 'Add Employee',
        onClick: onAddEmployee,
      }}
    />
  );
}

export function NoDataEmptyState() {
  return (
    <EmptyState
      icon={Database}
      title="No data available"
      description="There's no data to display at the moment. Check back later or try adjusting your filters."
    />
  );
}

export function NoSearchResultsEmptyState({
  onClearSearch,
}: {
  onClearSearch?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description="We couldn't find any matches for your search. Try adjusting your search terms."
      action={
        onClearSearch
          ? {
              label: 'Clear Search',
              onClick: onClearSearch,
            }
          : undefined
      }
    />
  );
}

export function NoLeaderboardDataEmptyState() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No leaderboard data"
      description="Sales data will appear here once team members start logging their performance."
    />
  );
}

export function NoContestsEmptyState({
  onCreateContest,
}: {
  onCreateContest?: () => void;
}) {
  return (
    <EmptyState
      icon={Trophy}
      title="No active contests"
      description="Create a contest to motivate your team and drive performance."
      action={
        onCreateContest
          ? {
              label: 'Create Contest',
              onClick: onCreateContest,
            }
          : undefined
      }
    />
  );
}

export function NoTrainingModulesEmptyState({
  onBrowseCurriculum,
}: {
  onBrowseCurriculum?: () => void;
}) {
  return (
    <EmptyState
      icon={BookOpen}
      title="No training modules assigned"
      description="Browse the curriculum to start your learning journey."
      action={
        onBrowseCurriculum
          ? {
              label: 'Browse Curriculum',
              onClick: onBrowseCurriculum,
            }
          : undefined
      }
    />
  );
}

export function NoChatHistoryEmptyState({
  onStartChat,
}: {
  onStartChat?: () => void;
}) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No chat history"
      description="Start a conversation with your AI assistant to get help with your work."
      action={
        onStartChat
          ? {
              label: 'Start New Chat',
              onClick: onStartChat,
            }
          : undefined
      }
    />
  );
}

export function NoDocumentsEmptyState({
  onUploadDocument,
}: {
  onUploadDocument?: () => void;
}) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents"
      description="Upload your first document to get started with document management."
      action={
        onUploadDocument
          ? {
              label: 'Upload Document',
              onClick: onUploadDocument,
            }
          : undefined
      }
    />
  );
}

export function NoPTORequestsEmptyState({
  onRequestPTO,
}: {
  onRequestPTO?: () => void;
}) {
  return (
    <EmptyState
      icon={Calendar}
      title="No PTO requests"
      description="You haven't made any time-off requests yet."
      action={
        onRequestPTO
          ? {
              label: 'Request Time Off',
              onClick: onRequestPTO,
            }
          : undefined
      }
    />
  );
}
