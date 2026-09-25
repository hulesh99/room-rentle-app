import { apiSlice } from './apiSlice';

export const bookingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendBookingRequest: builder.mutation({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: (result, error, { roomId }) => [
        { type: 'Booking', id: 'SENT' },
        ...(roomId ? [{ type: 'Room', id: roomId }] : []),
      ],
    }),
    getReceivedRequests: builder.query({
      query: () => ({ url: '/bookings/received' }),
      providesTags: [{ type: 'Booking', id: 'RECEIVED' }],
    }),
    getSentRequests: builder.query({
      query: () => ({ url: '/bookings/sent' }),
      providesTags: [{ type: 'Booking', id: 'SENT' }],
    }),
    updateRequestStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/bookings/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { roomId }) => [
        { type: 'Booking', id: 'RECEIVED' },
        { type: 'Booking', id: 'SENT' },
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: 'MINE' },
        ...(roomId ? [{ type: 'Room', id: roomId }] : []),
      ],
    }),
    cancelBookingRequest: builder.mutation({
      query: ({ id }) => ({ url: `/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Booking', id: 'SENT' },
        { type: 'Room', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useSendBookingRequestMutation,
  useGetReceivedRequestsQuery,
  useGetSentRequestsQuery,
  useUpdateRequestStatusMutation,
  useCancelBookingRequestMutation,
} = bookingsApi;
