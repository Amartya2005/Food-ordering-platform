import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { asArray, getId, imageOf } from '../../utils/format.js';

const initialForm = {
  name: '',
  category: '',
  location: '',
  image: null
};

export default function OwnerRestaurant() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await restaurantService.listOwned(user?.id);
      setRestaurants(asArray(data));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  function startEdit(restaurant) {
    setEditingId(getId(restaurant));
    setForm({
      name: restaurant.name || '',
      category: restaurant.category || restaurant.cuisine || '',
      location: restaurant.location || restaurant.address || '',
      image: null
    });
  }

  async function saveRestaurant(event) {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await restaurantService.update(editingId, form);
        toast.success('Restaurant updated');
      } else {
        await restaurantService.create(form);
        toast.success('Restaurant created');
      }
      setEditingId(null);
      setForm(initialForm);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeRestaurant(id) {
    if (!window.confirm('Delete this restaurant?')) return;
    try {
      await restaurantService.remove(id);
      toast.success('Restaurant deleted');
      load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <div>
          <small>Restaurant owner</small>
          <h2>Restaurant profile</h2>
        </div>
      </div>

      <div className="management-grid">
        <form className="panel stack" onSubmit={saveRestaurant}>
          <h3>{editingId ? 'Update restaurant' : 'Create restaurant'}</h3>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Category
            <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Indian, Italian" required />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Koramangala, Bangalore" required />
          </label>
          <label>
            Restaurant image
            <input type="file" accept="image/*" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] })} />
          </label>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update restaurant' : 'Create restaurant'}
          </button>
        </form>

        <section className="panel">
          <h3>Your restaurants</h3>
          {loading ? (
            <Loader label="Loading restaurants" />
          ) : restaurants.length === 0 ? (
            <EmptyState title="No restaurant yet" message="Create your first restaurant to start adding menu items." />
          ) : (
            <div className="compact-list">
              {restaurants.map((restaurant) => (
                <article key={getId(restaurant)}>
                  <img className="thumb" src={imageOf(restaurant)} alt={restaurant.name} />
                  <div>
                    <strong>{restaurant.name}</strong>
                    <small>{restaurant.category || restaurant.location}</small>
                    <StatusBadge verified={restaurant.isVerified === true} />
                  </div>
                  <button className="ghost-button" onClick={() => startEdit(restaurant)}>
                    Edit
                  </button>
                  <button className="icon-button danger" onClick={() => removeRestaurant(getId(restaurant))} aria-label="Delete restaurant">
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
