import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Plus, Folder, ChevronRight, X } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  // Modal state
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [segmento, setSegmento] = useState('salao_festas');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProjetos();
  }, []);

  const fetchProjetos = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .order('criado_em', { ascending: false });
        
      if (!error && data) {
        setProjetos(data);
      }
    }
    setLoading(false);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!nomeProjeto.trim()) return;
    
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data, error } = await supabase
        .from('projetos')
        .insert([
          { 
            nome: nomeProjeto, 
            segmento, 
            user_id: session.user.id 
          }
        ])
        .select();

      if (!error && data) {
        setProjetos([data[0], ...projetos]);
        setShowModal(false);
        setNomeProjeto('');
        setSegmento('salao_festas');
      } else {
        console.error(error);
        alert('Erro ao criar projeto');
      }
    }
    setSaving(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'briefing_pendente': { label: 'Briefing Pendente', class: 'badge-warning' },
      'diagnostico_pendente': { label: 'Diagnóstico IA', class: 'badge-info' },
      'ativo': { label: 'Ativo', class: 'badge-success' }
    };
    const badge = statusMap[status] || statusMap['briefing_pendente'];
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projetos</h1>
          <p className="page-subtitle">Gerencie os clientes e copies da agência</p>
        </div>
        <button className="btn-primary flex-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Novo Projeto
        </button>
      </div>

      {loading ? (
        <div className="loader">Carregando projetos...</div>
      ) : projetos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Folder size={48} /></div>
          <h3>Nenhum projeto encontrado</h3>
          <p>Comece criando seu primeiro projeto de cliente para gerar copies.</p>
          <button className="btn-secondary mt-4" onClick={() => setShowModal(true)}>
            Criar Primeiro Projeto
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projetos.map((proj) => (
            <div key={proj.id} className="project-card">
              <div className="project-card-header">
                <h3>{proj.nome}</h3>
                {getStatusBadge(proj.status)}
              </div>
              <div className="project-card-body">
                <p>Segmento: <strong>{proj.segmento === 'salao_festas' ? 'Salão de Festas' : 'Franquias'}</strong></p>
              </div>
              <div className="project-card-footer">
                <button className="btn-text" onClick={() => navigate(`/projeto/${proj.id}`)}>
                  Acessar Projeto <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for New Project */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Novo Projeto</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="input-group">
                  <label htmlFor="nome">Nome do Cliente/Negócio</label>
                  <input 
                    id="nome" 
                    type="text" 
                    value={nomeProjeto}
                    onChange={(e) => setNomeProjeto(e.target.value)}
                    placeholder="Ex: Buffet Alegria"
                    required
                  />
                </div>
                <div className="input-group mt-3">
                  <label htmlFor="segmento">Segmento</label>
                  <select 
                    id="segmento" 
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                  >
                    <option value="salao_festas">Salão de Festas</option>
                    <option value="franquias">Franquias</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Criando...' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
