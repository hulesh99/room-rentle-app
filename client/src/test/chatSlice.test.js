import { describe, expect, it } from 'vitest';
import chatReducer, {
  messageReceived,
  clearUnread,
  setActiveChat,
} from '@/redux/slices/chatSlice';
import { selectTotalUnread } from '@/redux/slices/chatSlice';

describe('chatSlice', () => {
  const baseState = {
    onlineUserIds: [],
    typing: {},
    unreadCounts: {},
    activeChatId: null,
    call: { status: 'idle', role: null, peer: null, callType: null, channelName: null, error: null },
  };

  it('increments unread count for a non-active chat', () => {
    let state = chatReducer(baseState, messageReceived({ chatId: 'c1', fromSelf: false }));
    state = chatReducer(state, messageReceived({ chatId: 'c1', fromSelf: false }));
    expect(state.unreadCounts.c1).toBe(2);
    expect(selectTotalUnread({ chat: state })).toBe(2);
  });

  it('ignores messages sent by yourself', () => {
    const state = chatReducer(baseState, messageReceived({ chatId: 'c1', fromSelf: true }));
    expect(state.unreadCounts.c1).toBeUndefined();
  });

  it('clears unread when the chat becomes active', () => {
    let state = chatReducer(baseState, messageReceived({ chatId: 'c1', fromSelf: false }));
    state = chatReducer(state, setActiveChat('c1'));
    expect(state.unreadCounts.c1).toBe(0);
  });

  it('clearUnread resets the counter', () => {
    let state = chatReducer(baseState, messageReceived({ chatId: 'c1', fromSelf: false }));
    state = chatReducer(state, clearUnread('c1'));
    expect(state.unreadCounts.c1).toBe(0);
  });
});
