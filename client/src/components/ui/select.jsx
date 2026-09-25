import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = forwardRef(({ className, children, ...props }, ref) => (
  <div className={cn('relative', className)}>
    <select
      ref={ref}
      className={cn(
        'peer flex h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-card pl-4 pr-10 text-sm font-medium text-foreground shadow-sm outline-none transition-all hover:border-primary/40 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-card [&>option]:font-normal [&>option]:text-card-foreground',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors peer-hover:bg-accent peer-hover:text-primary">
      <ChevronDown className="h-3.5 w-3.5" />
    </span>
  </div>
));
Select.displayName = 'Select';

export { Select };
