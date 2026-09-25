import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import { notifyUsers } from '../utils/sendPushNotification.js';

const onlineUsers = new Map();

export const isUserOnline = (userId) => onlineUsers.has(String(userId));

export const isUserViewingChat = (userId, chatId) => {
  const sockets = onlineUsers.get(String(userId));
  if (!sockets) return false;
  return [...sockets].some((socketId) => {
    const data = io?.sockets.sockets.get(socketId)?.data;
    return data?.pageVisible === true && data.activeChatId === String(chatId);
  });
};

let io = null;

const emitPresence = (io) => {
  io.emit('presence', { onlineUserIds: [...onlineUsers.keys()] });
};

export const emitToParticipants = (io, participants, event, payload, exceptUserId = null) => {
  participants.forEach((participant) => {
    const id = String(participant);
    if (exceptUserId && id === String(exceptUserId)) return;
    io.to(`user:${id}`).emit(event, payload);
  });
};

export const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    const sockets = onlineUsers.get(socket.userId) || new Set();
    sockets.add(socket.id);
    onlineUsers.set(socket.userId, sockets);
    emitPresence(io);

    socket.on('page_visibility', ({ visible } = {}) => {
      socket.data.pageVisible = visible === true;
    });

    socket.on('chat_open', ({ chatId } = {}) => {
      if (chatId) socket.data.activeChatId = String(chatId);
    });

    socket.on('chat_close', ({ chatId } = {}) => {
      if (!chatId || socket.data.activeChatId === String(chatId)) {
        socket.data.activeChatId = null;
      }
    });

    socket.on('send_message', async ({ chatId, content } = {}, ack) => {
      try {
        if (!chatId || !content || !String(content).trim()) {
          return ack?.({ success: false, message: 'chatId and content are required' });
        }
        const trimmed = String(content).trim().slice(0, 2000);

        const chat = await ChatRoom.findById(chatId);
        if (!chat) return ack?.({ success: false, message: 'Chat not found' });
        if (!chat.participants.some((p) => String(p) === String(socket.userId))) {
          return ack?.({ success: false, message: 'You are not a participant of this chat' });
        }

        const message = await Message.create({
          chatRoom: chat._id,
          sender: socket.userId,
          content: trimmed,
        });
        chat.lastMessage = { content: trimmed, sender: socket.userId, sentAt: message.createdAt };
        await chat.save();
        await message.populate('sender', 'name avatar');

        const payload = { ...message.toObject(), chatId };
        emitToParticipants(io, chat.participants, 'new_message', payload);

        chat.participants
          .map((p) => String(p))
          .filter((id) => id !== String(socket.userId))
          .forEach((recipientId) => {
            if (isUserOnline(recipientId) && isUserViewingChat(recipientId, chatId)) return;
            notifyUsers([recipientId], {
              title: `New message from ${message.sender?.name || 'someone'}`,
              body: trimmed.slice(0, 120),
              type: 'NEW_MESSAGE',
              meta: {
                chatId: String(chat._id),
                roomId: String(chat.room),
                link: `/chat/${chat._id}`,
              },
            });
          });

        ack?.({ success: true, data: payload });
      } catch (error) {
        ack?.({ success: false, message: error.message });
      }
    });

    socket.on('message_seen', async ({ chatId } = {}) => {
      try {
        if (!chatId) return;
        const chat = await ChatRoom.findById(chatId).select('participants');
        if (!chat || !chat.participants.some((p) => String(p) === String(socket.userId))) return;

        const seenResult = await Message.updateMany(
          { chatRoom: chatId, sender: { $ne: socket.userId }, seen: false },
          { seen: true }
        );
        if (seenResult.modifiedCount === 0) return;

        emitToParticipants(
          io,
          chat.participants,
          'messages_seen',
          { chatId, seenBy: socket.userId },
          socket.userId
        );
      } catch (error) {
        console.error('[socket] message_seen error:', error.message);
      }
    });

    socket.on('typing', async ({ chatId, isTyping } = {}) => {
      if (!chatId) return;
      try {
        const chat = await ChatRoom.findById(chatId).select('participants');
        if (!chat || !chat.participants.some((p) => String(p) === String(socket.userId))) return;
        emitToParticipants(
          io,
          chat.participants,
          'user_typing',
          { chatId, userId: socket.userId, isTyping: Boolean(isTyping) },
          socket.userId
        );
      } catch {}
    });

    socket.on('call_user', ({ toUserId, ...payload } = {}) => {
      if (!toUserId) return;
      io.to(`user:${toUserId}`).emit('incoming_call', { fromUserId: socket.userId, ...payload });
    });

    socket.on('call_response', ({ toUserId, accepted } = {}) => {
      if (!toUserId) return;
      io.to(`user:${toUserId}`).emit('call_response', { fromUserId: socket.userId, accepted: Boolean(accepted) });
    });

    socket.on('call_ended', ({ toUserId } = {}) => {
      if (!toUserId) return;
      io.to(`user:${toUserId}`).emit('call_ended', { fromUserId: socket.userId });
    });

    socket.on('call_cancelled', ({ toUserId } = {}) => {
      if (!toUserId) return;
      io.to(`user:${toUserId}`).emit('call_cancelled', { fromUserId: socket.userId });
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(socket.userId);
          emitPresence(io);
        }
      }
    });
  });

  return io;
};
