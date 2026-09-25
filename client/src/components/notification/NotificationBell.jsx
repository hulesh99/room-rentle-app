import { Bell } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDrawer, selectUnreadCount } from '@/redux/slices/notifSlice';
import { useGetUnreadCountQuery } from '@/redux/slices/notificationsApiSlice';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const unreadCount = useSelector(selectUnreadCount);
  useGetUnreadCountQuery();

  return (
    <button
      type="button"
      className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      onClick={() => dispatch(toggleDrawer())}
      aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
