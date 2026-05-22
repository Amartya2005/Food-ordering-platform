import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Star } from 'lucide-react';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { asArray, currency, getId, imageOf } from '../../utils/format.js';

export default function CustomerHome() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await restaurantService.list({ page: 1, limit: 20 });
        setRestaurants(asArray(data));
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const visibleRestaurants = useMemo(() => {
    return restaurants
      .filter((restaurant) => restaurant.isVerified !== false)
      .filter((restaurant) => {
        const text = `${restaurant.name || ''} ${restaurant.cuisine || ''} ${restaurant.address || ''}`.toLowerCase();
        return text.includes(query.toLowerCase());
      });
  }, [query, restaurants]);

  if (loading) return <Loader label="Finding restaurants" />;

  return (
    <section className="page-section">
      <div className="hero-strip">
        <div>
          <small>Fresh near you</small>
          <h2>Order from verified restaurants</h2>
        </div>
        <Link className="primary-button compact" to="/restaurants">
          Browse all
        </Link>
      </div>

      <div className="search-box">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search dishes, restaurants, cuisines"
        />
      </div>

      {visibleRestaurants.length === 0 ? (
        <EmptyState title="No restaurants found" message="Try another search or ask an admin to verify restaurants." />
      ) : (
        <div className="restaurant-grid">
          {visibleRestaurants.map((restaurant) => (
            <Link className="restaurant-card" to={`/restaurants/${getId(restaurant)}`} key={getId(restaurant)}>
              <img src={imageOf(restaurant)} alt={restaurant.name} />
              <div className="card-body">
                <div className="card-title-row">
                  <h3>{restaurant.name}</h3>
                  <StatusBadge verified={restaurant.isVerified !== false} />
                </div>
                <p>{restaurant.cuisine || restaurant.description || 'Multi cuisine restaurant'}</p>
                <div className="meta-row">
                  <span>
                    <Star size={14} /> {restaurant.rating || '4.5'}
                  </span>
                  <span>
                    <Clock size={14} /> {restaurant.deliveryTime || '25-35 min'}
                  </span>
                  {restaurant.minimumOrder ? <span>{currency(restaurant.minimumOrder)} min</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
