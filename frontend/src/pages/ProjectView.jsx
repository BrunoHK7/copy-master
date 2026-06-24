import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Wand2, Save, Copy } from 'lucide-react';
import './ProjectView.css';

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [copies, setCopies] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formatoSelecionado, setFormatoSelecionado] = useState('anuncio_instagram');
  const [copyGerada, setCopyGerada] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    setLoading(true);
    
    const { data: projData, error: projError } = await supabase
      .from('projetos')
      .select('*')
      .eq('id', id)
      .single();
      
    if (projError || !projData) {
      alert('Projeto não encontrado.');
      navigate('/');
      return;
    }

    if (projData.status !== 'ativo') {
      navigate(`/projeto/${id}/briefing`);
      return;
    }
    setProjeto(projData);

    const { data: briefData } = await supabase
      .from('briefings')
      .select('*')
      .eq('projeto_id', id)
      .single();
    setBriefing(briefData);

    fetchCopies();
  };

  const fetchCopies = async () => {
    const { data } = await supabase
      .from('copies')
      .select('*')
      .eq('projeto_id', id)
      .order('criado_em', { ascending: false });
      
    if (data) setCopies(data);
    setLoading(false);
  };

  const handleGenerateCopy = async () => {
    if (!briefing) return;
    setGenerating(true);
    setCopyGerada('');
    
    try {
      const response = await fetch('http://localhost:3001/api/gerar-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefing, formato: formatoSelecionado })
      });
      
      const data = await response.json();
      if (data.copy) {
        setCopyGerada(data.copy);
      } else {
        alert('Erro ao gerar copy.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao gerar copy.');
    }
    setGenerating(false);
  };

  const handleSaveCopy = async () => {
    if (!copyGerada) return;
    setSaving(true);
    
    const { data, error } = await supabase
      .from('copies')
      .insert([
        {
          projeto_id: id,
          formato: formatoSelecionado,
          conteudo: copyGerada,
          salvo: true
        }
      ])
      .select();
      
    if (!error && data) {
      setCopies([data[0], ...copies]);
      setCopyGerada('');
      alert('Copy salva no histórico!');
    } else {
      alert('Erro ao salvar copy.');
    }
    setSaving(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  if (loading) return <div className="loader">Carregando painel do projeto...</div>;

  return (
    <div className="project-view-page">
      <div className="page-header">
        <div className="header-left">
          <button className="icon-btn-secondary" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{projeto?.nome}</h1>
            <p className="page-subtitle">Central de Cópias e Anúncios</p>
          </div>
        </div>
        <Link to={`/projeto/${id}/briefing`} className="btn-secondary">
          Editar Briefing
        </Link>
      </div>

      <div className="project-grid">
        <div className="generator-section">
          <div className="generator-card">
            <h2>Gerador de Copy com IA</h2>
            <div className="input-group mt-4">
              <label>Formato Desejado</label>
              <select 
                value={formatoSelecionado} 
                onChange={(e) => setFormatoSelecionado(e.target.value)}
              >
                <option value="anuncio_instagram">Anúncio de Instagram (Feed/Stories)</option>
                <option value="pagina_vendas">Página de Vendas (Landing Page)</option>
              </select>
            </div>
            
            <button 
              className="btn-primary mt-4 flex-center gap-2" 
              onClick={handleGenerateCopy}
              disabled={generating}
            >
              <Wand2 size={18} />
              {generating ? 'A IA está escrevendo...' : 'Gerar Nova Copy'}
            </button>
            
            {copyGerada && (
              <div className="generated-copy-box mt-4">
                <div className="box-header">
                  <h3>Resultado Gerado</h3>
                </div>
                <textarea 
                  className="copy-editor"
                  value={copyGerada}
                  onChange={(e) => setCopyGerada(e.target.value)}
                  rows={10}
                />
                <div className="box-footer mt-4">
                  <button className="btn-secondary" onClick={() => copyToClipboard(copyGerada)}>
                    <Copy size={16} /> Copiar Texto
                  </button>
                  <button className="btn-primary flex-center gap-2" onClick={handleSaveCopy} disabled={saving}>
                    <Save size={16} /> {saving ? 'Salvando...' : 'Salvar no Histórico'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="history-section">
          <h2>Histórico de Copies</h2>
          {copies.length === 0 ? (
            <div className="empty-history">
              Nenhuma copy salva para este projeto ainda.
            </div>
          ) : (
            <div className="copies-list">
              {copies.map((copy) => (
                <div key={copy.id} className="history-card">
                  <div className="history-header">
                    <span className="badge badge-info">
                      {copy.formato === 'anuncio_instagram' ? 'Anúncio Instagram' : 'Página de Vendas'}
                    </span>
                    <button className="icon-btn-small" onClick={() => copyToClipboard(copy.conteudo)}>
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="history-body">
                    {copy.conteudo.substring(0, 150)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
