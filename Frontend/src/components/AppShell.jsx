import { BarChart3, ClipboardList, Home, LogOut, MenuSquare, Search, Shield, ShoppingCart, Store, User } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { userName } from '../utils/format.js';

const navItems = {
  customer: [
    { to: '/', label: 'Home', icon: Home },
    { to: '/restaurants', label: 'Search', icon: Search },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
    { to: '/profile', label: 'Profile', icon: User }
  ],
  restaurant: [
    { to: '/owner', label: 'Dashboard', icon: Home },
    { to: '/owner/restaurant', label: 'Restaurant', icon: Store },
    { to: '/owner/menu', label: 'Menu', icon: MenuSquare },
    { to: '/owner/orders', label: 'Orders', icon: ClipboardList }
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: Shield },
    { to: '/admin/users', label: 'Users', icon: User },
    { to: '/admin/restaurants', label: 'Restaurants', icon: Store },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
  ]
};

export default function AppShell() {
  const { user, role, logout } = useAuth();
  const { count } = useCart();
  const { connected } = useSocket();
  const items = navItems[role] || navItems.customer;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>DA</span>
          <div>
            <strong>Del App</strong>
            <small>{role}</small>
          </div>
        </div>

        <nav>
          {items.map((item) => {
            const Icon = item.icon;
            const badge = item.to === '/cart' && count > 0 ? count : null;

            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/' || item.to === '/owner' || item.to === '/admin'}>
                <Icon size={18} />
                <span>{item.label}</span>
                {badge ? <em>{badge}</em> : null}
              </NavLink>
            );
          })}
        </nav>

        <button className="logout-button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <small>Welcome back</small>
            <h1>{userName(user)}</h1>
          </div>
          <span className={`live-pill ${connected ? 'online' : ''}`}>{connected ? 'Live' : 'Offline'}</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
