import { ListSkeleton } from '@/components/common/Skeletons';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { CalendarCheck, Inbox, X } from 'lucide-react';
import {
  useCancelBookingRequestMutation,
  useGetSentRequestsQuery,
} from '@/redux/slices/bookingsApiSlice';
import StatusBadge from '@/components/room/StatusBadge';
import PageHeader from '@/components/common/PageHeader';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/utils/formatDate';
import { formatINR } from '@/utils/format';

const MyRequests = () => {
  const { data, isLoading } = useGetSentRequestsQuery();
  const [cancelRequest, { isLoading: cancelling }] = useCancelBookingRequestMutation();
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const requests = data?.data ?? [];

  const handleCancel = async (request) => {
    if (!window.confirm('Cancel this booking request?')) return;
    setProcessingId(request._id);
    setActionError('');
    try {
      await cancelRequest({ id: request._id }).unwrap();
      toast.success('Request cancelled');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.data?.message || 'Could not cancel';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        kicker="Renter dashboard"
        title="My requests"
        subtitle="Track the status of every booking request you have sent"
      />

      {actionError && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No requests sent yet"
            description="Browse available rooms and send a booking request to get started."
          >
            <Link to="/rooms" className="text-sm font-medium text-primary hover:underline">
              Browse rooms
            </Link>
          </EmptyState>
        ) : (
          requests.map((request) => (
            <Card key={request._id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <Link to={`/rooms/${request.room?._id}`} className="shrink-0">
                  <div className="h-24 w-full overflow-hidden rounded-md border bg-muted sm:w-36">
                    {request.room?.images?.[0]?.url ? (
                      <img
                        src={request.room.images[0].url}
                        alt={request.room.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Removed
                      </div>
                    )}
                  </div>
                </Link>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} />
                    <span className="text-xs text-muted-foreground">
                      Sent {formatDateTime(request.createdAt)}
                    </span>
                  </div>
                  {request.room ? (
                    <>
                      <p className="truncate font-medium">
                        <Link to={`/rooms/${request.room._id}`} className="hover:text-primary">
                          {request.room.title}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.room.city} &middot; {formatINR(request.room.price)}/month
                      </p>
                    </>
                  ) : null}
                  {request.owner && (
                    <p className="text-xs text-muted-foreground">Owner: {request.owner.name}</p>
                  )}
                  {request.message && (
                    <blockquote className="rounded-md border-l-2 border-primary/50 bg-muted/50 px-3 py-1.5 text-sm italic text-muted-foreground">
                      &ldquo;{request.message}&rdquo;
                    </blockquote>
                  )}
                </div>

                {request.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancelling}
                    onClick={() => handleCancel(request)}
                  >
                    <X className="h-4 w-4" />
                    {processingId === request._id && cancelling ? 'Cancelling...' : 'Cancel'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MyRequests;
