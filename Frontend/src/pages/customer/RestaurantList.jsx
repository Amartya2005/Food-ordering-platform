import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { asArray, getId, imageOf, pageMeta } from '../../utils/format.js';

export default function RestaurantList() {
  const [payload, setPayload] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [page, setPage] = useState(1);
  const [showOnlyVerified, setShowOnlyVerified] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await restaurantService.list({ page, limit: 10 });
        setPayload(data);
        setRestaurants(asArray(data));
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page]);

  const meta = pageMeta(payload);
  const visible = showOnlyVerified ? restaurants.filter((item) => item.isVerified !== false) : restaurants;

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Restaurants</small>
          <h2>Explore places</h2>
        </div>
        <label className="toggle-line">
          <input type="checkbox" checked={showOnlyVerified} onChange={(event) => setShowOnlyVerified(event.target.checked)} />
          Verified only
        </label>
      </div>

      {loading ? (
        <Loader label="Loading restaurants" />
      ) : visible.length === 0 ? (
        <EmptyState title="No restaurants available" message="Uncheck verified only to see pending restaurants." />
      ) : (
        <div className="wide-list">
          {visible.map((restaurant) => (
            <Link className="wide-card" to={`/restaurants/${getId(restaurant)}`} key={getId(restaurant)}>
              <img src={imageOf(restaurant)} alt={restaurant.name} />
              <div>
                <div className="card-title-row">
                  <h3>{restaurant.name}</h3>
                  <StatusBadge verified={restaurant.isVerified !== false} />
                </div>
                <p>{restaurant.description || restaurant.cuisine || restaurant.address || 'Restaurant details available inside.'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={meta.page || page} totalPages={meta.totalPages} onChange={setPage} />
    </section>
  );
}
