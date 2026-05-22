import { Mail, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { userName } from '../../utils/format.js';

export default function Profile() {
  const { user, role } = useAuth();

  return (
    <section className="page-section narrow">
      <div className="profile-card">
        <div className="avatar">
          <User size={28} />
        </div>
        <h2>{userName(user)}</h2>
        <p>{user?.email}</p>
        <div className="profile-row">
          <Mail size={18} />
          <span>{user?.email || 'No email added'}</span>
        </div>
        <div className="profile-row">
          <ShieldCheck size={18} />
          <span>{role}</span>
        </div>
      </div>
    </section>
  );
}
