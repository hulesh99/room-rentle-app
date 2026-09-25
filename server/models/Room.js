import mongoose from 'mongoose';

export const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'STUDIO', 'PG', 'FLAT'];
export const FURNISHINGS = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'];
export const TENANT_PREFS = ['ANY', 'MALE', 'FEMALE', 'FAMILY'];
export const AMENITIES = [
  'WIFI',
  'AC',
  'PARKING',
  'WASHING_MACHINE',
  'REFRIGERATOR',
  'TV',
  'GEYSER',
  'POWER_BACKUP',
  'HOUSEKEEPING',
  'BALCONY',
  'SECURITY',
  'LIFT',
];

const imageSchema = new mongoose.Schema(
  {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[1-9]\d{5}$/, 'Please provide a valid 6-digit pincode'],
    },
    price: {
      type: Number,
      required: [true, 'Monthly price is required'],
      min: [0, 'Price cannot be negative'],
    },
    roomType: {
      type: String,
      enum: ROOM_TYPES,
      required: [true, 'Room type is required'],
    },
    amenities: [{ type: String, enum: AMENITIES }],
    images: {
      type: [imageSchema],
      validate: [(v) => v.length <= 10, 'Maximum 10 images allowed'],
    },
    furnishing: {
      type: String,
      enum: FURNISHINGS,
      default: 'UNFURNISHED',
    },
    preferredTenant: {
      type: String,
      enum: TENANT_PREFS,
      default: 'ANY',
    },
    floorNo: { type: Number, default: 0, min: 0 },
    totalFloors: { type: Number, default: 1, min: 1 },
    contactNumber: { type: String, trim: true, default: '' },
    isAvailable: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);

export default Room;
