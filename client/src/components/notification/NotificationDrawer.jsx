import EnablePush from './EnablePush';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BellRing,
  CalendarCheck,
  CheckCheck,
  CheckCircle2,
  Home as HomeIcon,
  MessageCircle,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from '@/redux/slices/notificationsApiSlice';
import { toggleDrawer } from '@/redux/slices/notifSlice';
import EmptyState from '@/components/common/EmptyState';
import Loader from '@/components/common/Loader';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/utils/formatDate';

const TYPE_META = {
  BOOKING_REQUEST: { icon: CalendarCheck, classes: 'bg-amber-100 text-amber-700' },
  BOOKING_ACCEPTED: { icon: CheckCircle2, classes: 'bg-emerald-100 text-emerald-700' },
  BOOKING_REJECTED: { icon: XCircle, classes: 'bg-red-100 text-red-600' },
  NEW_MESSAGE: { icon: MessageCircle, classes: 'bg-sky-100 text-sky-600' },
  NEW_ROOM_IN_CITY: { icon: HomeIcon, classes: 'bg-violet-100 text-violet-600' },
};

const NotificationDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const drawerOpen = useSelector((state) => state.notif.drawerOpen);
  const { data, isLoading } = useGetNotificationsQuery({}, { skip: !drawerOpen });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.data ?? [];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') dispatch(toggleDrawer(false));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  if (!drawerOpen) return null;

  const close = () => dispatch(toggleDrawer(false));

  const handleClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    close();
    if (notification.meta?.link) navigate(notification.meta.link);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <BellRing className="h-5 w-5 text-primary" /> Notifications
          </h2>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1.5 hover:bg-accent"
            aria-label="Close notifications"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <EnablePush />

        {notifications.length > 0 && (
          <div className="border-b px-5 py-2.5">
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <Loader className="min-h-[200px]" />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="No notifications yet"
              description="Booking requests, messages and new rooms in your city will show up here."
            />
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => {
                const meta = TYPE_META[notification.type] || TYPE_META.BOOKING_REQUEST;
                const Icon = meta.icon;
                return (
                  <li key={notification._id} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleClick(notification)}
                      className={cn(
                        'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-accent/60',
                        !notification.isRead && 'bg-accent/30'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          meta.classes
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{notification.title}</span>
                          {!notification.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                          {notification.body}
                        </span>
                        <span className="mt-1 block text-[10px] text-muted-foreground/70">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification._id)}
                      className="absolute right-3 top-3 hidden rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:block"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default NotificationDrawer;
