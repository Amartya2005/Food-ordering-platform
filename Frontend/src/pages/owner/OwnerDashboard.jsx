import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { orderService } from '../../services/orderService.js';
import { restaurantService } from '../../services/restaurantService.js';
import { asArray, currency, getId, orderStatuses } from '../../utils/format.js';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { joinRestaurantRoom, leaveRestaurantRoom, on } = useSocket();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ownedRestaurants = await restaurantService.listOwned(user?.id);
        const restaurantIds = ownedRestaurants.map(getId).filter(Boolean);
        setRestaurants(ownedRestaurants);

        if (!restaurantIds.length) {
          setOrders([]);
          return;
        }

        const orderData = await orderService.restaurantOrdersForRestaurants(restaurantIds);
        setOrders(asArray(orderData));
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id]);

  useEffect(() => {
    const restaurantIds = restaurants.map(getId).filter(Boolean);

    restaurantIds.forEach((restaurantId) => joinRestaurantRoom(restaurantId));

    return () => {
      restaurantIds.forEach((restaurantId) => leaveRestaurantRoom(restaurantId));
    };
  }, [joinRestaurantRoom, leaveRestaurantRoom, restaurants]);

  useEffect(() => {
    function upsertOrder(payload) {
      const order = payload.order || payload;
      if (!getId(order)) return;

      setOrders((current) => {
        const exists = current.some((item) => getId(item) === getId(order));
        return exists ? current.map((item) => (getId(item) === getId(order) ? { ...item, ...order } : item)) : [order, ...current];
      });
    }

    const offNew = on('restaurant:newOrder', upsertOrder);
    const offStatus = on('restaurant:orderStatusUpdated', upsertOrder);

    return () => {
      offNew?.();
      offStatus?.();
    };
  }, [on]);

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || order.total || 0), 0);
    const byStatus = orderStatuses.reduce((acc, status) => {
      acc[status] = orders.filter((order) => order.status === status).length;
      return acc;
    }, {});

    return { revenue, byStatus };
  }, [orders]);

  if (loading) return <Loader label="Loading dashboard" />;

  return (
    <section className="page-section">
      <div className="metrics-grid">
        <article className="metric-card">
          <small>Restaurants</small>
          <strong>{restaurants.length}</strong>
        </article>
        <article className="metric-card">
          <small>Total orders</small>
          <strong>{orders.length}</strong>
        </article>
        <article className="metric-card">
          <small>Revenue</small>
          <strong>{currency(stats.revenue)}</strong>
        </article>
        <article className="metric-card">
          <small>Active orders</small>
          <strong>{orders.filter((order) => order.status !== 'Delivered').length}</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Status overview</h2>
          <div className="status-bars">
            {orderStatuses.map((status) => (
              <div key={status}>
                <span>{status}</span>
                <div>
                  <i style={{ width: `${Math.min(100, stats.byStatus[status] * 20)}%` }} />
                </div>
                <strong>{stats.byStatus[status]}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Latest orders</h2>
          <div className="compact-list">
            {orders.slice(0, 6).map((order) => (
              <article key={getId(order)}>
                <div>
                  <strong>Order #{String(getId(order)).slice(-6)}</strong>
                  <small>{currency(order.totalAmount || order.total)}</small>
                </div>
                <StatusBadge status={order.status} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
