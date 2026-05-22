import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import OrderProgress from '../../components/OrderProgress.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { orderService } from '../../services/orderService.js';
import { restaurantService } from '../../services/restaurantService.js';
import { asArray, currency, getId, orderStatuses } from '../../utils/format.js';

export default function OwnerOrders() {
  const { user } = useAuth();
  const { joinRestaurantRoom, leaveRestaurantRoom, on } = useSocket();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

        const data = await orderService.restaurantOrdersForRestaurants(restaurantIds);
        setOrders(asArray(data));
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

  async function changeStatus(order, status) {
    try {
      const updated = await orderService.updateStatus(getId(order), status);
      setOrders((current) => current.map((item) => (getId(item) === getId(order) ? { ...item, ...updated, status } : item)));
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.message);
    }
  }

  const visibleOrders = useMemo(() => {
    return filter === 'all' ? orders : orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Orders</small>
          <h2>Incoming orders</h2>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All statuses</option>
          {orderStatuses.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader label="Loading orders" />
      ) : visibleOrders.length === 0 ? (
        <EmptyState title="No orders" message="New orders will appear here instantly." />
      ) : (
        <div className="orders-grid">
          {visibleOrders.map((order) => (
            <article className="order-card" key={getId(order)}>
              <div className="card-title-row">
                <h3>Order #{String(getId(order)).slice(-6)}</h3>
                <StatusBadge status={order.status} />
              </div>
              <OrderProgress status={order.status} />
              <div className="order-items">
                {(order.items || []).map((item, index) => (
                  <span key={`${item.menuItemId || index}`}>
                    {item.quantity} x {item.name || item.menuItemName || 'Item'}
                  </span>
                ))}
              </div>
              <div className="card-title-row">
                <strong>{currency(order.totalAmount || order.total)}</strong>
                <select value={order.status || 'Received'} onChange={(event) => changeStatus(order, event.target.value)}>
                  {orderStatuses.map((status) => (
                    <option value={status} key={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
