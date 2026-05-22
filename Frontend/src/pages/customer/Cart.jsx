import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { currency, getId, imageOf } from '../../utils/format.js';

export default function Cart() {
  const { restaurant, items, subtotal, updateQuantity, removeItem } = useCart();
  const deliveryFee = items.length ? 40 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  if (!items.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Add food from a restaurant to start checkout."
        action={
          <Link className="primary-button compact" to="/restaurants">
            Browse restaurants
          </Link>
        }
      />
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Cart</small>
          <h2>{restaurant?.name || 'Your order'}</h2>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="wide-list">
          {items.map((item) => (
            <article className="cart-row" key={getId(item)}>
              <img src={imageOf(item)} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>{currency(item.price)}</p>
              </div>
              <div className="quantity-control">
                <button onClick={() => updateQuantity(getId(item), item.quantity - 1)} disabled={item.quantity <= 1}>
                  <Minus size={15} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(getId(item), item.quantity + 1)}>
                  <Plus size={15} />
                </button>
              </div>
              <button className="icon-button danger" onClick={() => removeItem(getId(item))} aria-label={`Remove ${item.name}`}>
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>

        <aside className="summary-panel">
          <h3>Bill summary</h3>
          <p>
            <span>Subtotal</span>
            <strong>{currency(subtotal)}</strong>
          </p>
          <p>
            <span>Delivery</span>
            <strong>{currency(deliveryFee)}</strong>
          </p>
          <p>
            <span>Tax</span>
            <strong>{currency(tax)}</strong>
          </p>
          <p className="total">
            <span>Total</span>
            <strong>{currency(total)}</strong>
          </p>
          <Link className="primary-button" to="/checkout">
            Checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}
