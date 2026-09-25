import { Card, CardContent } from '@/components/ui/card';

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-md ${className}`} />
);

export const RoomGridSkeleton = ({ count = 6 }) => (
  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="skeleton-shimmer aspect-[4/3]" />
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-1/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ListSkeleton = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <Card key={i}>
        <CardContent className="flex items-center gap-4 py-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const StatCardsSkeleton = ({ count = 3 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardContent className="space-y-3 py-5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="mx-auto max-w-3xl space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-1/2" />
      </CardContent>
    </Card>
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Skeleton className="aspect-[16/10] w-full rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-24 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);
