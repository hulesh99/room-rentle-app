import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/redux/slices/authSlice';
import { selectTotalUnread } from '@/redux/slices/chatSlice';
import { getInitials } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/common/ThemeToggle';
import CommandPalette from '@/components/common/CommandPalette';
import NotificationBell from '@/components/notification/NotificationBell';

const Navbar = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const totalUnread = useSelector(selectTotalUnread);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const dashboardLink =
    user?.role === 'OWNER' ? '/owner/dashboard' : '/renter/dashboard';

  const links = [{ to: '/', label: 'Home' }, { to: '/rooms', label: 'Browse Rooms' }];
  if (user) links.push({ to: '/chat', label: 'Chats', badge: totalUnread });
  if (user?.role === 'OWNER') {
    links.push({ to: '/owner/dashboard', label: 'Dashboard' });
    links.push({ to: '/owner/requests', label: 'Requests' });
  }
  if (user?.role === 'RENTER') {
    links.push({ to: '/wishlist', label: 'Wishlist' });
    links.push({ to: '/renter/dashboard', label: 'Dashboard' });
    links.push({ to: '/renter/requests', label: 'My Requests' });
  }

  const handleLogout = () => {
    setOpen(false);
    dispatch(logoutUser());
    navigate('/', { replace: true });
  };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-emerald-600 to-teal-500 text-white shadow-glow transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            <Home className="h-[18px] w-[18px]" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Room<span className="italic text-primary">Rental</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <CommandPalette />
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`
              }
            >
              <span className="relative inline-flex items-center gap-1.5">
                {link.label}
                {link.badge > 0 && (
                  <span className="flex h-4 min-w-4 animate-fade-in items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-full border border-border/80 bg-background py-1 pl-1 pr-2.5 transition-all hover:border-primary/40 hover:shadow-soft"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-xs font-semibold text-white">
                    {getInitials(user.name)}
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-medium">{user.name}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border bg-popover p-1.5 shadow-lift animate-slide-down"
                  >
                    <div className="border-b px-3 py-2.5">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/60"
                    >
                      <UserRound className="h-4 w-4 text-muted-foreground" /> Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(dashboardLink);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent/60"
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')} className="rounded-full">
                Sign in
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="rounded-full bg-gradient-to-r from-primary to-emerald-600 shadow-glow transition-transform hover:scale-[1.03]"
              >
                Get started
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          {user && <NotificationBell />}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background text-foreground transition-colors active:bg-accent"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-black/25 backdrop-blur-sm animate-fade-in md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border/70 bg-background/95 pb-5 pt-3 shadow-lift backdrop-blur-xl animate-slide-down md:hidden">
            {user && (
              <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/50 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-sm font-semibold text-white">
                  {getInitials(user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
            <nav className="flex flex-col gap-0.5 px-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? 'bg-accent text-primary' : 'text-foreground active:bg-accent/60'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  {link.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
              {user && (
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `flex items-center rounded-xl px-4 py-3 text-sm font-medium ${
                      isActive ? 'bg-accent text-primary' : 'text-foreground'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  Profile
                </NavLink>
              )}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-border/60 px-4 pt-4">
              {user ? (
                <Button variant="outline" className="w-full rounded-xl" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Log out
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => { setOpen(false); navigate('/login'); }}>
                    <LogIn className="h-4 w-4" /> Sign in
                  </Button>
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600"
                    onClick={() => { setOpen(false); navigate('/register'); }}
                  >
                    <UserPlus className="h-4 w-4" /> Get started free
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
