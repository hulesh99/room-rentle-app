import { useSelector } from 'react-redux';

export function useAuth() {
  const { user, accessToken, status, initialized, error } = useSelector((state) => state.auth);

  return {
    user,
    accessToken,
    status,
    initialized,
    error,
    isAuthenticated: Boolean(user && accessToken),
    isOwner: user?.role === 'OWNER',
    isRenter: user?.role === 'RENTER',
  };
}
