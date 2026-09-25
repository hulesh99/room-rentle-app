import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, trim: true, maxlength: 60, default: '' },
    city: { type: String, trim: true, maxlength: 60, default: '' },
    minPrice: { type: Number, min: 0, default: null },
    maxPrice: { type: Number, min: 0, default: null },
    roomType: { type: String, trim: true, uppercase: true, maxlength: 30, default: '' },
  },
  { timestamps: true }
);

savedSearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export default mongoose.model('SavedSearch', savedSearchSchema);
