import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CalendarCheck, Heart, Home, MessageCircle, Search, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { selectTotalUnread } from '@/redux/slices/chatSlice';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const { user, isRenter } = useAuth();
  const totalUnread = useSelector(selectTotalUnread);

  const tabs = [{ to: '/', label: 'Home', icon: Home }, { to: '/rooms', label: 'Browse', icon: Search }];

  if (user) {
    tabs.push({ to: '/chat', label: 'Chats', icon: MessageCircle, badge: totalUnread });
    if (isRenter) {
      tabs.push({ to: '/wishlist', label: 'Saved', icon: Heart });
    } else {
      tabs.push({ to: '/owner/requests', label: 'Requests', icon: CalendarCheck });
    }
    tabs.push({ to: '/profile', label: 'Profile', icon: UserRound });
  } else {
    tabs.push({ to: '/login', label: 'Sign in', icon: UserRound });
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-xl md:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                    isActive ? 'bg-accent' : ''
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {label}
                {badge > 0 && (
                  <span className="absolute right-1/4 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
