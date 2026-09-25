import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateUserProfile } from '@/redux/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { isValidPhone, isValidName } from '@/utils/validators';
import { formatDate } from '@/utils/formatDate';
import { getInitials } from '@/utils/helpers';
import PageHeader from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [form, setForm] = useState({ name: '', city: '', phone: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (user && !hydratedRef.current) {
      hydratedRef.current = true;
      setForm({
        name: user.name || '',
        city: user.city || '',
        phone: user.phone || '',
      });
    }
  }, []);

  if (!user) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setServerError('');
    setSaved(false);
  };

  const pickAvatar = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, avatar: 'Only JPEG, PNG or WEBP allowed' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, avatar: 'Image must be under 5 MB' }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, avatar: undefined }));
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!isValidName(form.name)) errors.name = 'Name must be at least 2 characters';
    if (form.phone && !isValidPhone(form.phone))
      errors.phone = 'Enter a valid Indian mobile number';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setServerError('');

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('city', form.city);
      formData.append('phone', form.phone);
      if (avatarFile) formData.append('avatar', avatarFile);

      await dispatch(updateUserProfile(formData)).unwrap();
      setAvatarFile(null);
      setAvatarPreview(null);
      setSaved(true);
    } catch (message) {
      setServerError(typeof message === 'string' ? message : 'Could not update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const avatarUrl = avatarPreview || user.avatar?.url || '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        kicker="Your account"
        title="My profile"
        subtitle="Manage your account details"
      />

      <div className="mt-8 grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-28 w-28 overflow-hidden rounded-full bg-primary text-3xl font-semibold text-primary-foreground"
              aria-label="Change profile photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6" />
                <span className="text-[10px] font-medium">Change photo</span>
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                pickAvatar(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {fieldErrors.avatar && (
              <p className="text-xs text-destructive">{fieldErrors.avatar}</p>
            )}

            <div>
              <p className="truncate text-lg font-bold">{user.name}</p>
              <Badge variant={user.role === 'OWNER' ? 'success' : 'default'} className="mt-1.5">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(user.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account details</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} />
                {fieldErrors.name && (
                  <p className="text-xs text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Bengaluru"
                  value={form.city}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Get notified when new rooms are listed in your city.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleChange}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </div>
              )}
              {saved && !serverError && (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Profile updated successfully
                </div>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
