import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarCheck,
  IndianRupee,
  KeyRound,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGetRoomsQuery } from '@/redux/slices/roomsApiSlice';
import Seo from '@/components/common/Seo';
import CityAutocomplete from '@/components/common/CityAutocomplete';
import { buttonVariants } from '@/components/ui/button';
import { ROOM_TYPES } from '@/utils/constants';
import { POPULAR_CITIES } from '@/utils/cities';
import { formatINR } from '@/utils/format';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Search,
    kicker: 'Find faster',
    title: 'Search that thinks like a renter',
    description:
      'Filter by locality, budget, furnishing and amenities — see only rooms you would actually live in.',
  },
  {
    icon: MessageCircle,
    kicker: 'Talk directly',
    title: 'Chat & call the owner',
    description:
      'Real-time messaging and voice/video calls unlock the moment your booking request is accepted.',
  },
  {
    icon: ShieldCheck,
    kicker: 'Stay private',
    title: 'Zero spam, zero brokerage',
    description:
      'Phone numbers stay hidden until an owner accepts your request. No agents, no middlemen, no fees.',
  },
];

const STEPS = [
  {
    icon: Building2,
    step: '01',
    title: 'List or discover',
    description:
      'Owners post rooms with photos and rent. Renters browse real listings across their city.',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Send a request',
    description:
      'Found the right place? Send a booking request and get notified the moment it is reviewed.',
  },
  {
    icon: KeyRound,
    step: '03',
    title: 'Get the keys',
    description:
      'Once accepted, chat and call directly. Your next home is one conversation away.',
  },
];

const Kicker = ({ children }) => (
  <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
    <span className="h-px w-6 bg-primary/50" />
    {children}
    <span className="h-px w-6 bg-primary/50" />
  </p>
);

