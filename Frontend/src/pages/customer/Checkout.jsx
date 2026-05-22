import { useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { orderService } from '../../services/orderService.js';
import { currency, getId } from '../../utils/format.js';

export default function Checkout() {
  const navigate = useNavigate();
  const { restaurant, items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState({
    address: '',
    phone: '',
    paymentMethod: 'cod',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!items.length) return <Navigate to="/cart" replace />;

  const deliveryFee = 40;
  const tax = subtotal * 0.05;
  const totalAmount = subtotal + deliveryFee + tax;

  async function submitOrder(event) {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      restaurantId: getId(restaurant),
      items: items.map((item) => ({
        menuItemId: getId(item),
        quantity: item.quantity
      }))
    };

    try {
      const order = await orderService.place(payload);
      clearCart();
      toast.success('Order placed');
      navigate(`/orders/${getId(order)}`, { state: { order } });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Checkout</small>
          <h2>Delivery details</h2>
        </div>
      </div>

      <div className="checkout-grid">
        <form className="panel stack" onSubmit={submitOrder}>
          <label>
            Delivery address
            <textarea
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="House number, street, landmark"
              required
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="9876543210"
              required
            />
          </label>
          <label>
            Payment method
            <select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>
              <option value="cod">Cash on delivery</option>
              <option value="online">Online payment</option>
            </select>
          </label>
          <label>
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Less spicy, no onion, etc." />
          </label>
          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Placing order...' : `Place order - ${currency(totalAmount)}`}
          </button>
        </form>

        <aside className="summary-panel">
          <h3>Order summary</h3>
          {items.map((item) => (
            <p key={getId(item)}>
              <span>
                {item.quantity} x {item.name}
              </span>
              <strong>{currency(Number(item.price || 0) * item.quantity)}</strong>
            </p>
          ))}
          <p className="total">
            <span>Total</span>
            <strong>{currency(totalAmount)}</strong>
          </p>
        </aside>
      </div>
    </section>
  );
}
