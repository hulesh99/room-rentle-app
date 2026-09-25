import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  onlineUserIds: [],
  typing: {},
  unreadCounts: {},
  activeChatId: null,
  call: {
    status: 'idle',
    role: null,
    peer: null,
    callType: null,
    channelName: null,
    error: null,
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    presenceUpdated(state, action) {
      state.onlineUserIds = action.payload.onlineUserIds || [];
    },
    setActiveChat(state, action) {
      const chatId = action.payload;
      state.activeChatId = chatId;
      if (chatId) state.unreadCounts[chatId] = 0;
    },
    clearUnread(state, action) {
      state.unreadCounts[action.payload] = 0;
    },
    messageReceived(state, action) {
      const msg = action.payload;
      if (!msg.fromSelf && msg.chatId !== state.activeChatId) {
        state.unreadCounts[msg.chatId] = (state.unreadCounts[msg.chatId] || 0) + 1;
      }
    },
    userTyping(state, action) {
      const { chatId, userId, isTyping } = action.payload;
      const key = `${chatId}:${userId}`;
      if (isTyping) state.typing[key] = true;
      else delete state.typing[key];
    },
    incomingCallReceived(state, action) {
      const { fromUserId, callerName, callerAvatar, channelName, callType } = action.payload;
      state.call = {
        status: 'incoming',
        role: 'callee',
        peer: { id: fromUserId, name: callerName, avatar: callerAvatar },
        callType: callType || 'audio',
        channelName,
        error: null,
      };
    },
    outgoingCallStarted(state, action) {
      const { peer, channelName, callType } = action.payload;
      state.call = {
        status: 'ringing',
        role: 'caller',
        peer,
        callType,
        channelName,
        error: null,
      };
    },
    callResponseReceived(state, action) {
      if (state.call.status !== 'ringing') return;
      state.call.status = action.payload.accepted ? 'connecting' : 'declined';
    },
    callConnected(state) {
      if (['ringing', 'connecting'].includes(state.call.status)) {
        state.call.status = 'active';
      }
    },
    callTerminated(state) {
      state.call = initialState.call;
    },
    setCallError(state, action) {
      state.call.error = action.payload;
    },
    resetChatState() {
      return initialState;
    },
  },
});

export const {
  presenceUpdated,
  setActiveChat,
  clearUnread,
  messageReceived,
  userTyping,
  incomingCallReceived,
  outgoingCallStarted,
  callResponseReceived,
  callConnected,
  callTerminated,
  setCallError,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;

export const selectTotalUnread = (state) =>
  Object.values(state.chat.unreadCounts).reduce((sum, count) => sum + count, 0);
