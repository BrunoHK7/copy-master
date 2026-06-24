import { Bell, User } from 'lucide-react';
import './Layout.css';

export default function Topbar({ user }) {
  return (
    <header className="topbar">
      <div className="topbar-search">
        {/* Placeholder for search if needed */}
      </div>
      <div className="topbar-actions">
        <button className="icon-btn">
          <Bell size={20} />
        </button>
        <div className="user-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <span>{user?.email?.split('@')[0] || 'Gestor'}</span>
        </div>
      </div>
    </header>
  );
}
