import Room, {
  AMENITIES,
  FURNISHINGS,
  ROOM_TYPES,
  TENANT_PREFS,
} from '../models/Room.js';
import BookingRequest from '../models/BookingRequest.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadImages, deleteImage } from '../utils/uploadToCloudinary.js';
import User from '../models/User.js';
import Wishlist from '../models/Wishlist.js';
import { notifyUsers } from '../utils/sendPushNotification.js';
import { matchSavedSearches } from './savedSearchController.js';

const EMAIL_SAFE_REGEX = /^[1-9]\d{5}$/;
const PHONE_REGEX = /^(\+91[\s-]?)?[6-9]\d{9}$/;

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const str = (value) => (typeof value === 'string' ? value.trim() : '');
const toInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const toBool = (value) => value === true || value === 'true';

const parseRoomPayload = (body, { partial = false } = {}) => {
  const payload = {};

  if (!partial || body.title !== undefined) {
    const title = str(body.title);
    if (title.length < 10 || title.length > 100)
      throw new ApiError(422, 'Title must be between 10 and 100 characters');
    payload.title = title;
  }

  if (!partial || body.description !== undefined) {
    const description = str(body.description);
    if (description.length < 20 || description.length > 2000)
      throw new ApiError(422, 'Description must be between 20 and 2000 characters');
    payload.description = description;
  }

  if (!partial || body.address !== undefined) {
    const address = str(body.address);
    if (!address || address.length > 200)
      throw new ApiError(422, 'A valid address (max 200 characters) is required');
    payload.address = address;
  }

  if (!partial || body.city !== undefined) {
    const city = str(body.city);
    if (!city || city.length > 60) throw new ApiError(422, 'A valid city is required');
    payload.city = city;
  }

  if (!partial || body.state !== undefined) {
    const state = str(body.state);
    if (!state || state.length > 60) throw new ApiError(422, 'A valid state is required');
    payload.state = state;
  }

  if (!partial || body.pincode !== undefined) {
    const pincode = str(body.pincode);
    if (!EMAIL_SAFE_REGEX.test(pincode)) throw new ApiError(422, 'Pincode must be a valid 6-digit code');
    payload.pincode = pincode;
  }

  if (!partial || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0)
      throw new ApiError(422, 'Monthly price must be a positive number');
    payload.price = Math.round(price);
  }

  if (!partial || body.roomType !== undefined) {
    const roomType = str(body.roomType).toUpperCase();
    if (!ROOM_TYPES.includes(roomType))
      throw new ApiError(422, `Room type must be one of: ${ROOM_TYPES.join(', ')}`);
    payload.roomType = roomType;
  }

  if (!partial || body.furnishing !== undefined) {
    const furnishing = (str(body.furnishing) || 'UNFURNISHED').toUpperCase();
    if (!FURNISHINGS.includes(furnishing)) throw new ApiError(422, 'Invalid furnishing value');
    payload.furnishing = furnishing;
  }

  if (!partial || body.preferredTenant !== undefined) {
    const preferredTenant = (str(body.preferredTenant) || 'ANY').toUpperCase();
    if (!TENANT_PREFS.includes(preferredTenant))
      throw new ApiError(422, 'Invalid preferred tenant value');
    payload.preferredTenant = preferredTenant;
  }

  if (!partial || body.amenities !== undefined) {
    const rawAmenities = Array.isArray(body.amenities)
      ? body.amenities
      : str(body.amenities).split(',');
    payload.amenities = [
      ...new Set(
        rawAmenities
          .map((a) => String(a).trim().toUpperCase())
          .filter((a) => AMENITIES.includes(a))
      ),
    ].slice(0, AMENITIES.length);
  }

  if (!partial || body.floorNo !== undefined) {
    const floorNo = toInt(body.floorNo ?? 0);
    if (floorNo === undefined || floorNo < 0) throw new ApiError(422, 'Floor number must be 0 or more');
    payload.floorNo = floorNo;
  }

  if (!partial || body.totalFloors !== undefined) {
    const totalFloors = toInt(body.totalFloors ?? 1);
    if (totalFloors === undefined || totalFloors < 1)
      throw new ApiError(422, 'Total floors must be at least 1');
    payload.totalFloors = totalFloors;
  }

  if (payload.floorNo !== undefined && payload.totalFloors !== undefined) {
    if (payload.floorNo >= payload.totalFloors && payload.totalFloors > 0 && payload.floorNo > 0) {
      throw new ApiError(422, 'Floor number cannot exceed total floors. Ground floor uses 0');
    }
  }

  if (!partial || body.contactNumber !== undefined) {
    const contactNumber = str(body.contactNumber).replace(/[\s-]/g, '');
    if (contactNumber && !PHONE_REGEX.test(contactNumber))
      throw new ApiError(422, 'Contact number must be a valid Indian mobile number');
    payload.contactNumber = contactNumber;
  }

  if (body.isAvailable !== undefined && body.isAvailable !== '') {
    payload.isAvailable = toBool(body.isAvailable);
  }

  return payload;
};

