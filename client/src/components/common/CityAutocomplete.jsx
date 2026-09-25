import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { searchCities } from '@/utils/cities';
import { cn } from '@/lib/utils';

const CityAutocomplete = ({ value, onChange, placeholder = 'City — e.g. Pune', className = '', id }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const results = searchCities(value);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pick = (entry) => {
    onChange(entry.city);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || results.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
          }
          if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            pick(results[activeIndex]);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="city-suggestions"
        aria-autocomplete="list"
        className={cn(
          'w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70',
          !className.includes('h-10') && 'py-2'
        )}
      />

      {open && results.length > 0 && (
        <ul
          id="city-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lift animate-slide-down"
        >
          {results.map(({ city, state }, index) => (
            <li key={`${city}-${state}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick({ city, state })}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground'
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {city}, {state}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CityAutocomplete;
