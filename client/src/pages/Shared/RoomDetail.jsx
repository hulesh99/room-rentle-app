import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Heart,
  Loader2,
  MapPin,
  PhoneCall,
  Share2,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useGetRoomByIdQuery, useGetRoomsQuery } from '@/redux/slices/roomsApiSlice';
import { useSendBookingRequestMutation } from '@/redux/slices/bookingsApiSlice';
import {
  useGetWishlistQuery,
  useToggleWishlistRoomMutation,
} from '@/redux/slices/wishlistApiSlice';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import Seo from '@/components/common/Seo';
import RoomGallery from '@/components/room/RoomGallery';
import RoomCard from '@/components/room/RoomCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/utils/formatDate';
import { formatINR, prettyLabel } from '@/utils/format';
import { getInitials } from '@/utils/helpers';
import { getAmenityIcon } from '@/utils/amenityIcons';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);

  const { data, isLoading, isError, error } = useGetRoomByIdQuery(id);
  const [sendBooking, { isLoading: sending, error: sendError }] = useSendBookingRequestMutation();
  const skipWishlist = !user || user.role !== 'RENTER';
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: skipWishlist });
  const [toggleWishlist] = useToggleWishlistRoomMutation();
  const [localSaved, setLocalSaved] = useState(null);
  const [requestPanelOpen, setRequestPanelOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const room = data?.data?.room;
  const isOwner = data?.data?.isOwner;
  const myRequestStatus = data?.data?.myRequestStatus;
  const contactRevealed = data?.data?.contactRevealed;

  const savedInList =
    wishlistData?.data?.rooms?.some((r) => String(r._id ?? r) === String(room?._id)) ?? false;
  const saved = room ? (localSaved ?? savedInList) : false;

  const { data: simData } = useGetRoomsQuery(
    { city: room?.city || '', limit: 6 },
    { skip: !room }
  );
  const similarRooms = (simData?.data ?? []).filter((r) => r._id !== room?._id).slice(0, 4);

  const bookingRef = useRef(null);
  const bottomBarRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const seoDescription = room
    ? `${room.description?.slice(0, 150) || room.title} - ${formatINR(room.price)}/month in ${room.city}, ${room.state}. Book now on RoomRental.`
    : undefined;

  if (isLoading) return <Loader className="min-h-[60vh]" label="Loading room..." />;

  if (isError || !room) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={AlertCircle}
          title="Room not found"
          description={error?.data?.message || 'This listing may have been removed.'}
        >
          <Button variant="outline" onClick={() => navigate('/rooms')}>Back to browse</Button>
        </EmptyState>
      </div>
    );
  }

  const canRequest =
    user && !isOwner && user.role === 'RENTER' && (!myRequestStatus || myRequestStatus === 'REJECTED');

  const handleSendRequest = async () => {
    setLocalError('');
    try {
      await sendBooking({ roomId: room._id, message }).unwrap();
      setRequestPanelOpen(false);
      setMessage('');
      toast.success('Booking request sent!');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.data?.message || 'Could not send request';
      setLocalError(msg);
      toast.error(msg);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: room.title, text: `${room.title} - ${formatINR(room.price)}/month`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not share this listing');
    }
  };

  const openRequestPanel = () => {
    setRequestPanelOpen(true);
    setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  let mobileCta = { label: 'Sign in to book', run: () => navigate('/login', { state: { from: location.pathname } }) };
  if (isOwner) {
    mobileCta = { label: 'Edit listing', to: `/owner/rooms/${room._id}/edit` };
  } else if (user && user.role === 'OWNER') {
    mobileCta = null;
  } else if (user && user.role === 'RENTER' && myRequestStatus === 'PENDING') {
    mobileCta = { label: 'Pending review', disabled: true };
  } else if (user && user.role === 'RENTER' && myRequestStatus === 'ACCEPTED') {
    mobileCta =
      contactRevealed && room.contactNumber
        ? { label: `Call ${room.contactNumber}`, href: `tel:${room.contactNumber}` }
        : { label: 'Message owner', to: '/chat' };
  } else if (canRequest) {
    mobileCta = { label: 'Send booking request', run: openRequestPanel };
  }

  return (
    <>
      <Seo
        title={room.title}
        description={seoDescription}
        image={room.images?.[0]?.url}
        type="article"
        path={`/rooms/${room._id}`}
      />

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:pb-10">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to rooms
          </Link>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share this listing"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'stamp',
                room.isAvailable ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'
              )}
            >
              {room.isAvailable ? 'To Let' : 'Rented'}
            </span>
            {[prettyLabel(room.roomType), prettyLabel(room.furnishing)].map((label) => (
              <span key={label} className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
          <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {room.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 font-display text-sm italic text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {room.city}, {room.state} &middot; {room.pincode}
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <RoomGallery images={room.images} title={room.title} />

            <section>
              <h2 className="font-display text-xl font-semibold">About this space</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                {room.description}
              </p>
            </section>

            {room.amenities?.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold">What this place offers</h2>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {room.amenities.map((amenity) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <span
                        key={amenity}
                        className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm"
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0 text-primary" />
                        {prettyLabel(amenity)}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-display text-xl font-semibold">Property details</h2>
              <dl className="mt-4 overflow-hidden rounded-2xl border bg-card">
                {[
                  ['Room type', prettyLabel(room.roomType)],
                  ['Furnishing', prettyLabel(room.furnishing)],
                  ['Preferred tenant', prettyLabel(room.preferredTenant)],
                  [
                    'Floor',
                    `${Number(room.floorNo) === 0 ? 'Ground' : prettyLabel(String(room.floorNo))} of ${room.totalFloors}`,
                  ],
                  ['Listed on', formatDate(room.createdAt)],
                ].map(([label, value], i) => (
                  <div
                    key={label}
                    className={cn(
                      'flex items-center justify-between gap-4 px-5 py-3.5 text-sm',
                      i % 2 === 1 && 'bg-secondary/40'
                    )}
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold">Where you will stay</h2>
              <div className="mt-4 flex items-start gap-4 rounded-2xl border border-dashed bg-secondary/30 p-5">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{room.city}, {room.state} &ndash; {room.pincode}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                    Exact address is shared once your request is accepted.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside ref={bookingRef} className="lg:sticky lg:top-20 lg:self-start">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-lift">
              <div className="border-b border-dashed p-6">
                <p className="font-display text-3xl font-bold text-primary">
                  {formatINR(room.price)}
                  <span className="ml-1 align-middle font-sans text-xs font-normal uppercase tracking-wide text-muted-foreground">
                    /month
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No brokerage &middot; Pay rent directly to the owner
                </p>
              </div>

              <div className="space-y-3 p-6">
                {!user && (
                  <>
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-glow"
                      size="lg"
                      onClick={() => navigate('/login', { state: { from: location.pathname } })}
                    >
                      Sign in to request this room
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      New here?{' '}
                      <Link to="/register" className="font-medium text-primary hover:underline">
                        Create a free account
                      </Link>
                    </p>
                  </>
                )}

                {isOwner && (
                  <>
                    <Link
                      to={`/owner/rooms/${room._id}/edit`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full rounded-xl')}
                    >
                      Edit this listing
                    </Link>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" /> This is your own listing
                    </p>
                  </>
                )}

                {user && !isOwner && user.role === 'OWNER' && (
                  <p className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
                    Switch to a renter account to book rooms.
                  </p>
                )}

                {user && user.role === 'RENTER' && myRequestStatus === 'PENDING' && (
                  <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                    <p className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
                      <Clock3 className="h-4 w-4" /> Request pending review
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      The owner has been notified and will respond shortly.
                    </p>
                    <Link to="/renter/requests" className="inline-block text-xs font-medium underline underline-offset-2">
                      View all my requests
                    </Link>
                  </div>
                )}

                {user && user.role === 'RENTER' && myRequestStatus === 'ACCEPTED' && (
                  <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-800 dark:bg-emerald-950">
                    <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" /> Your request was accepted!
                    </p>
                    {contactRevealed && room.contactNumber ? (
                      <a href={`tel:${room.contactNumber}`} className={cn(buttonVariants(), 'w-full rounded-xl')}>
                        <PhoneCall className="h-4 w-4" /> Call now: {room.contactNumber}
                      </a>
                    ) : null}
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Chat is unlocked —{' '}
                      <Link to="/chat" className="font-semibold underline underline-offset-2">
                        message the owner
                      </Link>
                    </p>
                  </div>
                )}

                {user && user.role === 'RENTER' && myRequestStatus === 'REJECTED' && (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    Your previous request was rejected. You can send a new one.
                  </p>
                )}

                {canRequest && !requestPanelOpen && (
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-glow"
                    size="lg"
                    onClick={() => setRequestPanelOpen(true)}
                  >
                    <CalendarCheck className="h-4 w-4" /> Send booking request
                  </Button>
                )}

                {canRequest && requestPanelOpen && (
                  <div className="space-y-3 rounded-xl border p-4">
                    <label htmlFor="booking-message" className="text-sm font-medium">
                      Message to owner (optional)
                    </label>
                    <Textarea
                      id="booking-message"
                      rows={3}
                      maxLength={500}
                      placeholder="Hi! I'm interested in this room. I'd like to visit this weekend..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    {(localError || sendError) && (
                      <p className="text-xs text-destructive">
                        {localError || sendError?.data?.message || 'Something went wrong'}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 rounded-lg bg-gradient-to-r from-primary to-emerald-600"
                        disabled={sending}
                        onClick={handleSendRequest}
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                        Send request
                      </Button>
                      <Button variant="outline" className="rounded-lg" onClick={() => setRequestPanelOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Contact number stays private until the owner accepts.
                    </p>
                  </div>
                )}

                {user && user.role === 'RENTER' && !isOwner && (
                  <Button
                    variant="outline"
                    className={cn('w-full rounded-xl', saved && 'border-destructive text-destructive hover:bg-destructive hover:text-white')}
                    onClick={async () => {
                      setLocalSaved(!saved);
                      try {
                        await toggleWishlist(room._id).unwrap();
                        toast.success(saved ? 'Removed from wishlist' : 'Saved to wishlist');
                      } catch {
                        setLocalSaved(saved);
                        toast.error('Could not update wishlist');
                      }
                    }}
                  >
                    <Heart className={cn('h-4 w-4', saved && 'fill-current')} />
                    {saved ? 'Saved to wishlist' : 'Add to wishlist'}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3 border-t border-dashed bg-secondary/40 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-emerald-600 text-sm font-semibold text-white">
                  {room.owner?.avatar?.url ? (
                    <img src={room.owner.avatar.url} alt={room.owner.name} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(room.owner?.name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{room.owner?.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UserRound className="h-3 w-3" /> Owner since {formatDate(room.owner?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {similarRooms.length > 0 && (
          <section className="mt-16">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
              <span className="h-px w-6 bg-primary/50" /> Keep looking
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              More rooms in {room.city}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {similarRooms.map((similar) => (
                <RoomCard key={similar._id} room={similar} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div
        ref={bottomBarRef}
        className="fixed inset-x-0 bottom-[68px] z-30 border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <p className="font-display text-xl font-bold leading-none text-primary">
            {formatINR(room.price)}
            <span className="ml-1 align-middle font-sans text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
              /mo
            </span>
          </p>
          {mobileCta &&
            (mobileCta.href ? (
              <a
                href={mobileCta.href}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
              >
                <PhoneCall className="mr-1.5 h-4 w-4" /> Call owner
              </a>
            ) : mobileCta.to ? (
              <Link
                to={mobileCta.to}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
              >
                {mobileCta.label}
              </Link>
            ) : (
              <button
                type="button"
                disabled={mobileCta.disabled}
                onClick={mobileCta.run}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
              >
                {mobileCta.label}
              </button>
            ))}
        </div>
      </div>
    </>
  );
};

export default RoomDetail;
