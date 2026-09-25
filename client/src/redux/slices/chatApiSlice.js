import { apiSlice } from './apiSlice';

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChatRooms: builder.query({
      query: () => ({ url: '/chat/rooms' }),
      providesTags: [{ type: 'Chat', id: 'LIST' }],
    }),
    getMessages: builder.query({
      query: ({ chatRoomId, page = 1 }) => ({
        url: `/chat/${chatRoomId}/messages`,
        params: { page },
      }),
      providesTags: (result, error, { chatRoomId }) => [{ type: 'Chat', id: chatRoomId }],
    }),
    getOlderMessages: builder.query({
      query: ({ chatRoomId, page }) => ({
        url: `/chat/${chatRoomId}/messages`,
        params: { page },
      }),
    }),
    sendMessageRest: builder.mutation({
      query: ({ chatRoomId, content }) => ({
        url: '/chat/send',
        method: 'POST',
        body: { chatRoomId, content },
      }),
      invalidatesTags: (result, error, { chatRoomId }) => [
        { type: 'Chat', id: chatRoomId },
        { type: 'Chat', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useGetMessagesQuery,
  useGetOlderMessagesQuery,
  useLazyGetOlderMessagesQuery,
  useSendMessageRestMutation,
} = chatApi;
