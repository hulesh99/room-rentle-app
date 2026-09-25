import crypto from 'crypto';
import BookingRequest from '../models/BookingRequest.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAgoraConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { appId: process.env.AGORA_APP_ID || '' } });
});

export const initiateCall = asyncHandler(async (req, res) => {
  const { recipientId, callType = 'audio' } = req.body;

  if (!recipientId) throw new ApiError(422, 'recipientId is required');
  if (!['audio', 'video'].includes(callType))
    throw new ApiError(422, "callType must be 'audio' or 'video'");
  if (String(recipientId) === String(req.user._id))
    throw new ApiError(400, 'You cannot call yourself');

  const recipient = await User.findById(recipientId).select('name avatar');
  if (!recipient) throw new ApiError(404, 'User not found');

  const acceptedBooking = await BookingRequest.findOne({
    status: 'ACCEPTED',
    $or: [
      { owner: req.user._id, renter: recipientId },
      { owner: recipientId, renter: req.user._id },
    ],
  });

  if (!acceptedBooking)
    throw new ApiError(403, 'You can only call users you have an accepted booking with');

  const channelName = `rr-${acceptedBooking.room}-${crypto.randomBytes(6).toString('hex')}`;

  res.json({
    success: true,
    data: {
      appId: process.env.AGORA_APP_ID || '',
      channelName,
      callType,
      recipient: { id: recipient._id, name: recipient.name, avatar: recipient.avatar },
      bookingId: acceptedBooking._id,
    },
  });
});
