import Notification from '../models/Notification.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    page,
    totalPages: Math.ceil(total / limit),
    total,
    unreadCount,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, data: { count } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new ApiError(404, 'Notification not found');

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, data: notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) throw new ApiError(404, 'Notification not found');

  res.json({ success: true, message: 'Notification deleted' });
});

export const saveFcmToken = asyncHandler(async (req, res) => {
  const { token, device = 'web' } = req.body;
  if (!token) throw new ApiError(422, 'FCM token is required');

  // One browser push subscription belongs to one signed-in account at a time.
  // This matters when an owner and renter are tested sequentially in one browser.
  await User.updateMany(
    { _id: { $ne: req.user._id }, 'fcmTokens.token': token },
    { $pull: { fcmTokens: { token } } }
  );

  const user = await User.findById(req.user._id).select('fcmTokens');
  const exists = user.fcmTokens.some((entry) => entry.token === token);

  if (process.env.NODE_ENV !== 'production') {
    const fingerprint = token.length > 20
      ? `${token.slice(0, 10)}...${token.slice(-8)}`
      : '(invalid/short token)';
    console.info(`[FCM] Token received for user ${req.user._id}: ${fingerprint} (${exists ? 'existing' : 'new'})`);
  }

  if (!exists) {
    user.fcmTokens.push({ token, device });
    if (user.fcmTokens.length > 10) {
      user.fcmTokens = user.fcmTokens.slice(-10);
    }
    await user.save();
  }

  res.json({ success: true, message: 'Device registered for notifications' });
});
