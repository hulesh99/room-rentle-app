import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const Loader = ({ className, label }) => (
  <div
    className={cn(
      'flex min-h-[60vh] w-full flex-col items-center justify-center gap-3',
      className
    )}
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
  </div>
);

export default Loader;
