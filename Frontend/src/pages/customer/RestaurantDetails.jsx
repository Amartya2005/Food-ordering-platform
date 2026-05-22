import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { menuService } from '../../services/menuService.js';
import { restaurantService } from '../../services/restaurantService.js';
import { asArray, currency, getId, imageOf } from '../../utils/format.js';

export default function RestaurantDetails() {
  const { id } = useParams();
  const { addItem, count } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [restaurantData, menuData] = await Promise.all([
          restaurantService.getById(id),
          menuService.byRestaurant(id, { availability: true })
        ]);
        setRestaurant(restaurantData || { id, name: 'Restaurant' });
        setMenu(asArray(menuData));
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => `${item.name || ''}`.toLowerCase().includes(query.toLowerCase()));
  }, [menu, query]);

  if (loading) return <Loader label="Opening menu" />;

  return (
    <section className="page-section">
      <div className="detail-hero">
        <img src={imageOf(restaurant)} alt={restaurant?.name} />
        <div>
          <StatusBadge verified={restaurant?.isVerified !== false} />
          <h2>{restaurant?.name}</h2>
          <p>{restaurant?.description || restaurant?.cuisine || restaurant?.address || 'Browse menu and place your order.'}</p>
        </div>
      </div>

      <div className="section-header">
        <div>
          <small>Menu</small>
          <h2>Choose your food</h2>
        </div>
        {count > 0 ? (
          <Link className="primary-button compact" to="/cart">
            View cart ({count})
          </Link>
        ) : null}
      </div>

      <div className="search-box">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this menu" />
      </div>

      {filteredMenu.length === 0 ? (
        <EmptyState title="Menu is empty" message="The restaurant owner has not added items yet." />
      ) : (
        <div className="menu-grid">
          {filteredMenu.map((item) => (
            <article className="menu-card" key={getId(item)}>
              <img src={imageOf(item)} alt={item.name} />
              <div>
                <small>{item.category || 'Food'}</small>
                <h3>{item.name}</h3>
                <p>{item.description || 'Freshly prepared and ready to order.'}</p>
                <div className="card-title-row">
                  <strong>{currency(item.price)}</strong>
                  <button className="icon-button" aria-label={`Add ${item.name}`} onClick={() => addItem(item, restaurant)}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
