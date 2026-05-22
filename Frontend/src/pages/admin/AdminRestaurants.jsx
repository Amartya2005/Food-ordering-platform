import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Trash2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { adminService } from '../../services/adminService.js';
import { asArray, getId, imageOf, pageMeta } from '../../utils/format.js';

export default function AdminRestaurants() {
  const [payload, setPayload] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await adminService.restaurants({ page, limit: 10 });
      setPayload(data);
      setRestaurants(asArray(data));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function verify(restaurant) {
    try {
      await adminService.verifyRestaurant(getId(restaurant), true);
      setRestaurants((current) => current.map((item) => (getId(item) === getId(restaurant) ? { ...item, isVerified: true } : item)));
      toast.success('Restaurant verified');
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this restaurant?')) return;

    try {
      await adminService.deleteRestaurant(id);
      setRestaurants((current) => current.filter((restaurant) => getId(restaurant) !== id));
      toast.success('Restaurant deleted');
    } catch (error) {
      toast.error(error.message);
    }
  }

  const meta = pageMeta(payload);

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Admin</small>
          <h2>Restaurant verification</h2>
        </div>
      </div>

      {loading ? (
        <Loader label="Loading restaurants" />
      ) : restaurants.length === 0 ? (
        <EmptyState title="No restaurants found" />
      ) : (
        <div className="wide-list">
          {restaurants.map((restaurant) => (
            <article className="wide-card" key={getId(restaurant)}>
              <img src={imageOf(restaurant)} alt={restaurant.name} />
              <div>
                <div className="card-title-row">
                  <h3>{restaurant.name}</h3>
                  <StatusBadge verified={restaurant.isVerified === true} />
                </div>
                <p>{restaurant.address || restaurant.cuisine || restaurant.description}</p>
                <div className="actions-row">
                  <button className="ghost-button" disabled={restaurant.isVerified === true} onClick={() => verify(restaurant)}>
                    <CheckCircle2 size={16} /> Verify
                  </button>
                  <button className="ghost-button danger-text" onClick={() => remove(getId(restaurant))}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination page={meta.page || page} totalPages={meta.totalPages} onChange={setPage} />
    </section>
  );
}
