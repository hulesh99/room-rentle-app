import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  BellRing,
  BookmarkPlus,
  Building2,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useGetRoomsQuery } from '@/redux/slices/roomsApiSlice';
import {
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
  useGetSavedSearchesQuery,
} from '@/redux/slices/savedSearchApiSlice';
import { AMENITIES, FURNISHINGS, ROOM_TYPES, SORT_OPTIONS, TENANT_PREFS } from '@/utils/constants';
import { POPULAR_CITIES } from '@/utils/cities';
import CityAutocomplete from '@/components/common/CityAutocomplete';
import { cn } from '@/lib/utils';
import { prettyLabel } from '@/utils/format';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import Pagination from '@/components/common/Pagination';
import EmptyState from '@/components/common/EmptyState';
import { RoomGridSkeleton } from '@/components/common/Skeletons';
import RoomCard from '@/components/room/RoomCard';
import RoomMapPanel from '@/components/room/RoomMapPanel';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';
import Seo from '@/components/common/Seo';

const FILTER_KEYS = ['city', 'minPrice', 'maxPrice', 'roomType', 'furnishing', 'preferredTenant', 'amenities'];

const BrowseRooms = () => {
  usePageTitle('Browse Rooms');
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [savedSearchError, setSavedSearchError] = useState('');

  const skipSaved = !user;
  const { data: savedData } = useGetSavedSearchesQuery(undefined, { skip: skipSaved });
  const [createSavedSearch, { isLoading: savingSearch }] = useCreateSavedSearchMutation();
  const [deleteSavedSearch] = useDeleteSavedSearchMutation();
  const savedSearches = savedData?.data ?? [];

  const params = useMemo(() => {
    const result = {};
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) result[key] = value;
    });
    if (searchParams.get('q')) result.q = searchParams.get('q');
    if (searchParams.get('sort')) result.sort = searchParams.get('sort');
    result.page = searchParams.get('page') || '1';
    return result;
  }, [searchParams]);

  const { data, isLoading, isFetching, isError, error } = useGetRoomsQuery(params);
  const rooms = data?.data ?? [];
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const updateParams = (updates) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') next.delete(key);
          else next.set(key, value);
        });
        if (!('page' in updates)) next.delete('page');
        return next;
      },
      { replace: false }
    );
  };

  const draft = useMemo(() => {
    const result = {};
    FILTER_KEYS.forEach((key) => {
      result[key] = searchParams.get(key) || '';
    });
    return result;
  }, [searchParams]);

  const [localDraft, setLocalDraft] = useState(draft);
  const [appliedKey, setAppliedKey] = useState('');

  const applyDraft = () => {
    setAppliedKey(Date.now().toString());
    updateParams(localDraft);
  };

  const clearFilters = () => {
    setLocalDraft({
      city: '',
      minPrice: '',
      maxPrice: '',
      roomType: '',
      furnishing: '',
      preferredTenant: '',
      amenities: '',
    });
    updateParams({ city: '', minPrice: '', maxPrice: '', roomType: '', furnishing: '', preferredTenant: '', amenities: '' });
  };

  const toggleAmenity = (amenity) => {
    setLocalDraft((prev) => {
      const current = (prev.amenities || '').split(',').filter(Boolean);
      const next = current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity];
      return { ...prev, amenities: next.join(',') };
    });
  };

  const selectedAmenities = (localDraft.amenities || '').split(',').filter(Boolean);

  const activeFilters = FILTER_KEYS.filter((key) => searchParams.get(key));
  const activeFilterCount = activeFilters.length + (searchParams.get('q') ? 1 : 0);
  const hasAnyFilter = activeFilterCount > 0;

  const removeFilter = (key) => {
    if (key === 'amenities') {
      setLocalDraft((p) => ({ ...p, amenities: '' }));
    }
    updateParams({ [key]: '' });
  };

  const handleSaveSearch = async () => {
    setSavedSearchError('');
    try {
      await createSavedSearch({
        city: params.city || '',
        minPrice: params.minPrice || '',
        maxPrice: params.maxPrice || '',
        roomType: params.roomType || '',
      }).unwrap();
      toast.success('Search saved - we will alert you about new matches');
    } catch (err) {
      const msg = err?.data?.message || 'Could not save this search';
      setSavedSearchError(msg);
      toast.error(msg);
    }
  };

  const applySavedSearch = (search) => {
    updateParams({
      city: search.city || '',
      minPrice: search.minPrice ?? '',
      maxPrice: search.maxPrice ?? '',
      roomType: search.roomType || '',
      furnishing: '',
      preferredTenant: '',
      amenities: '',
    });
  };

  const filtersPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
          Clear all
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="filter-city">City</label>
        <div className="rounded-lg border border-input bg-background shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/60 hover:border-primary/40">
          <CityAutocomplete
            id="filter-city"
            value={localDraft.city}
            onChange={(val) => setLocalDraft((p) => ({ ...p, city: val }))}
            placeholder="e.g. Bengaluru"
            className="[&_input]:h-10 [&_input]:px-3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Price range (&#8377;/month)</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Min"
            aria-label="Minimum price"
            value={localDraft.minPrice}
            onChange={(e) => setLocalDraft((p) => ({ ...p, minPrice: e.target.value }))}
          />
          <span className="text-muted-foreground">&ndash;</span>
          <Input
            type="number"
            min="0"
            placeholder="Max"
            aria-label="Maximum price"
            value={localDraft.maxPrice}
            onChange={(e) => setLocalDraft((p) => ({ ...p, maxPrice: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="filter-roomType">Room type</label>
        <Select
          id="filter-roomType"
          value={localDraft.roomType}
          onChange={(e) => setLocalDraft((p) => ({ ...p, roomType: e.target.value }))}
        >
          <option value="">All types</option>
          {ROOM_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="filter-furnishing">Furnishing</label>
        <Select
          id="filter-furnishing"
          value={localDraft.furnishing}
          onChange={(e) => setLocalDraft((p) => ({ ...p, furnishing: e.target.value }))}
        >
          <option value="">Any furnishing</option>
          {FURNISHINGS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="filter-tenant">Preferred tenant</label>
        <Select
          id="filter-tenant"
          value={localDraft.preferredTenant}
          onChange={(e) => setLocalDraft((p) => ({ ...p, preferredTenant: e.target.value }))}
        >
          <option value="">Anyone</option>
          {TENANT_PREFS.filter(({ value }) => value !== 'ANY').map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Amenities</span>
        <div className="grid grid-cols-2 gap-1.5">
          {AMENITIES.map((amenity) => {
            const active = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                aria-pressed={active}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                  active ? 'border-primary bg-accent text-accent-foreground' : 'hover:border-primary/50'
                )}
              >
                {amenity.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            );
          })}
        </div>
      </div>

      <Button className="w-full" onClick={applyDraft}>Apply filters</Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Seo
        title="Browse Rooms"
        description="Browse available rooms, PGs and flats across India. Filter by city, budget, room type, furnishing and amenities."
        path="/rooms"
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            <span className="h-px w-6 bg-primary/50" /> Listings
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Rooms across India
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading || isFetching ? 'Searching...' : `${total} room${total === 1 ? '' : 's'} match your filters`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form
            className="relative flex-1 md:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              updateParams({ q: searchInput });
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 pr-16"
              placeholder="Search rooms..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search rooms"
            />
            <Button type="submit" size="sm" className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2.5">
              Search
            </Button>
          </form>
          <Select
            aria-label="Sort results"
            className="w-[180px]"
            value={params.sort || 'newest'}
            onChange={(e) => updateParams({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button
            variant="outline"
            className={cn(showMap && 'border-primary/50 text-primary')}
            onClick={() => setShowMap((s) => !s)}
            aria-pressed={showMap}
            aria-label="Toggle map view"
          >
            <MapIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Map</span>
          </Button>
          <Button
            variant="outline"
            className={cn('relative lg:hidden', showMobileFilters && 'border-primary/50 text-primary')}
            onClick={() => setShowMobileFilters((s) => !s)}
            aria-expanded={showMobileFilters}
            aria-label={`Toggle filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {user && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveSearch}
            disabled={savingSearch}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground transition-all hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-50"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            {savingSearch ? 'Saving...' : 'Save this search'}
          </button>
          {savedSearches.map((search) => (
            <span
              key={search._id}
              className="group inline-flex items-center overflow-hidden rounded-full border bg-background text-xs shadow-sm"
            >
              <button
                type="button"
                onClick={() => applySavedSearch(search)}
                className="inline-flex items-center gap-1.5 py-1.5 pl-3 pr-2 font-medium text-muted-foreground transition-colors hover:text-primary"
                title="Apply this saved search"
              >
                <BellRing className="h-3 w-3 text-primary" />
                <span className="max-w-[220px] truncate">{search.name}</span>
              </button>
              <button
                type="button"
                onClick={() => deleteSavedSearch(search._id)}
                aria-label={`Delete saved search ${search.name}`}
                className="flex h-7 w-7 items-center justify-center border-l text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {savedSearchError && (
            <span className="text-xs text-destructive">{savedSearchError}</span>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside key={appliedKey} className="hidden w-72 shrink-0 lg:block">
          <Card className="sticky top-20">
            <CardContent className="pt-6">{filtersPanel}</CardContent>
          </Card>
        </aside>

        {showMobileFilters && (
          <Card className="lg:hidden">
            <CardContent className="pt-6">{filtersPanel}</CardContent>
          </Card>
        )}

        <section className="min-w-0 flex-1">
          {hasAnyFilter && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {searchParams.get('q') && (
                <span className="inline-flex items-center overflow-hidden rounded-full border bg-accent text-xs font-medium text-accent-foreground">
                  <span className="py-1.5 pl-3 pr-1">&ldquo;{searchParams.get('q')}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => { setSearchInput(''); updateParams({ q: '' }); }}
                    aria-label="Clear search text"
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeFilters.map((key) => {
                const value = searchParams.get(key);
                const label =
                  key === 'minPrice' || key === 'maxPrice'
                    ? `${key === 'minPrice' ? 'Min' : 'Max'} \u20B9${Number(value).toLocaleString('en-IN')}`
                    : prettyLabel(value);
                return (
                  <span
                    key={key}
                    className="inline-flex items-center overflow-hidden rounded-full border bg-background text-xs shadow-sm"
                  >
                    <span className="py-1.5 pl-3 pr-1 font-medium text-muted-foreground">{label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (key === 'amenities') setLocalDraft((p) => ({ ...p, amenities: '' }));
                        removeFilter(key);
                      }}
                      aria-label={`Remove ${key} filter`}
                      className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {showMap && !isLoading && rooms.length > 0 && (
            <div className="mb-6">
              <RoomMapPanel rooms={rooms} />
            </div>
          )}
          {isError && (
            <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error?.data?.message || 'Could not load rooms. Please try again.'}
            </div>
          )}

          {isLoading ? (
            <RoomGridSkeleton count={6} />
          ) : rooms.length === 0 ? (
            hasAnyFilter ? (
              <EmptyState
                icon={Search}
                title="No rooms match your filters"
                description="Try widening the budget or removing a filter to see more listings."
              >
                <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
              </EmptyState>
            ) : (
              <>
                <EmptyState
                  icon={Building2}
                  title="No listings here yet — yours could be the first"
                  description="We just launched and listings are filling in. Owners can post a room free in under two minutes."
                >
                  {!user && (
                    <Link to="/register" className={cn(buttonVariants(), 'rounded-xl')}>
                      Post the first room
                    </Link>
                  )}
                </EmptyState>
                <div className="mt-8">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                    Explore popular cities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CITIES.map((name) => (
                      <Link
                        key={name}
                        to={`/rooms?city=${encodeURIComponent(name)}`}
                        className="rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                      >
                        Rooms in {name}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )
          ) : (
            <>
              <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3', isFetching && 'opacity-60')}>
                {rooms.map((room) => (
                  <RoomCard key={room._id} room={room} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={(p) => updateParams({ page: String(p) })} />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default BrowseRooms;
