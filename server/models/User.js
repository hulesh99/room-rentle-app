import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const avatarSchema = new mongoose.Schema(
  {
    public_id: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['OWNER', 'RENTER'],
      default: 'RENTER',
    },
    avatar: { type: avatarSchema, default: () => ({}) },
    fcmTokens: [
      {
        token: { type: String, required: true },
        device: { type: String, default: 'web' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    city: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
