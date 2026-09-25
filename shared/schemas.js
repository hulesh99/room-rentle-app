import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be at most 72 characters'),
  role: z.enum(['RENTER', 'OWNER'], {
    errorMap: () => ({ message: 'Role must be RENTER or OWNER' }),
  }),
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const savedSearchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  city: z.string().trim().max(60).optional().or(z.literal('')),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  roomType: z.string().trim().max(30).optional().or(z.literal('')),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.issues[0]?.message || 'Invalid input';
    return res.status(422).json({ success: false, message: firstError });
  }
  req.body = result.data;
  return next();
};
