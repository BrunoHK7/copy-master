import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate('/login');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!session) return null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Painel de Projetos</h2>
        <button onClick={handleLogout} className="btn-secondary">Sair</button>
      </header>
      <main className="dashboard-main">
        <div className="welcome-card">
          <h3>Bem-vindo, gestor!</h3>
          <p>Em breve, aqui você verá a lista de seus clientes.</p>
        </div>
      </main>
    </div>
  );
}
