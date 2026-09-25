import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/services/axiosBaseQuery';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: '' }),
  tagTypes: ['Room', 'Booking', 'Chat', 'Notification', 'Wishlist', 'SavedSearch'],
  endpoints: () => ({}),
});
