import BookingRequest from '../models/BookingRequest.js';
import Room from '../models/Room.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import sendEmail from '../utils/sendEmail.js';
import { notifyUsers } from '../utils/sendPushNotification.js';
import { newBookingRequestEmail, requestAcceptedEmail, requestRejectedEmail } from '../utils/emailTemplates.js';
import { ensureChatRoom } from './chatController.js';

const ROOM_SUMMARY = 'title city price images roomType isAvailable';
const RENTER_SUMMARY = 'name email avatar';
const OWNER_SUMMARY = 'name avatar createdAt';

export const sendBookingRequest = asyncHandler(async (req, res) => {
  const { roomId, message = '' } = req.body;

  if (!roomId) throw new ApiError(422, 'roomId is required');
  const trimmedMessage = String(message || '').trim();
  if (trimmedMessage.length > 500)
    throw new ApiError(422, 'Message cannot exceed 500 characters');

  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  if (String(room.owner) === String(req.user._id))
    throw new ApiError(400, 'You cannot send a booking request for your own listing');

  if (!room.isAvailable)
    throw new ApiError(400, 'This room is currently booked and not accepting requests');

  const existing = await BookingRequest.findOne({
    room: room._id,
    renter: req.user._id,
    status: { $in: ['PENDING', 'ACCEPTED'] },
  });

  if (existing)
    throw new ApiError(409, 'You already have an active request for this room');

  const booking = await BookingRequest.create({
    room: room._id,
    renter: req.user._id,
    owner: room.owner,
    message: trimmedMessage,
  });

  await booking.populate([
    { path: 'room', select: ROOM_SUMMARY },
    { path: 'owner', select: 'name email' },
  ]);

  sendEmail({
    to: booking.owner.email,
    subject: `New booking request for "${booking.room.title}"`,
    text: `${req.user.name} sent a booking request for your listing "${booking.room.title}".`,
    html: newBookingRequestEmail({
      ownerName: booking.owner.name,
      renterName: req.user.name,
      roomTitle: booking.room.title,
      message: trimmedMessage,
    }),
  }).catch(() => {});

  notifyUsers([booking.owner._id], {
    title: 'New booking request',
    body: `${req.user.name} requested "${booking.room.title}"`,
    type: 'BOOKING_REQUEST',
    meta: {
      bookingId: String(booking._id),
      roomId: String(booking.room._id),
      link: '/owner/requests',
    },
  });

  const ownerPublic = {
    _id: booking.owner._id,
    name: booking.owner.name,
    avatar: undefined,
    createdAt: undefined,
  };

  res.status(201).json({
    success: true,
    message: 'Booking request sent to the owner',
    data: { ...booking.toObject(), owner: ownerPublic },
  });
});

export const getReceivedRequests = asyncHandler(async (req, res) => {
  const requests = await BookingRequest.find({ owner: req.user._id })
    .populate('renter', RENTER_SUMMARY)
    .populate('room', ROOM_SUMMARY)
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

export const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await BookingRequest.find({ renter: req.user._id })
    .populate('owner', OWNER_SUMMARY)
    .populate('room', ROOM_SUMMARY)
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['ACCEPTED', 'REJECTED'].includes(status))
    throw new ApiError(422, "Status must be either 'ACCEPTED' or 'REJECTED'");

  const booking = await BookingRequest.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking request not found');

  if (String(booking.owner) !== String(req.user._id))
    throw new ApiError(403, 'Only the listing owner can update this request');

  if (booking.status !== 'PENDING')
    throw new ApiError(400, `This request has already been ${booking.status.toLowerCase()}`);

  booking.status = status;
  await booking.save();

  if (status === 'ACCEPTED') {
    await Room.findByIdAndUpdate(booking.room, { isAvailable: false });
    await BookingRequest.updateMany(
      { room: booking.room, _id: { $ne: booking._id }, status: 'PENDING' },
      { status: 'REJECTED' }
    );
    try {
      await ensureChatRoom(booking.room, booking.renter, booking.owner);
    } catch (error) {
      console.error('Chat room creation failed:', error.message);
    }
  }

  await booking.populate([
    { path: 'renter', select: RENTER_SUMMARY },
    { path: 'room', select: ROOM_SUMMARY },
    { path: 'owner', select: 'name email' },
  ]);

  sendEmail({
    to: status === 'ACCEPTED' ? booking.renter.email : booking.renter.email,
    subject:
      status === 'ACCEPTED'
        ? `Your request for "${booking.room.title}" was accepted`
        : `Update on your request for "${booking.room.title}"`,
    text:
      status === 'ACCEPTED'
        ? `${booking.owner.name} accepted your booking request for "${booking.room.title}". Chat is now unlocked.`
        : `${booking.owner.name} could not accept your request for "${booking.room.title}".`,
    html:
      status === 'ACCEPTED'
        ? requestAcceptedEmail({
            renterName: booking.renter.name,
            roomTitle: booking.room.title,
            ownerName: booking.owner.name,
          })
        : requestRejectedEmail({
            renterName: booking.renter.name,
            roomTitle: booking.room.title,
            ownerName: booking.owner.name,
          }),
  }).catch(() => {});

  notifyUsers([booking.renter._id], {
    title: status === 'ACCEPTED' ? 'Request accepted' : 'Request rejected',
    body:
      status === 'ACCEPTED'
        ? `${booking.owner.name} accepted your request for "${booking.room.title}". Chat is unlocked!`
        : `${booking.owner.name} could not accept your request for "${booking.room.title}".`,
    type: status === 'ACCEPTED' ? 'BOOKING_ACCEPTED' : 'BOOKING_REJECTED',
    meta: {
      bookingId: String(booking._id),
      roomId: String(booking.room._id),
      link: '/renter/requests',
    },
  });

  const data = booking.toObject();
  if (data.renter) delete data.renter.email;
  if (data.owner) delete data.owner.email;

  res.json({
    success: true,
    message:
      status === 'ACCEPTED'
        ? 'Request accepted. Chat will unlock for both of you'
        : 'Request rejected',
    data,
  });
});

export const cancelBookingRequest = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking request not found');

  if (String(booking.renter) !== String(req.user._id))
    throw new ApiError(403, 'You can only cancel your own requests');

  if (booking.status !== 'PENDING')
    throw new ApiError(400, `A ${booking.status.toLowerCase()} request cannot be cancelled`);

  booking.status = 'CANCELLED';
  await booking.save();

  res.json({ success: true, message: 'Booking request cancelled', data: booking });
});
