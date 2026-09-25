import Wishlist from '../models/Wishlist.js';
import Room from '../models/Room.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ renter: req.user._id }).populate({
    path: 'rooms',
    select: '-contactNumber',
    options: { sort: { createdAt: -1 } },
  });

  if (!wishlist) {
    wishlist = { rooms: [] };
  }

  res.json({ success: true, data: { rooms: wishlist.rooms } });
});

export const toggleWishlistRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  let wishlist = await Wishlist.findOne({ renter: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ renter: req.user._id, rooms: [] });
  }

  const index = wishlist.rooms.findIndex((id) => String(id) === String(roomId));

  let saved;
  if (index === -1) {
    wishlist.rooms.push(roomId);
    saved = true;
  } else {
    wishlist.rooms.splice(index, 1);
    saved = false;
  }

  await wishlist.save();

  res.json({
    success: true,
    message: saved ? 'Added to wishlist' : 'Removed from wishlist',
    data: { roomId: String(roomId), saved },
  });
});