export const sanitizeRoom = (room, { revealContact = false } = {}) => {
  const source = room.toObject ? room.toObject() : room;
  const { contactNumber, ...rest } = source;
  return revealContact ? { ...rest, contactNumber } : rest;
};

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

export const getRooms = asyncHandler(async (req, res) => {
  const {
    q,
    city,
    minPrice,
    maxPrice,
    roomType,
    furnishing,
    preferredTenant,
    amenities,
    availability = 'AVAILABLE',
    sort = 'newest',
    page = '1',
    limit = '12',
  } = req.query;

  const filter = {};

  if (availability === 'AVAILABLE') filter.isAvailable = true;
  else if (availability === 'BOOKED') filter.isAvailable = false;

  if (city && str(city)) filter.city = new RegExp(`^${escapeRegex(str(city))}$`, 'i');

  if (roomType && ROOM_TYPES.includes(String(roomType).toUpperCase())) {
    filter.roomType = String(roomType).toUpperCase();
  }

  if (furnishing && FURNISHINGS.includes(String(furnishing).toUpperCase())) {
    filter.furnishing = String(furnishing).toUpperCase();
  }

  if (preferredTenant && TENANT_PREFS.includes(String(preferredTenant).toUpperCase())) {
    filter.preferredTenant = { $in: [String(preferredTenant).toUpperCase(), 'ANY'] };
  }

  if (amenities && str(amenities)) {
    const list = str(amenities)
      .split(',')
      .map((a) => a.trim().toUpperCase())
      .filter((a) => AMENITIES.includes(a));
    if (list.length > 0) filter.amenities = { $all: list };
  }

  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    filter.price = {};
    if (Number.isFinite(min)) filter.price.$gte = min;
    if (Number.isFinite(max)) filter.price.$lte = max;
  }

  if (q && str(q)) {
    const pattern = new RegExp(escapeRegex(str(q)), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }, { city: pattern }, { address: pattern }];
  }

  const sortOption = SORT_MAP[sort] || SORT_MAP.newest;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));

  const [rooms, total] = await Promise.all([
    Room.find(filter)
      .sort(sortOption)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Room.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: rooms.map((room) => sanitizeRoom(room)),
    page: currentPage,
    totalPages: Math.ceil(total / pageSize),
    total,
    limit: pageSize,
  });
});

export const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ owner: req.user._id }).sort({ createdAt: -1 });

  const roomIds = rooms.map((room) => room._id);
  const pendingCounts = await BookingRequest.aggregate([
    { $match: { room: { $in: roomIds }, status: 'PENDING' } },
    { $group: { _id: '$room', count: { $sum: 1 } } },
  ]);
  const pendingMap = new Map(pendingCounts.map((entry) => [String(entry._id), entry.count]));

  res.json({
    success: true,
    data: rooms.map((room) => ({
      ...sanitizeRoom(room, { revealContact: true }),
      pendingRequests: pendingMap.get(String(room._id)) || 0,
    })),
  });
});

export const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate('owner', 'name avatar createdAt');
  if (!room) throw new ApiError(404, 'Room not found');

  const isOwnerOfRoom = req.user && String(room.owner._id) === String(req.user._id);

  let myRequestStatus = null;
  let contactRevealed = Boolean(isOwnerOfRoom);
  let isWishlisted = false;

  if (req.user && !isOwnerOfRoom) {
    const booking = await BookingRequest.findOne({
      room: room._id,
      renter: req.user._id,
      status: { $in: ['PENDING', 'ACCEPTED', 'REJECTED'] },
    })
      .sort({ createdAt: -1 })
      .select('status');

    myRequestStatus = booking?.status || null;
    contactRevealed = booking?.status === 'ACCEPTED';

    if (req.user.role === 'RENTER') {
      isWishlisted = Boolean(
        await Wishlist.exists({ renter: req.user._id, rooms: room._id })
      );
    }
  }

  res.json({
    success: true,
    data: {
      room: sanitizeRoom(room, { revealContact: contactRevealed }),
      isOwner: Boolean(isOwnerOfRoom),
      myRequestStatus,
      contactRevealed,
      isWishlisted,
    },
  });
});

