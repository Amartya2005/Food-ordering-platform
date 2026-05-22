import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import RoleHomeRedirect from './components/RoleHomeRedirect.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import Cart from './pages/customer/Cart.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import CustomerHome from './pages/customer/CustomerHome.jsx';
import OrderTracking from './pages/customer/OrderTracking.jsx';
import Profile from './pages/customer/Profile.jsx';
import RestaurantDetails from './pages/customer/RestaurantDetails.jsx';
import RestaurantList from './pages/customer/RestaurantList.jsx';
import OwnerDashboard from './pages/owner/OwnerDashboard.jsx';
import OwnerMenu from './pages/owner/OwnerMenu.jsx';
import OwnerOrders from './pages/owner/OwnerOrders.jsx';
import OwnerRestaurant from './pages/owner/OwnerRestaurant.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminRestaurants from './pages/admin/AdminRestaurants.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/go" element={<RoleHomeRedirect />} />

        <Route element={<RoleRoute allowedRoles={['customer']} />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<CustomerHome />} />
            <Route path="/restaurants" element={<RestaurantList />} />
            <Route path="/restaurants/:id" element={<RestaurantDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders/:id" element={<OrderTracking />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['restaurant']} />}>
          <Route element={<AppShell />}>
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/restaurant" element={<OwnerRestaurant />} />
            <Route path="/owner/menu" element={<OwnerMenu />} />
            <Route path="/owner/orders" element={<OwnerOrders />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/go" replace />} />
    </Routes>
  );
}
