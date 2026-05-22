import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const roleHome = {
  customer: '/',
  restaurant: '/owner',
  admin: '/admin'
};

export default function RoleRoute({ allowedRoles }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to={roleHome[role] || '/login'} replace />;
  }

  return <Outlet />;
}
