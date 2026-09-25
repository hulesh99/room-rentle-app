import { ListSkeleton } from '@/components/common/Skeletons';
import PageHeader from '@/components/common/PageHeader';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Inbox,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  useDeleteRoomMutation,
  useGetMyRoomsQuery,
  useToggleAvailabilityMutation,
} from '@/redux/slices/roomsApiSlice';
import { useGetReceivedRequestsQuery } from '@/redux/slices/bookingsApiSlice';
import { useAuth } from '@/hooks/useAuth';
import RoomCard from '@/components/room/RoomCard';
import StatusBadge from '@/components/room/StatusBadge';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Sparkline, { buildDailySeries } from '@/components/common/Sparkline';
import { getFirstName } from '@/utils/helpers';

const StatCard = ({ label, value, series }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-5 pb-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </CardContent>
    {series && <Sparkline data={series} className="-mt-1 opacity-80" />}
  </Card>
);

const QUICK_LINKS = [
  {
    icon: Plus,
    title: 'Post a new room',
    description: 'Create a listing with photos, amenities and pricing',
    to: '/owner/post-room',
  },
  {
    icon: Inbox,
    title: 'Booking requests',
    description: 'Review and respond to renter requests',
    to: '/owner/requests',
  },
  {
    icon: MessageCircle,
    title: 'Chats & calls',
    description: 'Message accepted renters in real time',
    to: '/chat',
  },
];

const OwnerDashboard = () => {
  const { user } = useAuth();
  const { data: roomsData, isLoading } = useGetMyRoomsQuery();
  const { data: receivedData } = useGetReceivedRequestsQuery();
  const [toggleAvailability] = useToggleAvailabilityMutation();
  const [deleteRoom, { isLoading: deleting }] = useDeleteRoomMutation();
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const rooms = roomsData?.data ?? [];
  const requests = receivedData?.data ?? [];
  const availableCount = rooms.filter((room) => room.isAvailable).length;
  const pendingCount = requests.filter((request) => request.status === 'PENDING').length;

  const handleDelete = async (room) => {
    if (!window.confirm(`Delete "${room.title}"? This cannot be undone.`)) return;
    setDeletingId(room._id);
    setActionError('');
    try {
      await deleteRoom(room._id).unwrap();
    } catch (err) {
      setActionError(typeof err === 'string' ? err : err?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        kicker="Owner workspace"
        title={`Welcome back, ${getFirstName(user?.name)}`}
        subtitle="Manage your listings and renter requests"
        actions={
          <>
            <Link to="/owner/requests" className={buttonVariants({ variant: 'outline' })}>
              <Inbox className="h-4 w-4" /> Requests
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
              )}
            </Link>
            <Link to="/owner/post-room" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Post new room
            </Link>
          </>
        }
      />

      {actionError && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total listings" value={rooms.length} />
        <StatCard label="Available" value={availableCount} />
        <StatCard
          label="Pending requests"
          value={pendingCount}
          series={buildDailySeries(requests)}
        />
        <StatCard
          label="Accepted"
          value={requests.filter((request) => request.status === 'ACCEPTED').length}
          series={buildDailySeries(
            requests.filter((request) => request.status === 'ACCEPTED')
          )}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {QUICK_LINKS.map(({ icon: Icon, title, description, to }) => (
          <Link
            key={title}
            to={to}
            className="rounded-lg border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
              <Icon className="h-5 w-5 text-primary" />
            </span>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">My listings</h2>
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : rooms.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No listings yet"
            description="Post your first room with photos and amenities. It takes less than two minutes."
          >
            <Link to="/owner/post-room" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> Post your first room
            </Link>
          </EmptyState>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => {
              const pendingForRoom = room.pendingRequests || 0;
              return (
                <RoomCard
                  key={room._id}
                  room={room}
                  actions={
                    <>
                      <StatusBadge status={room.isAvailable ? 'AVAILABLE' : 'BOOKED'} />
                      {pendingForRoom > 0 && (
                        <Badge variant="warning">{pendingForRoom} pending</Badge>
                      )}
                      <span className="flex-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAvailability(room._id)}
                        title={room.isAvailable ? 'Mark as booked' : 'Mark as available'}
                      >
                        {room.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Link
                        to={`/owner/rooms/${room._id}/edit`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        disabled={deleting && deletingId === room._id}
                        onClick={() => handleDelete(room)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {requests.some((request) => request.status === 'ACCEPTED') && (
        <Card className="mt-8 border-primary/30 bg-accent/40">
          <CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            You have accepted requests.
            <Link to="/chat" className="font-semibold text-primary hover:underline">
              Open your chats
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OwnerDashboard;