const Home = () => {
  usePageTitle('Find Rooms & List Your Property');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [roomType, setRoomType] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const { data: featuredData } = useGetRoomsQuery({ limit: 3, sort: 'newest' });
  const featuredRooms = featuredData?.data ?? [];

  const runSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (roomType) params.set('roomType', roomType);
    navigate(`/rooms${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div>
      <Seo
        description="Find rooms, PGs and flats, or list your property. Real-time chat, secure booking requests, zero brokerage."
      />

      <section className="relative overflow-hidden border-b">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-blueprint opacity-70 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]" />
          <div className="absolute -right-24 top-10 hidden h-[480px] w-[340px] rounded-t-full border border-primary/15 lg:block" />
          <div className="absolute -right-12 top-24 hidden h-[440px] w-[300px] rounded-t-full border border-primary/10 lg:block" />
          <div className="absolute -top-32 left-1/3 h-[380px] w-[560px] rounded-full bg-primary/8 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
              Zero brokerage &middot; Direct owner contact
            </span>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[1.08] tracking-tight animate-fade-in-up [animation-delay:80ms] sm:text-5xl lg:text-[3.4rem]">
              A room that feels like{' '}
              <em className="text-gradient font-bold italic">home</em>, found the
              honest way.
            </h1>
            <p
              className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground animate-fade-in-up [animation-delay:160ms]"
            >
              RoomRental connects owners and renters directly — list your spare room or book your
              next one with real photos, real people and zero agent cuts.
            </p>

            <form
              onSubmit={runSearch}
              className="mt-7 w-full max-w-lg animate-fade-in-up rounded-2xl border bg-card p-2 shadow-lift [animation-delay:240ms]"
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 items-center gap-2 rounded-xl bg-background px-3 py-2.5 ring-1 ring-border/70 transition-shadow focus-within:ring-2 focus-within:ring-ring/60">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <CityAutocomplete value={city} onChange={setCity} />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
                >
                  <Search className="h-4 w-4" /> Search rooms
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreFilters((s) => !s)}
                aria-expanded={showMoreFilters}
                className={cn(
                  'mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-colors sm:hidden',
                  showMoreFilters ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                {showMoreFilters ? 'Hide filters' : 'Budget & type filters'}
                {(maxPrice || roomType) && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                    {(maxPrice ? 1 : 0) + (roomType ? 1 : 0)}
                  </span>
                )}
              </button>

              <div className={cn('mt-2 gap-2 sm:grid', showMoreFilters ? 'grid' : 'hidden')}>
                <label className="mb-2 flex flex-col gap-0.5 rounded-xl bg-background px-3 py-2 ring-1 ring-border/70 sm:mb-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Budget /mo
                  </span>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    aria-label="Maximum budget"
                    className="min-h-[32px] cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium outline-none"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23716a5f' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right center',
                    }}
                  >
                    <option value="">Any</option>
                    <option value="5000">Under &#8377;5,000</option>
                    <option value="8000">Under &#8377;8,000</option>
                    <option value="12000">Under &#8377;12,000</option>
                    <option value="20000">Under &#8377;20,000</option>
                    <option value="35000">Under &#8377;35,000</option>
                  </select>
                </label>
                <div className="flex items-center gap-2 overflow-x-auto px-1 pb-1">
                  {ROOM_TYPES.slice(0, 4).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRoomType(roomType === value ? '' : value)}
                      aria-pressed={roomType === value}
                      className={cn(
                        'whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
                        roomType === value
                          ? 'border-primary bg-accent text-accent-foreground'
                          : 'border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground animate-fade-in [animation-delay:320ms]">
              {['Verified listings', 'In-app chat & calls', 'No hidden charges'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-fade-in-up [animation-delay:200ms]">
            {featuredRooms.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  {featuredRooms.slice(0, 3).map((room, index) => {
                    const cover = room.images?.[0]?.url;
                    return (
                      <Link
                        key={room._id}
                        to={`/rooms/${room._id}`}
                        className={cn(
                          'group relative block overflow-hidden arch-top bg-muted shadow-lift',
                          index === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'
                        )}
                      >
                        {cover && (
                          <img
                            src={cover}
                            alt={room.title}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            className="skeleton-shimmer relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-8">
                          <p className="truncate text-xs font-semibold text-white">{room.title}</p>
                          <p className="flex items-center justify-between text-[11px] text-white/80">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {room.city}
                            </span>
                            <span className="font-display text-sm font-bold text-white">
                              {formatINR(room.price)}
                              <span className="font-sans text-[9px]"> /mo</span>
                            </span>
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  to="/rooms"
                  className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  Browse all rooms
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              <div className="relative mx-auto hidden w-full max-w-sm overflow-hidden rounded-b-3xl border border-primary/20 bg-card p-8 pt-20 shadow-lift arch-top lg:block">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-blueprint opacity-60" />
                <div className="relative space-y-5">
                  <KeyRound className="h-9 w-9 text-primary" />
                  <p className="font-display text-2xl font-semibold leading-snug">
                    Own a spare room?
                    <br />
                    Turn it into income.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Post in under two minutes
                    </li>
                    <li className="flex items-start gap-2">
                      <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Approve requests on your terms
                    </li>
                    <li className="flex items-start gap-2">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Chat before anyone moves in
                    </li>
                  </ul>
                  <Link
                    to="/register"
                    className={cn(
                      buttonVariants(),
                      'w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-glow'
                    )}
                  >
                    List your room free <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {!user && (
        <section className="mx-auto max-w-7xl px-4 pb-4 pt-10 sm:px-6 lg:hidden">
          <div className="grid grid-cols-2 gap-3">
            <Link to="/rooms" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-full')}>
              Find a room
            </Link>
            <Link
              to="/register?role=OWNER"
              className={cn(buttonVariants({ size: 'lg' }), 'rounded-full bg-gradient-to-r from-primary to-emerald-600')}
            >
              List a room
            </Link>
          </div>
        </section>
      )}

      <section className="border-b bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
            Popular cities
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR_CITIES.map((name) => (
              <Link
                key={name}
                to={`/rooms?city=${encodeURIComponent(name)}`}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
              >
                <MapPin className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
                Rooms in {name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {user && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Link
            to="/rooms"
            className="group flex items-center justify-between rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
                <Search className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="font-display text-base font-semibold">Continue exploring</p>
                <p className="text-sm text-muted-foreground">
                  Fresh rooms are listed every day in your city.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
        <Kicker>Why RoomRental</Kicker>
        <h2 className="mx-auto max-w-xl text-center font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Built for how rooms are really rented
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, kicker, title, description }, i) => (
            <div
              key={title}
              style={{ animationDelay: `${i * 90}ms` }}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-lift animate-fade-in-up"
            >
              <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/60 blur-xl transition-opacity group-hover:opacity-100" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-accent text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                {kicker}
              </p>
              <h3 className="relative mt-1 font-display text-lg font-semibold">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative border-y bg-secondary/40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-noise opacity-[0.04]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <Kicker>How it works</Kicker>
          <h2 className="text-center font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Three steps to handed-over keys
          </h2>
          <div className="relative mt-12 grid gap-8 md:grid-cols-3">
            <div
              aria-hidden="true"
              className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-primary/25 md:block"
            />
            {STEPS.map(({ icon: Icon, step, title, description }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/25 bg-card shadow-soft">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="stamp absolute -right-3 -top-2 !rotate-[-8deg] border-primary bg-card text-primary">
                    {step}
                  </span>
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 p-8 text-center text-white shadow-lift sm:p-12">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 -top-40 h-80 w-[420px] -translate-x-1/2 rounded-t-full border border-white/15" />
              <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute inset-0 bg-noise opacity-[0.06]" />
            </div>
            <div className="relative">
              <h2 className="font-display text-2xl font-semibold md:text-3xl">
                Your next tenant or landlord is already here
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-emerald-100 md:text-base">
                Create your free account in under a minute — browse listings or post your room
                today.
              </p>
              <Link
                to="/register"
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'lg' }),
                  'mt-7 rounded-full bg-white font-semibold text-emerald-900 shadow-lift transition-transform hover:scale-[1.03]'
                )}
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
