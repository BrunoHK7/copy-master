import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Briefcase } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Layout.css';

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: 'Projetos', path: '/', icon: <Briefcase size={20} /> },
    { name: 'Dashboard', path: '/stats', icon: <LayoutDashboard size={20} /> },
    { name: 'Configurações', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">C</div>
        <h2>CopyMaster</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
