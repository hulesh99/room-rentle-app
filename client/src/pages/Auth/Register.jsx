import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { BedDouble, Building2, Loader2, UserPlus } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { registerUser } from '@/redux/slices/authSlice';
import { dashboardPath } from '@/utils/helpers';
import { validateRegister } from '@/utils/validators';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES = [
  {
    value: 'RENTER',
    label: 'I want a room',
    description: 'Browse listings, save favourites and send booking requests',
    icon: BedDouble,
  },
  {
    value: 'OWNER',
    label: 'I have a room',
    description: 'Post listings, receive requests and chat with renters',
    icon: Building2,
  },
];

const Register = () => {
  usePageTitle('Create Account');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setServerError('');
  };

  const selectRole = (role) => {
    setForm((prev) => ({ ...prev, role }));
    setFieldErrors((prev) => ({ ...prev, role: undefined }));
    setServerError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validateRegister(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await dispatch(registerUser(form)).unwrap();
      toast.success('Account created - welcome!');
      navigate(dashboardPath(data.user.role), { replace: true });
    } catch (message) {
      const msg = typeof message === 'string' ? message : 'Something went wrong';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-muted/30 px-4 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-72 w-72 animate-blob rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-72 w-72 animate-blob rounded-full bg-teal-400/15 blur-3xl [animation-delay:3s]" />
      </div>
      <Card className="relative w-full max-w-md animate-fade-in-up rounded-2xl border-border/70 shadow-lift">
        <CardHeader className="space-y-1 text-center sm:text-left">
          <CardTitle className="font-display text-2xl font-semibold">Create your account</CardTitle>
          <CardDescription>Join as a renter or an owner in under a minute</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectRole(value)}
                  aria-pressed={form.role === value}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    form.role === value
                      ? 'border-primary bg-accent ring-2 ring-ring'
                      : 'bg-background hover:border-primary/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      form.role === value ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs leading-snug text-muted-foreground">{description}</span>
                </button>
              ))}
            </div>
            {fieldErrors.role && <p className="text-xs text-destructive">{fieldErrors.role}</p>}

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Hulesh D."
                value={form.name}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-glow"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Create account
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
