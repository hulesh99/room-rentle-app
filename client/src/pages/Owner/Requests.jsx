import { ListSkeleton } from '@/components/common/Skeletons';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Check, Inbox, X } from 'lucide-react';
import {
  useGetReceivedRequestsQuery,
  useUpdateRequestStatusMutation,
} from '@/redux/slices/bookingsApiSlice';
import StatusBadge from '@/components/room/StatusBadge';
import PageHeader from '@/components/common/PageHeader';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/utils/formatDate';
import { formatINR } from '@/utils/format';
import { getInitials } from '@/utils/helpers';

const Requests = () => {
  const { data, isLoading } = useGetReceivedRequestsQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateRequestStatusMutation();
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const requests = data?.data ?? [];

  const handleUpdate = async (request, status) => {
    setProcessingId(request._id);
    setActionError('');
    try {
      await updateStatus({ id: request._id, status, roomId: request.room?._id }).unwrap();
      toast.success(status === 'ACCEPTED' ? 'Request accepted' : 'Request rejected');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.data?.message || 'Action failed';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        kicker="Owner workspace"
        title="Booking requests"
        subtitle="Review requests from renters for your listings"
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
            icon={Inbox}
            title="No requests yet"
            description="When renters request your rooms, they will appear here for you to accept or reject."
          />
        ) : (
          requests.map((request) => (
            <Card key={request._id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row">
                <Link to={`/rooms/${request.room?._id}`} className="shrink-0">
                  <div className="h-28 w-full overflow-hidden rounded-md border bg-muted sm:w-40">
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

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} />
                    <span className="text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</span>
                  </div>

                  {request.renter ? (
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {getInitials(request.renter.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{request.renter.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{request.renter.email}</p>
                      </div>
                    </div>
                  ) : null}

                  {request.room ? (
                    <p className="truncate text-sm">
                      Requested:{' '}
                      <Link to={`/rooms/${request.room._id}`} className="font-medium text-primary hover:underline">
                        {request.room.title}
                      </Link>{' '}
                      <span className="text-muted-foreground">&middot; {formatINR(request.room.price)}/mo</span>
                    </p>
                  ) : null}

                  {request.message && (
                    <blockquote className="rounded-md border-l-2 border-primary/50 bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground">
                      &ldquo;{request.message}&rdquo;
                    </blockquote>
                  )}
                </div>

                <div className="flex shrink-0 flex-row items-end gap-2 sm:flex-col sm:justify-center">
                  {request.status === 'PENDING' ? (
                    <>
                      <Button
                        size="sm"
                        disabled={updating}
                        onClick={() => handleUpdate(request, 'ACCEPTED')}
                      >
                        <Check className="h-4 w-4" /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updating}
                        onClick={() => handleUpdate(request, 'REJECTED')}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                      {processingId === request._id && updating && <Badge variant="secondary">Saving...</Badge>}
                    </>
                  ) : (
                    <Badge variant="secondary" className="justify-self-start">Reviewed</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Requests;
