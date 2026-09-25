import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { isPushConfigured, sendMulticast } from '../config/firebase-admin.js';

const INVALID_TOKEN_ERRORS = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

const buildMessage = ({ title, body, type, meta = {}, data = {} }) => {
  const pushData = { ...meta, ...data, type, title, body };
  return ({
  // Data-only messages let our service worker control display consistently.
  // Mixing `notification` payloads with showNotification can be browser-dependent
  // and may result in missing or duplicate notifications.
  data: Object.fromEntries(
    Object.entries(pushData).map(([key, value]) => [key, String(value ?? '')])
  ),
  webpush: {
    fcmOptions: { link: pushData.link || '/' },
    headers: { Urgency: 'high' },
  },
  });
};

export const notifyUsers = async (userIds, payload) => {
  try {
    const ids = [...new Set(userIds.filter(Boolean).map(String))];
    if (ids.length === 0) return;

    await Notification.insertMany(
      ids.map((id) => ({
        user: id,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        meta: payload.meta || {},
      }))
    );

    if (!isPushConfigured()) return;

    const users = await User.find({ _id: { $in: ids } }).select('fcmTokens');
    const tokenEntries = [];
    users.forEach((user) => {
      user.fcmTokens.forEach((entry) => {
        tokenEntries.push({ token: entry.token, userId: String(user._id) });
      });
    });

    if (tokenEntries.length === 0) return;

    const response = await sendMulticast(
      tokenEntries.map((entry) => entry.token),
      buildMessage(payload)
    );

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[push] Firebase accepted ${response?.successCount || 0}/${tokenEntries.length} token(s)`);
      response?.responses.forEach((result, index) => {
        if (!result.success) {
          console.warn(`[push] Token ${index + 1} failed: ${result.error?.code} ${result.error?.message}`);
        }
      });
    }

    const deadTokens = [];
    response?.responses.forEach((result, index) => {
      if (!result.success && INVALID_TOKEN_ERRORS.includes(result.error?.code)) {
        deadTokens.push(tokenEntries[index]);
      }
    });

    await Promise.allSettled(
      deadTokens.map(({ token, userId }) =>
        User.updateOne({ _id: userId }, { $pull: { fcmTokens: { token } } })
      )
    );
  } catch (error) {
    console.error(`[push] notifyUsers failed: ${error.message}`);
  }
};
