import { apiSlice } from './apiSlice';

export const savedSearchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSavedSearches: builder.query({
      query: () => ({ url: '/saved-searches' }),
      providesTags: [{ type: 'SavedSearch', id: 'LIST' }],
    }),
    createSavedSearch: builder.mutation({
      query: (body) => ({ url: '/saved-searches', method: 'POST', body }),
      invalidatesTags: [{ type: 'SavedSearch', id: 'LIST' }],
    }),
    deleteSavedSearch: builder.mutation({
      query: (id) => ({ url: `/saved-searches/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'SavedSearch', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetSavedSearchesQuery,
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
} = savedSearchApi;
