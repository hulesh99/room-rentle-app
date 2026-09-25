import { apiSlice } from './apiSlice';

export const roomsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query({
      query: (params) => ({ url: '/rooms', params }),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((room) => ({ type: 'Room', id: room._id })),
              { type: 'Room', id: 'LIST' },
            ]
          : [{ type: 'Room', id: 'LIST' }],
    }),
    getRoomById: builder.query({
      query: (id) => ({ url: `/rooms/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Room', id }],
    }),
    getMyRooms: builder.query({
      query: () => ({ url: '/rooms/owner/my-rooms' }),
      providesTags: [{ type: 'Room', id: 'MINE' }],
    }),
    createRoom: builder.mutation({
      query: (formData) => ({ url: '/rooms', method: 'POST', body: formData }),
      invalidatesTags: [
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: 'MINE' },
      ],
    }),
    updateRoom: builder.mutation({
      query: ({ id, formData }) => ({ url: `/rooms/${id}`, method: 'PUT', body: formData }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Room', id },
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: 'MINE' },
      ],
    }),
    toggleAvailability: builder.mutation({
      query: (id) => ({ url: `/rooms/${id}/availability`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Room', id },
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: 'MINE' },
      ],
    }),
    deleteRoom: builder.mutation({
      query: (id) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Room', id },
        { type: 'Room', id: 'LIST' },
        { type: 'Room', id: 'MINE' },
      ],
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useGetRoomByIdQuery,
  useGetMyRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useToggleAvailabilityMutation,
  useDeleteRoomMutation,
} = roomsApi;
