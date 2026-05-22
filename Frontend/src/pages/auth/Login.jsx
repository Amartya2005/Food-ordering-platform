import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { normalizeRole } from '../../utils/format.js';

function routeFor(role) {
  if (role === 'admin') return '/admin';
  if (role === 'restaurant') return '/owner';
  return '/';
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = await login(form);
      toast.success('Logged in successfully');
      navigate(location.state?.from?.pathname || routeFor(normalizeRole(user?.role)), { replace: true });
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
        <h1>Login</h1>
        <p>Access your food ordering dashboard.</p>

        <form onSubmit={handleSubmit} className="stack">
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
              placeholder="Your password"
              required
            />
          </label>
          <button className="primary-button" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create account</Link>
        </p>
      </section>
    </main>
  );
}
