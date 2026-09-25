import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { emitToParticipants, isUserViewingChat } from '../socket/socketHandler.js';
import { notifyUsers } from '../utils/sendPushNotification.js';

const PAGE_SIZE = 30;

export const ensureChatRoom = async (roomId, renterId, ownerId) => {
  const existing = await ChatRoom.findOne({
    room: roomId,
    participants: { $all: [renterId, ownerId] },
  });
  if (existing) return existing;
  return ChatRoom.create({ room: roomId, participants: [renterId, ownerId] });
};

export const getChatRooms = asyncHandler(async (req, res) => {
  const chats = await ChatRoom.find({ participants: req.user._id })
    .populate({
      path: 'participants',
      select: 'name avatar',
    })
    .populate('room', 'title city price images')
    .sort({ updatedAt: -1 });

  const data = chats.map((chat) => {
    const other = chat.participants.find(
      (participant) => String(participant._id) !== String(req.user._id)
    );
    return {
      _id: chat._id,
      room: chat.room,
      otherParticipant: other || null,
      lastMessage: chat.lastMessage,
      updatedAt: chat.updatedAt,
    };
  });

  res.json({ success: true, data });
});

const assertMembership = async (chatRoomId, userId) => {
  const chat = await ChatRoom.findById(chatRoomId);
  if (!chat) throw new ApiError(404, 'Chat not found');
  if (!chat.participants.some((p) => String(p) === String(userId)))
    throw new ApiError(403, 'You are not a participant of this chat');
  return chat;
};

const persistAndBroadcast = async (io, chat, senderId, content) => {
  const message = await Message.create({
    chatRoom: chat._id,
    sender: senderId,
    content,
  });

  chat.lastMessage = { content, sender: senderId, sentAt: message.createdAt };
  await chat.save();

  await message.populate('sender', 'name avatar');

  if (io) {
    emitToParticipants(io, chat.participants, 'new_message', {
      ...message.toObject(),
      chatId: String(chat._id),
    });

    chat.participants
      .map((p) => String(p))
      .filter((id) => id !== String(senderId) && !isUserViewingChat(id, chat._id))
      .forEach((recipientId) => {
        notifyUsers([recipientId], {
          title: `New message from ${message.sender?.name || 'someone'}`,
          body: content.slice(0, 120),
          type: 'NEW_MESSAGE',
          meta: {
            chatId: String(chat._id),
            roomId: String(chat.room),
            link: `/chat/${chat._id}`,
          },
        });
      });
  }

  return message;
};

export const getMessages = asyncHandler(async (req, res) => {
  const { chatRoomId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || PAGE_SIZE);

  const chat = await assertMembership(chatRoomId, req.user._id);

  const [total, messages] = await Promise.all([
    Message.countDocuments({ chatRoom: chatRoomId }),
    Message.find({ chatRoom: chatRoomId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar'),
  ]);

  const seenResult = await Message.updateMany(
    { chatRoom: chatRoomId, sender: { $ne: req.user._id }, seen: false },
    { seen: true }
  );

  if (seenResult.modifiedCount > 0) {
    emitToParticipants(
      req.app.get('io'),
      chat.participants,
      'messages_seen',
      { chatId: chatRoomId, seenBy: String(req.user._id) },
      String(req.user._id)
    );
  }

  res.json({
    success: true,
    data: messages.reverse(),
    page,
    totalPages: Math.ceil(total / limit),
    total,
    roomId: chat.room,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { chatRoomId, content } = req.body;

  if (!chatRoomId) throw new ApiError(422, 'chatRoomId is required');
  const trimmed = String(content || '').trim();
  if (!trimmed) throw new ApiError(422, 'Message cannot be empty');
  if (trimmed.length > 2000) throw new ApiError(422, 'Message cannot exceed 2000 characters');

  const chat = await assertMembership(chatRoomId, req.user._id);
  const message = await persistAndBroadcast(req.app.get('io'), chat, req.user._id, trimmed);

  res.status(201).json({ success: true, data: message });
});
