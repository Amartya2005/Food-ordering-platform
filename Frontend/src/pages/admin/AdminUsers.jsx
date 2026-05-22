import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import EmptyState from '../../components/EmptyState.jsx';
import Loader from '../../components/Loader.jsx';
import Pagination from '../../components/Pagination.jsx';
import { adminService } from '../../services/adminService.js';
import { asArray, getId, pageMeta, userName } from '../../utils/format.js';

export default function AdminUsers() {
  const [payload, setPayload] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await adminService.users({ page, limit: 10 });
      setPayload(data);
      setUsers(asArray(data));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function deleteUser(id) {
    if (!window.confirm('Delete this user?')) return;

    try {
      await adminService.deleteUser(id);
      setUsers((current) => current.filter((user) => getId(user) !== id));
      toast.success('User deleted');
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
          <h2>User management</h2>
        </div>
      </div>

      {loading ? (
        <Loader label="Loading users" />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={getId(user)}>
                  <td>{userName(user)}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge muted">{user.role}</span>
                  </td>
                  <td>
                    <button className="icon-button danger" onClick={() => deleteUser(getId(user))} aria-label={`Delete ${userName(user)}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={meta.page || page} totalPages={meta.totalPages} onChange={setPage} />
    </section>
  );
}
