import mongoose from 'mongoose';

export const BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

const bookingRequestSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'PENDING',
      index: true,
    },
    message: { type: String, trim: true, maxlength: [500, 'Message cannot exceed 500 characters'], default: '' },
  },
  {
    timestamps: true,
  }
);

bookingRequestSchema.index({ room: 1, renter: 1, status: 1 });

const BookingRequest = mongoose.model('BookingRequest', bookingRequestSchema);

export default BookingRequest;
