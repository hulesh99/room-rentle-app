import { apiSlice } from './apiSlice';

export const wishlistApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query({
      query: () => ({ url: '/wishlist' }),
      providesTags: [{ type: 'Wishlist', id: 'MINE' }],
    }),
    toggleWishlistRoom: builder.mutation({
      query: (roomId) => ({
        url: `/wishlist/${roomId}/toggle`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Wishlist', id: 'MINE' }],
    }),
  }),
});

export const { useGetWishlistQuery, useToggleWishlistRoomMutation } = wishlistApi;
