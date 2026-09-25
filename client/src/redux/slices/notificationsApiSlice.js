import { apiSlice } from './apiSlice';

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/notifications',
        params: { page, limit },
      }),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    getUnreadCount: builder.query({
      query: () => ({ url: '/notifications/unread-count' }),
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
    }),
    saveFcmToken: builder.mutation({
      query: (body) => ({ url: '/notifications/save-token', method: 'POST', body }),
    }),
    markAsRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PUT' }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useSaveFcmTokenMutation,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
