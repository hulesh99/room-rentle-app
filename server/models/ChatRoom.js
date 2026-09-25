import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ 'lastMessage.sentAt': -1 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;