export const createRoom = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0)
    throw new ApiError(422, 'At least one image is required');

  const payload = parseRoomPayload(req.body);
  payload.owner = req.user._id;

  const images = await uploadImages(req.files, `room-rental-app/${req.user._id}`);
  payload.images = images;

  if (payload.contactNumber === '' ) delete payload.contactNumber;

  const room = await Room.create(payload);

  const cityRegex = new RegExp(`^${escapeRegex(room.city)}$`, 'i');
  const renters = await User.find({
    role: 'RENTER',
    city: cityRegex,
    _id: { $ne: req.user._id },
  }).select('_id');

  notifyUsers(
    renters.map((renter) => renter._id),
    {
      title: `New room in ${room.city}`,
      body: `${room.title} at \u20B9${Number(room.price).toLocaleString('en-IN')}/month just got listed`,
      type: 'NEW_ROOM_IN_CITY',
      meta: { roomId: String(room._id), link: `/rooms/${room._id}` },
    }
  );

  try {
    const matches = await matchSavedSearches({
      city: room.city,
      price: Number(room.price),
      roomType: room.roomType,
    });
    const matchedUserIds = matches
      .map((match) => String(match.user))
      .filter((id) => id !== String(req.user._id) && !renters.some((r) => String(r._id) === id));

    notifyUsers(matchedUserIds, {
      title: 'Match found for your saved search',
      body: `${room.title} at \u20B9${Number(room.price).toLocaleString('en-IN')}/month in ${room.city}`,
      type: 'SAVED_SEARCH_MATCH',
      meta: { roomId: String(room._id), link: `/rooms/${room._id}` },
    });
  } catch (error) {
    console.error(`[saved-search] match failed: ${error.message}`);
  }

  res.status(201).json({ success: true, data: sanitizeRoom(room, { revealContact: true }) });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw new ApiError(404, 'Room not found');

  if (String(room.owner) !== String(req.user._id))
    throw new ApiError(403, 'You can only edit your own listings');

  const payload = parseRoomPayload(req.body, { partial: true });

  let images = [...room.images];

  if (req.files && req.files.length > 0) {
    const uploaded = await uploadImages(req.files, `room-rental-app/${req.user._id}`);
    images = [...images, ...uploaded];
  }

  if (req.body.keepImages !== undefined && req.body.keepImages !== '') {
    let keepIds = [];
    try {
      keepIds = JSON.parse(str(req.body.keepImages));
    } catch {}
    if (!Array.isArray(keepIds)) throw new ApiError(422, 'keepImages must be an array of image ids');

    const keptImages = keepIds
      .map((publicId) => images.find((img) => img.public_id === publicId))
      .filter(Boolean);

    const removedImages = images.filter((img) => !keepIds.includes(img.public_id));
    await Promise.allSettled(removedImages.map((img) => deleteImage(img.public_id)));

    images = keptImages;
  }

  if (images.length === 0) throw new ApiError(422, 'At least one image is required');
  if (images.length > 10) throw new ApiError(422, 'Maximum 10 images allowed per listing');

  payload.images = images;

  Object.assign(room, payload);
  await room.save();

  res.json({ success: true, data: sanitizeRoom(room, { revealContact: true }) });
});

export const toggleAvailability = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
  if (!room) throw new ApiError(404, 'Room not found');

  room.isAvailable = !room.isAvailable;
  await room.save();

  res.json({
    success: true,
    message: `Listing marked ${room.isAvailable ? 'available' : 'booked'}`,
    data: sanitizeRoom(room, { revealContact: true }),
  });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw new ApiError(404, 'Room not found');

  if (String(room.owner) !== String(req.user._id))
    throw new ApiError(403, 'You can only delete your own listings');

  await Promise.allSettled(room.images.map((img) => deleteImage(img.public_id)));
  await BookingRequest.updateMany(
    { room: room._id, status: 'PENDING' },
    { status: 'REJECTED' }
  );
  await room.deleteOne();

  res.json({ success: true, message: 'Listing deleted successfully' });
});
