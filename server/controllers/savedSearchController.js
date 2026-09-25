import SavedSearch from '../models/SavedSearch.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const MAX_SAVED_SEARCHES = 10;

const clean = (value, fallback = '') => (typeof value === 'string' ? value.trim() : fallback);

export const getSavedSearches = asyncHandler(async (req, res) => {
  const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: searches });
});

export const createSavedSearch = asyncHandler(async (req, res) => {
  const count = await SavedSearch.countDocuments({ user: req.user._id });
  if (count >= MAX_SAVED_SEARCHES)
    throw new ApiError(422, `You can save up to ${MAX_SAVED_SEARCHES} searches`);

  const city = clean(req.body.city);
  const roomType = clean(req.body.roomType).toUpperCase();
  const minPrice = req.body.minPrice === undefined || req.body.minPrice === '' ? null : Number(req.body.minPrice);
  const maxPrice = req.body.maxPrice === undefined || req.body.maxPrice === '' ? null : Number(req.body.maxPrice);

  if (!city && minPrice === null && maxPrice === null && !roomType)
    throw new ApiError(422, 'Add at least one filter before saving a search');

  let name = clean(req.body.name);
  if (!name) {
    const parts = [];
    if (city) parts.push(`in ${city}`);
    if (maxPrice) parts.push(`under \u20B9${Number(maxPrice).toLocaleString('en-IN')}`);
    if (minPrice) parts.push(`above \u20B9${Number(minPrice).toLocaleString('en-IN')}`);
    if (roomType) parts.push(roomType.charAt(0) + roomType.slice(1).toLowerCase());
    name = `Rooms ${parts.join(' ')}`.trim() || 'Saved search';
  }

  const search = await SavedSearch.create({
    user: req.user._id,
    name,
    city,
    minPrice,
    maxPrice,
    roomType,
  });

  res.status(201).json({ success: true, data: search });
});

export const deleteSavedSearch = asyncHandler(async (req, res) => {
  const search = await SavedSearch.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!search) throw new ApiError(404, 'Saved search not found');
  res.json({ success: true, message: 'Saved search removed' });
});

export const matchSavedSearches = async ({ city, price, roomType }) => {
  const escapedCity = String(city || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const emptyOrMissing = { $in: [null, ''] };

  const cityCondition = escapedCity
    ? { $or: [{ city: emptyOrMissing }, { city: new RegExp(`^${escapedCity}$`, 'i') }] }
    : { city: emptyOrMissing };

  const priceCondition =
    typeof price === 'number'
      ? { $or: [{ maxPrice: null }, { maxPrice: { $gte: price } }] }
      : { maxPrice: null };

  const conditions = [cityCondition, priceCondition];

  if (roomType) {
    conditions.push({ $or: [{ roomType: emptyOrMissing }, { roomType }] });
  }

  return SavedSearch.find({ $and: conditions }).select('user').lean();
};
