import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  Trash2,
  Trophy,
  Zap,
  TrendingUp,
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  CheckCheck,
  X,
  ClipboardList,
  CalendarCheck,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons = {
  achievement: Trophy,
  xp_gain: Zap,
  level_up: TrendingUp,
  contest_update: Trophy,
  pto_approved: Calendar,
  pto_denied: Calendar,
  new_lead: MapPin,
  streak_reminder: GraduationCap,
  training_complete: GraduationCap,
  team_update: Users,
  pto_request: ClipboardList,
  pto_reminder: CalendarCheck,
  task_overdue: AlertTriangle,
  onboarding_assigned: UserCheck,
};

const notificationColors = {
  achievement: 'text-amber-500',
  xp_gain: 'text-blue-500',
  level_up: 'text-purple-500',
  contest_update: 'text-green-500',
  pto_approved: 'text-green-500',
  pto_denied: 'text-red-500',
  new_lead: 'text-sky-500',
  streak_reminder: 'text-orange-500',
  training_complete: 'text-green-500',
  team_update: 'text-blue-500',
  pto_request: 'text-slate-500',
  pto_reminder: 'text-emerald-500',
  task_overdue: 'text-amber-600',
  onboarding_assigned: 'text-cyan-500',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, notificationId: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: number) => {
    e.preventDefault();
    e.stopPropagation();
    markAsRead(notificationId);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.some(n => n.isRead) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => clearRead()}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear read
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const iconColor = notificationColors[notification.type];

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'relative group',
                    !notification.isRead && 'bg-muted/50'
                  )}
                >
                  {notification.link ? (
                    <Link
                      to={notification.link}
                      onClick={() => handleNotificationClick(notification)}
                      className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <NotificationContent
                        notification={notification}
                        Icon={Icon}
                        iconColor={iconColor}
                      />
                    </Link>
                  ) : (
                    <div className="px-4 py-3">
                      <NotificationContent
                        notification={notification}
                        Icon={Icon}
                        iconColor={iconColor}
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkAsRead(e, notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Delete"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationContentProps {
  notification: Notification;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

function NotificationContent({ notification, Icon, iconColor }: NotificationContentProps) {
  return (
    <div className="flex gap-3">
      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-sm font-medium leading-tight">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
