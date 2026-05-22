import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Loader from '../../components/Loader.jsx';
import { adminService } from '../../services/adminService.js';
import { currency } from '../../utils/format.js';

export default function AdminAnalytics() {
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

  const maxStatusCount = Math.max(1, ...Object.values(overview?.ordersByStatus || {}).map(Number));

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Analytics</small>
          <h2>Platform overview</h2>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="metric-card">
          <small>Total revenue</small>
          <strong>{currency(overview?.totalRevenue)}</strong>
        </article>
        <article className="metric-card">
          <small>Orders</small>
          <strong>{overview?.totalOrders || 0}</strong>
        </article>
        <article className="metric-card">
          <small>Users</small>
          <strong>{overview?.totalUsers || 0}</strong>
        </article>
        <article className="metric-card">
          <small>Restaurants</small>
          <strong>{overview?.totalRestaurants || 0}</strong>
        </article>
      </div>

      <section className="panel">
        <h3>Orders by status</h3>
        <div className="analytics-bars">
          {Object.entries(overview?.ordersByStatus || {}).map(([status, count]) => (
            <article key={status}>
              <strong>{count}</strong>
              <div>
                <span style={{ height: `${(Number(count) / maxStatusCount) * 100}%` }} />
              </div>
              <small>{status}</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
