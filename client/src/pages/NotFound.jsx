import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Seo from '@/components/common/Seo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotFound = () => (
  <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-4 px-4 text-center">
    <Seo title="Page not found" noIndex />
    <Compass className="h-14 w-14 text-muted-foreground/40" />
    <h1 className="text-7xl font-black tracking-tight text-primary">404</h1>
    <p className="max-w-sm text-sm text-muted-foreground">
      The page you are looking for does not exist or may have been moved.
    </p>
    <Link to="/" className={cn(buttonVariants({ variant: 'outline' }))}>
      Back to home
    </Link>
  </div>
);

export default NotFound;
