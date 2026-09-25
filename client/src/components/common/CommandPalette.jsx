import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CornerDownLeft, Heart, Home, MessageCircle, Plus, Search, UserRound } from 'lucide-react';
import { useGetRoomsQuery } from '@/redux/slices/roomsApiSlice';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const CommandPalette = () => {
  const navigate = useNavigate();
  const { user, isRenter, isOwner } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: roomsData } = useGetRoomsQuery(
    { q: debouncedQuery, limit: 6 },
    { skip: !open || debouncedQuery.trim().length < 2 }
  );
  const roomResults = roomsData?.data ?? [];

  const actions = useMemo(() => {
    const base = [
      { id: 'home', label: 'Go to Home', icon: Home, run: () => navigate('/') },
      { id: 'browse', label: 'Browse Rooms', icon: Search, run: () => navigate('/rooms') },
    ];
    if (user) {
      base.push({ id: 'chat', label: 'Open Chats', icon: MessageCircle, run: () => navigate('/chat') });
      base.push({ id: 'profile', label: 'My Profile', icon: UserRound, run: () => navigate('/profile') });
    }
    if (isRenter) {
      base.push({ id: 'wishlist', label: 'My Wishlist', icon: Heart, run: () => navigate('/wishlist') });
      base.push({ id: 'myreq', label: 'My Booking Requests', icon: CalendarCheck, run: () => navigate('/renter/requests') });
    }
    if (isOwner) {
      base.push({ id: 'post', label: 'Post a New Room', icon: Plus, run: () => navigate('/owner/post-room') });
      base.push({ id: 'oreq', label: 'Incoming Requests', icon: CalendarCheck, run: () => navigate('/owner/requests') });
    }
    return base;
  }, [navigate, user, isRenter, isOwner]);

  const filteredActions = useMemo(
    () =>
      query.trim()
        ? actions.filter((a) => a.label.toLowerCase().includes(query.trim().toLowerCase()))
        : actions,
    [actions, query]
  );

  const items = useMemo(() => {
    const roomItems = roomResults.map((room) => ({
      id: `room-${room._id}`,
      label: room.title,
      sublabel: `${room.city} \u00B7 ${room.state}`,
      run: () => navigate(`/rooms/${room._id}`),
    }));
    return [...filteredActions, ...roomItems];
  }, [filteredActions, roomResults, navigate]);

  useEffect(() => setActiveIndex(0), [items.length, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && items[activeIndex]) {
        e.preventDefault();
        close();
        items[activeIndex].run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, activeIndex, close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-border/70 bg-background px-3.5 py-2 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground lg:flex"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" />
        Quick search...
        <kbd className="ml-4 rounded-md border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold">Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm animate-fade-in"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-xl overflow-hidden rounded-2xl border bg-popover shadow-lift animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages and rooms..."
                className="h-12 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search"
              />
              <kbd className="rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">ESC</kbd>
            </div>

            <ul ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
              {items.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </li>
              )}
              {items.map((item, index) => {
                const Icon =
                  item.icon ||
                  (filteredActions.find((a) => a.id === item.id)?.icon ?? Search);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-active={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        close();
                        item.run();
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                        index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.sublabel && (
                        <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                          {item.sublabel}
                        </span>
                      )}
                      {index === activeIndex && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default CommandPalette;
