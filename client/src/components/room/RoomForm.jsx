import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import { AMENITIES, FURNISHINGS, ROOM_TYPES, TENANT_PREFS } from '@/utils/constants';
import { isValidPhone } from '@/utils/validators';
import { prettyLabel } from '@/utils/format';
import { compressImages } from '@/utils/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const MAX_IMAGES = 10;

const WIZARD_STEPS = [
  { title: 'Location', fields: ['address', 'city', 'state', 'pincode'] },
  {
    title: 'Room details',
    fields: ['title', 'description', 'price', 'floorNo', 'totalFloors', 'contactNumber'],
  },
  { title: 'Photos & publish', fields: ['images'] },
];

const DEFAULT_FORM = {
  title: '',
  description: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  price: '',
  roomType: 'SINGLE',
  furnishing: 'UNFURNISHED',
  preferredTenant: 'ANY',
  amenities: [],
  floorNo: '0',
  totalFloors: '1',
  contactNumber: '',
};

const SectionTitle = ({ children }) => (
  <h2 className="mb-4 border-b pb-2 text-base font-semibold tracking-tight">{children}</h2>
);

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-destructive">{message}</p> : null;

const RoomForm = ({ mode = 'create', initial = null, submitting, serverError, onSubmit }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [existingImages, setExistingImages] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [compressingCount, setCompressingCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || '',
        description: initial.description || '',
        address: initial.address || '',
        city: initial.city || '',
        state: initial.state || '',
        pincode: initial.pincode || '',
        price: initial.price ?? '',
        roomType: initial.roomType || 'SINGLE',
        furnishing: initial.furnishing || 'UNFURNISHED',
        preferredTenant: initial.preferredTenant || 'ANY',
        amenities: initial.amenities || [],
        floorNo: String(initial.floorNo ?? '0'),
        totalFloors: String(initial.totalFloors ?? '1'),
        contactNumber: initial.contactNumber || '',
      });
      setExistingImages(initial.images || []);
    }
  }, [initial]);

  const totalImageCount = existingImages.length - removedIds.length + newImages.length;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addFiles = async (fileList) => {
    const incoming = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;
    const slots = MAX_IMAGES - totalImageCount;
    if (slots <= 0 || incoming.length === 0) {
      setErrors((prev) => ({ ...prev, images: `Maximum ${MAX_IMAGES} images allowed` }));
      return;
    }
    const batch = incoming.slice(0, slots);
    setCompressingCount(batch.length);
    try {
      const compressed = await compressImages(batch, { maxDimension: 1600, quality: 0.82 });
      setNewImages((prev) => [
        ...prev,
        ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) })),
      ]);
      setErrors((prev) => ({ ...prev, images: undefined }));
    } finally {
      setCompressingCount(0);
    }
  };

  const moveNewImage = (index, direction) => {
    setNewImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const toggleRemovedExisting = (publicId) => {
    setRemovedIds((prev) =>
      prev.includes(publicId)
        ? prev.filter((id) => id !== publicId)
        : [...prev, publicId]
    );
  };

  useEffect(() => {
    return () => newImages.forEach((item) => URL.revokeObjectURL(item.preview));
  }, []);

  const computeErrors = () => {
    const errs = {};
    if (form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters';
    if (form.description.trim().length < 20)
      errs.description = 'Description must be at least 20 characters';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!/^[1-9]\d{5}$/.test(form.pincode)) errs.pincode = 'Enter a valid 6-digit pincode';
    if (!(Number(form.price) > 0)) errs.price = 'Monthly rent must be greater than 0';
    if (Number(form.floorNo) < 0) errs.floorNo = 'Floor cannot be negative';
    if (Number(form.totalFloors) < 1) errs.totalFloors = 'Total floors must be at least 1';
    if (Number(form.floorNo) > 0 && Number(form.floorNo) >= Number(form.totalFloors))
      errs.floorNo = 'Floor must be less than total floors';
    if (totalImageCount < 1) errs.images = 'Add at least one image';
    if (totalImageCount > MAX_IMAGES) errs.images = `Maximum ${MAX_IMAGES} images allowed`;
    if (form.contactNumber && !isValidPhone(form.contactNumber))
      errs.contactNumber = 'Enter a valid Indian mobile number';
    return errs;
  };

  const validateStep = (index) => {
    const all = computeErrors();
    const stepFields = WIZARD_STEPS[index].fields;
    const filtered = {};
    stepFields.forEach((field) => {
      if (all[field]) filtered[field] = all[field];
    });
    setErrors((prev) => ({ ...prev, ...filtered }));
    return Object.keys(filtered).length === 0;
  };

  const goToStep = (index) => {
    if (index > step && !validateStep(step)) return;
    setErrors({});
    setStep(Math.max(0, Math.min(WIZARD_STEPS.length - 1, index)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = computeErrors();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstBadStep = WIZARD_STEPS.findIndex((s) => s.fields.some((f) => errs[f]));
      setStep(firstBadStep === -1 ? WIZARD_STEPS.length - 1 : firstBadStep);
      return;
    }
    await onSubmit(buildFormData());
  };

  const buildFormData = () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'amenities') formData.append('amenities', value.join(','));
      else formData.append(key, value);
    });
    formData.append('isAvailable', String(initial?.isAvailable ?? true));
    if (mode === 'edit') {
      formData.append(
        'keepImages',
        JSON.stringify(
          existingImages
            .filter((img) => !removedIds.includes(img.public_id))
            .map((img) => img.public_id)
        )
      );
    }
    newImages.forEach((item) => formData.append('images', item.file));
    return formData;
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {serverError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <ol className="flex items-center gap-2">
        {WIZARD_STEPS.map(({ title }, index) => {
          const isDone = index < step;
          const isActive = index === step;
          return (
            <li key={title} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => goToStep(index)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive && 'border-primary bg-accent text-accent-foreground',
                  isDone && 'border-primary/40 bg-background text-primary',
                  !isActive && !isDone && 'border-border bg-background text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                    isActive ? 'bg-primary text-white' : isDone ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? '✓' : index + 1}
                </span>
                <span className="hidden sm:inline">{title}</span>
              </button>
              {index < WIZARD_STEPS.length - 1 && (
                <span className={cn('h-px flex-1', index < step ? 'bg-primary/50' : 'bg-border')} />
              )}
            </li>
          );
        })}
      </ol>

      {step === 0 && (
        <Card>
          <CardContent className="pt-6">
            <SectionTitle>Where is the room?</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Full address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Flat 302, Sunrise Apartments, MG Road"
                  value={form.address}
                  onChange={handleChange}
                />
                <FieldError message={errors.address} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Bengaluru" value={form.city} onChange={handleChange} />
                <FieldError message={errors.city} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" placeholder="Karnataka" value={form.state} onChange={handleChange} />
                <FieldError message={errors.state} />
              </div>
              <div className="space-y-2 sm:col-span-2 sm:max-w-[200px]">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} placeholder="560001" value={form.pincode} onChange={handleChange} />
                <FieldError message={errors.pincode} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
      <>
      <Card>
        <CardContent className="pt-6">
          <SectionTitle>Basic information</SectionTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Listing title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Spacious single room near metro station"
                value={form.title}
                onChange={handleChange}
              />
              <FieldError message={errors.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Describe the room, house rules, nearby landmarks, utilities included..."
                value={form.description}
                onChange={handleChange}
              />
              <FieldError message={errors.description} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <SectionTitle>Pricing &amp; details</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Rent per month (&#8377;)</Label>
              <Input id="price" name="price" type="number" min="0" placeholder="12000" value={form.price} onChange={handleChange} />
              <FieldError message={errors.price} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomType">Room type</Label>
              <Select id="roomType" name="roomType" value={form.roomType} onChange={handleChange}>
                {ROOM_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="furnishing">Furnishing</Label>
              <Select id="furnishing" name="furnishing" value={form.furnishing} onChange={handleChange}>
                {FURNISHINGS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredTenant">Preferred tenant</Label>
              <Select id="preferredTenant" name="preferredTenant" value={form.preferredTenant} onChange={handleChange}>
                {TENANT_PREFS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="floorNo">Floor number</Label>
              <Input id="floorNo" name="floorNo" type="number" min="0" value={form.floorNo} onChange={handleChange} />
              <FieldError message={errors.floorNo} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalFloors">Total floors</Label>
              <Input id="totalFloors" name="totalFloors" type="number" min="1" value={form.totalFloors} onChange={handleChange} />
              <FieldError message={errors.totalFloors} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <SectionTitle>Amenities</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {AMENITIES.map((amenity) => {
              const active = form.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-[44px] items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors',
                    active
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'bg-background text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                  {prettyLabel(amenity)}
                </button>
              );
            })}
           </div>
        </CardContent>
      </Card>

      </>
      )}

      {step === 2 && (
      <>
      <Card>
        <CardContent className="pt-6">
          <SectionTitle>Photos</SectionTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>First photo becomes the cover image.</span>
              <span>{totalImageCount}/{MAX_IMAGES}</span>
            </div>

            <label
              htmlFor="image-upload"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? 'border-primary bg-accent/60 scale-[1.01]'
                  : 'border-border hover:border-primary/60 hover:bg-accent/40'
              }`}
            >
              {compressingCount > 0 ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    Optimizing {compressingCount} photo{compressingCount > 1 ? 's' : ''}...
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                    <UploadCloud className="h-6 w-6 text-primary" />
                  </span>
                  <span className="text-sm font-medium">
                    Drag &amp; drop photos here, or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPEG, PNG or WEBP &middot; auto-compressed to WebP &middot; up to 5 MB each
                  </span>
                </>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
                disabled={compressingCount > 0}
              />
            </label>
            <FieldError message={errors.images} />

            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {existingImages.map((img) => {
                  const removed = removedIds.includes(img.public_id);
                  return (
                    <div key={img.public_id} className={`group relative aspect-square overflow-hidden rounded-md border ${removed ? 'opacity-40' : ''}`}>
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => toggleRemovedExisting(img.public_id)}
                        aria-label={removed ? 'Undo removal' : 'Remove image'}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow hover:bg-background"
                      >
                        {removed ? '+' : <X className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  );
                })}
                {newImages.map((item, index) => (
                  <div key={item.preview} className="group relative aspect-square overflow-hidden rounded-md border ring-2 ring-ring/40">
                    <img src={item.preview} alt="" className="h-full w-full object-cover" />
                    {index === 0 && existingImages.length === 0 && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveNewImage(index, -1)}
                        disabled={index === 0}
                        aria-label="Move image left"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black shadow disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveNewImage(index, 1)}
                        disabled={index === newImages.length - 1}
                        aria-label="Move image right"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black shadow disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      aria-label="Remove image"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 shadow hover:bg-background"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <SectionTitle>Contact number (optional)</SectionTitle>
          <div className="max-w-sm space-y-2">
            <Input
              id="contactNumber"
              name="contactNumber"
              placeholder="9876543210"
              value={form.contactNumber}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Shown to renters only after you accept their booking request.
            </p>
            <FieldError message={errors.contactNumber} />
          </div>
        </CardContent>
      </Card>

      {form.title && form.city && (
        <div className="rounded-xl border border-dashed bg-secondary/40 p-4 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Review</p>
          <p className="mt-1 font-display text-base font-semibold">{form.title}</p>
          <p className="text-muted-foreground">
            {form.city}, {form.state} &middot; &#8377;{Number(form.price).toLocaleString('en-IN')}/mo &middot;{' '}
            {totalImageCount} photo{totalImageCount === 1 ? '' : 's'}
          </p>
        </div>
      )}
      </>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => goToStep(step - 1)}
          disabled={step === 0}
        >
          Back
        </Button>
        {step < WIZARD_STEPS.length - 1 ? (
          <Button
            type="button"
            size="lg"
            className="rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-glow"
            onClick={() => goToStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-primary to-emerald-600 shadow-glow"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : mode === 'create' ? (
              'Publish listing'
            ) : (
              'Save changes'
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default RoomForm;
