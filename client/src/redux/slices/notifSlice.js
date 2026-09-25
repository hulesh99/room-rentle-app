import { createSlice } from '@reduxjs/toolkit';
import { notificationsApi } from './notificationsApiSlice';

const initialState = {
  unreadCount: 0,
  drawerOpen: false,
};

const notifSlice = createSlice({
  name: 'notif',
  initialState,
  reducers: {
    toggleDrawer(state, action) {
      state.drawerOpen = action.payload ?? !state.drawerOpen;
    },
    bumpUnread(state) {
      state.unreadCount += 1;
    },
    resetNotifState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(notificationsApi.endpoints.getUnreadCount.matchFulfilled, (state, action) => {
        state.unreadCount = action.payload.data.count;
      })
      .addMatcher(
        notificationsApi.endpoints.getNotifications.matchFulfilled,
        (state, action) => {
          state.unreadCount = action.payload.unreadCount;
        }
      );
  },
});

export const { toggleDrawer, bumpUnread, resetNotifState } = notifSlice.actions;
export default notifSlice.reducer;

export const selectUnreadCount = (state) => state.notif.unreadCount;
