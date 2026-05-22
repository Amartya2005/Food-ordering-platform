import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import OrderProgress from '../../components/OrderProgress.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { orderService } from '../../services/orderService.js';
import { currency, getId } from '../../utils/format.js';

export default function OrderTracking() {
  const { id } = useParams();
  const location = useLocation();
  const { on } = useSocket();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  useEffect(() => {
    async function load() {
      if (order) return;

      try {
        const data = await orderService.getById(id);
        setOrder(data || null);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, order]);

  useEffect(() => {
    function applyUpdate(updatedOrder) {
      const updatedId = getId(updatedOrder?.order || updatedOrder);
      if (updatedId !== id) return;
      const nextOrder = updatedOrder.order || updatedOrder;
      setOrder((current) => ({ ...current, ...nextOrder }));
      toast.success('Order status updated');
    }

    const offStatus = on('order:statusUpdated', applyUpdate);

    return () => {
      offStatus?.();
    };
  }, [id, on]);

  if (loading) return <Loader label="Tracking order" />;

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        message="Open your order history after placing an order."
        action={
          <Link className="primary-button compact" to="/">
            Go home
          </Link>
        }
      />
    );
  }

  return (
    <section className="page-section narrow">
      <div className="section-header">
        <div>
          <small>Live order tracking</small>
          <h2>Order #{String(getId(order)).slice(-6)}</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="panel">
        <OrderProgress status={order.status} />
      </div>

      <div className="summary-panel">
        <h3>Order details</h3>
        {(order.items || []).map((item, index) => (
          <p key={`${item.menuItemId || item.id || index}`}>
            <span>
              {item.quantity} x {item.name || item.menuItemName || 'Item'}
            </span>
            <strong>{currency(Number(item.price || 0) * Number(item.quantity || 1))}</strong>
          </p>
        ))}
        <p className="total">
          <span>Total</span>
          <strong>{currency(order.totalAmount || order.total)}</strong>
        </p>
      </div>
    </section>
  );
}
