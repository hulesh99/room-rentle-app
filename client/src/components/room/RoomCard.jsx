import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Heart, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetWishlistQuery,
  useToggleWishlistRoomMutation,
} from '@/redux/slices/wishlistApiSlice';
import { formatINR, prettyLabel } from '@/utils/format';
import { timeAgo } from '@/utils/formatDate';
import { cn } from '@/lib/utils';

const RoomCard = ({ room, actions }) => {
  const { user, isRenter } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const skipWishlist = !user || !isRenter;
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: skipWishlist });
  const [toggleWishlist] = useToggleWishlistRoomMutation();
  const [localSaved, setLocalSaved] = useState(null);

  const savedInList =
    wishlistData?.data?.rooms?.some((r) => String(r._id ?? r) === String(room._id)) ?? false;
  const saved = localSaved ?? savedInList;

  const cover = room.images?.[0]?.url;

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setLocalSaved(!saved);
    try {
      await toggleWishlist(room._id).unwrap();
      toast.success(saved ? 'Removed from wishlist' : 'Saved to wishlist');
    } catch {
      setLocalSaved(saved);
      toast.error('Could not update wishlist');
    }
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-t-[10.5rem] rounded-b-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
      <Link to={`/rooms/${room._id}`} className="block">
        <div className="relative aspect-[4/3.4] w-full overflow-hidden bg-muted arch-top skeleton-shimmer">
          {cover ? (
            <img
              src={cover}
              alt={room.title}
              loading="lazy"
              className="relative h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-blueprint">
              <HomeIcon className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <span
            className={cn(
              'stamp absolute left-1/2 top-5 -translate-x-1/2 bg-card/90 drop-shadow-sm backdrop-blur-sm',
              room.isAvailable
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-red-700 dark:text-red-400'
            )}
          >
            {room.isAvailable ? 'To Let' : 'Rented'}
          </span>
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={saved}
            className={cn(
              'absolute right-3 top-8 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-md backdrop-blur transition-all hover:scale-110',
              saved ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
            )}
          >
            <Heart className={cn('h-4 w-4', saved && 'fill-current')} />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-5 pb-4 pt-3">
        <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span>{prettyLabel(room.roomType)}</span>
          <span className="font-sans normal-case tracking-normal">{prettyLabel(room.furnishing)}</span>
        </p>
        <Link to={`/rooms/${room._id}`}>
          <h3 className="line-clamp-1 font-display text-lg font-semibold leading-snug text-foreground transition-colors hover:text-primary">
            {room.title}
          </h3>
        </Link>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span className="truncate">
            {room.address?.split(',')[0] ? `${room.address.split(',')[0]}, ` : ''}
            {room.city}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {room.preferredTenant && room.preferredTenant !== 'ANY' && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
              {prettyLabel(room.preferredTenant)} only
            </span>
          )}
          {(room.amenities || []).slice(0, 2).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {prettyLabel(amenity)}
            </span>
          ))}
          {(room.amenities?.length || 0) > 2 && (
            <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +{room.amenities.length - 2}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-dashed border-border pt-3">
          <div>
            <p className="font-display text-2xl font-bold leading-none text-primary">
              {formatINR(room.price)}
              <span className="ml-1 align-middle font-sans text-[11px] font-normal uppercase tracking-wide text-muted-foreground">
                /mo
              </span>
            </p>
            {room.createdAt && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Posted {timeAgo(room.createdAt)}
              </p>
            )}
          </div>
          <Link
            to={`/rooms/${room._id}`}
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-all group-hover:bg-primary group-hover:text-white"
          >
            View
          </Link>
        </div>
      </div>

      {actions ? <div className="flex flex-wrap gap-2 border-t p-3">{actions}</div> : null}
    </div>
  );
};

export default RoomCard;
