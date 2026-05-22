import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader.jsx';
import { adminService } from '../../services/adminService.js';
import { currency } from '../../utils/format.js';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setOverview(await adminService.overview());
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <Loader label="Loading analytics" />;

  return (
    <section className="page-section">
      <div className="metrics-grid">
        <article className="metric-card">
          <small>Total users</small>
          <strong>{overview?.totalUsers || 0}</strong>
        </article>
        <article className="metric-card">
          <small>Restaurants</small>
          <strong>{overview?.totalRestaurants || 0}</strong>
        </article>
        <article className="metric-card">
          <small>Orders</small>
          <strong>{overview?.totalOrders || 0}</strong>
        </article>
        <article className="metric-card">
          <small>Revenue</small>
          <strong>{currency(overview?.totalRevenue)}</strong>
        </article>
      </div>

      <section className="panel">
        <h2>Orders by status</h2>
        <div className="status-bars">
          {Object.entries(overview?.ordersByStatus || {}).map(([status, count]) => (
            <div key={status}>
              <span>{status}</span>
              <div>
                <i style={{ width: `${Math.min(100, Number(count) * 12)}%` }} />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
