import { RoomGridSkeleton } from '@/components/common/Skeletons';
import { Heart } from 'lucide-react';
import { useGetWishlistQuery } from '@/redux/slices/wishlistApiSlice';
import RoomCard from '@/components/room/RoomCard';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';

const Wishlist = () => {
  const { data, isLoading } = useGetWishlistQuery();
  const rooms = data?.data?.rooms ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        kicker="Saved for later"
        title="My wishlist"
        subtitle="Saved rooms for easy comparison"
      />

      <div className="mt-8">
        {isLoading ? (
          <RoomGridSkeleton count={6} />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any room to save it here for later."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map(
              (room) =>
                room && <RoomCard key={String(room._id ?? room)} room={room} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
