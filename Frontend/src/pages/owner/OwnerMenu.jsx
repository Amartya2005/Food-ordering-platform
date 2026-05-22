import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit3, Trash2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { menuService } from '../../services/menuService.js';
import { restaurantService } from '../../services/restaurantService.js';
import { asArray, currency, getId, imageOf } from '../../utils/format.js';

const initialForm = {
  itemName: '',
  price: '',
  availability: true,
  image: null
};

export default function OwnerMenu() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [menu, setMenu] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const items = await restaurantService.listOwned(user?.id);
        setRestaurants(items);
        setRestaurantId(getId(items[0]) || '');
      } catch (error) {
        toast.error(error.message);
      }
    }

    loadRestaurants();
  }, [user?.id]);

  useEffect(() => {
    async function loadMenu() {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await menuService.byRestaurant(restaurantId);
        setMenu(asArray(data));
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, [restaurantId]);

  function editItem(item) {
    setEditingId(getId(item));
    setForm({
        itemName: item.itemName || item.name || '',
      price: item.price || '',
        availability: item.availability ?? item.isAvailable ?? true,
      image: null
    });
  }

  async function saveItem(event) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      restaurantId,
      price: Number(form.price || 0)
    };

    try {
      if (editingId) {
        await menuService.update(editingId, payload);
        toast.success('Menu item updated');
      } else {
        await menuService.create(payload);
        toast.success('Menu item created');
      }

      const data = await menuService.byRestaurant(restaurantId);
      setMenu(asArray(data));
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id) {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await menuService.remove(id);
      setMenu((current) => current.filter((item) => getId(item) !== id));
      toast.success('Menu item deleted');
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Menu management</small>
          <h2>Food items</h2>
        </div>
        <select value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)}>
          {restaurants.map((restaurant) => (
            <option value={getId(restaurant)} key={getId(restaurant)}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      <div className="management-grid">
        <form className="panel stack" onSubmit={saveItem}>
          <h3>{editingId ? 'Update item' : 'Add item'}</h3>
          <label>
            Item name
            <input
              value={form.itemName}
              onChange={(event) => setForm({ ...form, itemName: event.target.value })}
              required
            />
          </label>
          <label>
            Price
            <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
          </label>
          <label className="toggle-line">
            <input
              type="checkbox"
              checked={form.availability}
              onChange={(event) => setForm({ ...form, availability: event.target.checked })}
            />
            Available
          </label>
          <label>
            Food image
            <input type="file" accept="image/*" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] })} />
          </label>
          <button className="primary-button" disabled={saving || !restaurantId}>
            {saving ? 'Saving...' : editingId ? 'Update item' : 'Add item'}
          </button>
        </form>

        <section className="panel">
          <h3>Current menu</h3>
          {loading ? (
            <Loader label="Loading menu" />
          ) : menu.length === 0 ? (
            <EmptyState title="No items yet" message="Add food items with price and image." />
          ) : (
            <div className="compact-list">
              {menu.map((item) => (
                <article key={getId(item)}>
                  <img className="thumb" src={imageOf(item)} alt={item.itemName || item.name} />
                  <div>
                    <strong>{item.itemName || item.name}</strong>
                    <small>{currency(item.price)} | {(item.availability ?? item.isAvailable ?? true) ? 'Available' : 'Unavailable'}</small>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => editItem(item)}
                    aria-label={`Edit ${item.itemName || item.name}`}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => removeItem(getId(item))}
                    aria-label={`Delete ${item.itemName || item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
