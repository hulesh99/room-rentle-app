import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dashboardPath } from '@/utils/helpers';

export const ProtectedRoute = ({ roles }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const user = useSelector((state) => state.auth.user);

  if (user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
