import { ListSkeleton } from '@/components/common/Skeletons';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Heart,
  Search,
  Send,
} from 'lucide-react';
import { useGetSentRequestsQuery } from '@/redux/slices/bookingsApiSlice';
import { useGetWishlistQuery } from '@/redux/slices/wishlistApiSlice';
import { useAuth } from '@/hooks/useAuth';
import StatusBadge from '@/components/room/StatusBadge';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Sparkline, { buildDailySeries } from '@/components/common/Sparkline';
import PageHeader from '@/components/common/PageHeader';
import { formatDateTime } from '@/utils/formatDate';
import { getFirstName } from '@/utils/helpers';

const StatCard = ({ label, value, icon: Icon, to, series }) => (
  <Link
    to={to}
    className="rounded-lg border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
        <Icon className="h-5 w-5 text-primary" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
    {series && <Sparkline data={series} className="-mx-5 -mb-4 mt-2 opacity-80" />}
  </Link>
);

const QUICK_LINKS = [
  {
    icon: Search,
    title: 'Browse rooms',
    description: 'Filter by city, budget, type and amenities to find your match.',
    to: '/rooms',
  },
  {
    icon: Heart,
    title: 'My wishlist',
    description: 'Revisit saved rooms and compare them side by side.',
    to: '/wishlist',
  },
  {
    icon: CalendarCheck,
    title: 'My requests',
    description: 'Track pending, accepted and rejected booking requests.',
    to: '/renter/requests',
  },
];

const RenterDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading } = useGetSentRequestsQuery();
  const { data: wishlistData } = useGetWishlistQuery();

  const requests = data?.data ?? [];
  const wishlistCount = wishlistData?.data?.rooms?.length ?? 0;
  const pending = requests.filter((request) => request.status === 'PENDING');
  const accepted = requests.filter((request) => request.status === 'ACCEPTED');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        kicker="Renter dashboard"
        title={`Welcome back, ${getFirstName(user?.name)}`}
        subtitle="Your room search at a glance"
      />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Requests sent"
          value={requests.length}
          icon={Send}
          to="/renter/requests"
          series={buildDailySeries(requests)}
        />
        <StatCard label="Pending" value={pending.length} icon={Clock3} to="/renter/requests" />
        <StatCard
          label="Accepted"
          value={accepted.length}
          icon={CheckCircle2}
          to="/renter/requests"
          series={buildDailySeries(accepted)}
        />
        <StatCard label="Wishlisted" value={wishlistCount} icon={Heart} to="/wishlist" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-start gap-3 p-7">
            <Search className="h-6 w-6" />
            <h2 className="text-xl font-bold">Find your next room</h2>
            <p className="text-sm text-primary-foreground/85">
              Browse verified listings filtered by city, budget and amenities.
            </p>
            <Link
              to="/rooms"
              className={`${buttonVariants({ variant: 'secondary' })} mt-1 font-semibold`}
            >
              <BedDouble className="h-4 w-4" /> Browse rooms
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-semibold">Recent requests</h2>
              <Link to="/renter/requests" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="p-5 pt-4">
              {isLoading ? (
                <ListSkeleton rows={3} />
              ) : requests.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No requests yet"
                  description="Your booking requests will show up here."
                />
              ) : (
                <ul className="space-y-3">
                  {requests.slice(0, 3).map((request) => (
                    <li key={request._id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        {request.room?.title || 'Removed listing'}
                        <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                          {formatDateTime(request.createdAt)}
                        </span>
                      </span>
                      <StatusBadge status={request.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
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
    </div>
  );
};

export default RenterDashboard;
