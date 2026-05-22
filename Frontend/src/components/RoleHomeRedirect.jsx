import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleHomeRedirect() {
  const { role } = useAuth();

  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'restaurant') return <Navigate to="/owner" replace />;
  return <Navigate to="/" replace />;
}
