import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Loader from './Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking session" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
