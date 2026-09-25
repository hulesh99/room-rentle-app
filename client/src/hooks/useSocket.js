import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiSlice } from '@/redux/slices/apiSlice';
import {
  presenceUpdated,
  setActiveChat,
  messageReceived,
  userTyping,
  incomingCallReceived,
  callResponseReceived,
  callTerminated,
  resetChatState,
} from '@/redux/slices/chatSlice';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';

export function useSocket() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const userId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (!accessToken || !userId) return undefined;

    const socket = connectSocket(accessToken);

    const syncVisibility = () => {
      socket.emit('page_visibility', { visible: document.visibilityState === 'visible' });
      dispatch((_, getState) => {
        const chatId = getState().chat.activeChatId;
        if (chatId) socket.emit('chat_open', { chatId });
      });
    };
    socket.on('connect', syncVisibility);
    document.addEventListener('visibilitychange', syncVisibility);
    if (socket.connected) syncVisibility();

    const invalidateChat = (chatId) => {
      dispatch(
        apiSlice.util.invalidateTags([
          { type: 'Chat', id: 'LIST' },
          { type: 'Chat', id: chatId },
        ])
      );
    };

    const onPresence = (payload) => dispatch(presenceUpdated(payload));

    const onNewMessage = (msg) => {
      const fromSelf = String(msg.sender?._id || msg.sender) === String(userId);
      dispatch(messageReceived({ ...msg, fromSelf }));
      if (!fromSelf) {
        dispatch((_, getState) => {
          const viewing = getState().chat.activeChatId === String(msg.chatId);
          if (!viewing) {
            dispatch(apiSlice.util.invalidateTags([{ type: 'Notification', id: 'COUNT' }]));
          }
        });
      }
      invalidateChat(msg.chatId);
    };

    const onMessagesSeen = ({ chatId } = {}) => {
      if (chatId) {
        dispatch(apiSlice.util.invalidateTags([{ type: 'Chat', id: chatId }]));
      }
    };

    const onUserTyping = (payload) => {
      dispatch(userTyping(payload));
      if (payload.isTyping) {
        setTimeout(() => dispatch(userTyping({ ...payload, isTyping: false })), 3000);
      }
    };

    const onIncomingCall = (payload) => dispatch(incomingCallReceived(payload));
    const onCallResponse = (payload) => dispatch(callResponseReceived(payload));
    const onCallEnded = () => dispatch(callTerminated());
    const onCallCancelled = () => dispatch(callTerminated());

    socket.on('presence', onPresence);
    socket.on('new_message', onNewMessage);
    socket.on('messages_seen', onMessagesSeen);
    socket.on('user_typing', onUserTyping);
    socket.on('incoming_call', onIncomingCall);
    socket.on('call_response', onCallResponse);
    socket.on('call_ended', onCallEnded);
    socket.on('call_cancelled', onCallCancelled);

    return () => {
      socket.off('connect', syncVisibility);
      document.removeEventListener('visibilitychange', syncVisibility);
      socket.off('presence', onPresence);
      socket.off('new_message', onNewMessage);
      socket.off('messages_seen', onMessagesSeen);
      socket.off('user_typing', onUserTyping);
      socket.off('incoming_call', onIncomingCall);
      socket.off('call_response', onCallResponse);
      socket.off('call_ended', onCallEnded);
      socket.off('call_cancelled', onCallCancelled);
      disconnectSocket();
      dispatch(resetChatState());
      dispatch(setActiveChat(null));
    };
  }, [accessToken, userId, dispatch]);
}
