import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Home as HomeIcon } from 'lucide-react';
import Lightbox from '@/components/common/Lightbox';
import { cn } from '@/lib/utils';

const RoomGallery = ({ images = [], title = '' }) => {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, images.length - 1)));
  }, [images.length]);

  if (!images.length) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
        <HomeIcon className="h-14 w-14 text-muted-foreground/30" />
      </div>
    );
  }

  const goPrev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  const openLightbox = (i) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="group relative aspect-video w-full overflow-hidden arch-top bg-muted skeleton-shimmer md:aspect-[16/10]">
        <button
          type="button"
          onClick={() => openLightbox(index)}
          className="relative block h-full w-full cursor-zoom-in"
          aria-label="Open full-screen photo"
        >
          <img
            src={images[index].url}
            alt={`${title} - photo ${index + 1}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>
        <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Expand className="h-4 w-4" />
        </span>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow transition-colors hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 shadow transition-colors hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.public_id}
              type="button"
              onClick={() => setIndex(i)}
              onDoubleClick={() => openLightbox(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                'skeleton-shimmer relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-all',
                i === index ? 'border-primary ring-2 ring-ring' : 'opacity-70 hover:opacity-100'
              )}
            >
              <img src={image.url} alt="" className="relative h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        images={images}
        index={lightboxOpen ? lightboxIndex : null}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(i) => {
          setLightboxIndex(i);
          setIndex(i);
        }}
      />
    </div>
  );
};

export default RoomGallery;
