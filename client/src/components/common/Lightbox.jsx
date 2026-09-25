import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const Lightbox = ({ images = [], index, onClose, onNavigate }) => {
  const total = images.length;

  const goPrev = useCallback(() => {
    if (total > 1) onNavigate((index - 1 + total) % total);
  }, [index, total, onNavigate]);

  const goNext = useCallback(() => {
    if (total > 1) onNavigate((index + 1) % total);
  }, [index, total, onNavigate]);

  const isOpen = total > 0 && index !== null && index >= 0;

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, goPrev, goNext]);

  if (!isOpen) return null;
  const image = images[index];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <figure
        key={image.url}
        className="max-h-[85vh] max-w-[92vw] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={`Photo ${index + 1} of ${total}`}
          className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-lift"
        />
        <figcaption className="mt-3 text-center text-xs text-white/70">
          {index + 1} / {total}
        </figcaption>
      </figure>
    </div>
  );
};

export default Lightbox;
