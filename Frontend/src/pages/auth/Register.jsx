import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { normalizeRole } from '../../utils/format.js';

function routeFor(role) {
  if (role === 'admin') return '/admin';
  if (role === 'restaurant') return '/owner';
  return '/';
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'customer'
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = await register(form);
      toast.success('Account created');
      navigate(routeFor(normalizeRole(user?.role)), { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-mark">
          <ChefHat size={30} />
        </div>
        <h1>Create account</h1>
        <p>Choose your role and start using the platform.</p>

        <form onSubmit={handleSubmit} className="stack">
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="John Doe"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="At least 8 characters with upper, lower, number, and symbol"
              required
            />
          </label>
          <label>
            Address
            <textarea
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="House number, street, landmark"
              required
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="customer">Customer</option>
              <option value="restaurant_owner">Restaurant owner</option>
            </select>
          </label>
          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
