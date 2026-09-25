import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { clearAccessToken, setAccessToken } from '@/services/api';

let bootstrapPromise = null;

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', payload);
      setAccessToken(data.accessToken);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to create account. Please try again'
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', payload);
      setAccessToken(data.accessToken);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to sign in');
    }
  }
);

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  if (!bootstrapPromise) {
    bootstrapPromise = api
      .post('/auth/refresh-token')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data;
      })
      .catch((error) => {
        clearAccessToken();
        throw error;
      });
  }
  return bootstrapPromise;
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {}
  clearAccessToken();
});

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Could not update profile');
    }
  }
);

const initialState = {
  user: null,
  accessToken: null,
  status: 'idle',
  initialized: false,
  error: null,
};

const applySession = (state, action) => {
  state.user = action.payload.user;
  state.accessToken = action.payload.accessToken;
  state.status = 'authenticated';
  state.error = null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, applySession)
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload || null;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, applySession)
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.error = action.payload || null;
      })
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        applySession(state, action);
        state.initialized = true;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'unauthenticated';
        state.initialized = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'unauthenticated';
        state.initialized = true;
        state.error = null;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.error = action.payload || null;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
