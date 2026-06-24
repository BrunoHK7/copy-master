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
  const [savingIndex, setSavingIndex] = useState(null);
  
  const [formatoSelecionado, setFormatoSelecionado] = useState('anuncio_instagram');
  const [quantidade, setQuantidade] = useState(1);
  const [copiesGeradas, setCopiesGeradas] = useState([]);
  
  const [briefingCampanha, setBriefingCampanha] = useState({
    objetivo: 'WhatsApp',
    oferta: '',
    preco: '',
    condicoes: '',
    data_periodo: '',
    observacoes: ''
  });

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
    if (!briefingCampanha.oferta) {
      alert('Por favor, preencha a Oferta Específica no Briefing da Campanha.');
      return;
    }
    
    setGenerating(true);
    setCopiesGeradas([]);
    
    try {
      const response = await fetch('http://localhost:3001/api/gerar-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          briefing, 
          formato: formatoSelecionado,
          briefing_campanha: briefingCampanha,
          quantidade: quantidade
        })
      });
      
      const data = await response.json();
      if (data.copies && Array.isArray(data.copies)) {
        setCopiesGeradas(data.copies);
      } else {
        alert('Erro ao gerar copy: ' + (data.message || JSON.stringify(data)));
        console.error("Erro do backend:", data);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao gerar copy.');
    }
    setGenerating(false);
  };

  const handleSaveCopy = async (conteudo, index) => {
    if (!conteudo) return;
    setSavingIndex(index);
    
    const { data, error } = await supabase
      .from('copies')
      .insert([
        {
          projeto_id: id,
          formato: formatoSelecionado,
          conteudo: conteudo,
          briefing_campanha: briefingCampanha,
          salvo: true
        }
      ])
      .select();
      
    if (!error && data) {
      setCopies([data[0], ...copies]);
      alert('Variação salva no histórico!');
    } else {
      alert('Erro ao salvar variação.');
    }
    setSavingIndex(null);
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
          Editar Briefing Base
        </Link>
      </div>

      <div className="project-grid">
        <div className="generator-section">
          <div className="generator-card">
            <h2>Gerador de Copy com IA</h2>
            
            <div className="campaign-briefing">
              <h3>Briefing da Campanha (Específico para esta geração)</h3>
              <div className="form-grid">
                <div className="input-group">
                  <label>Objetivo da Campanha</label>
                  <select 
                    value={briefingCampanha.objetivo}
                    onChange={(e) => setBriefingCampanha({...briefingCampanha, objetivo: e.target.value})}
                  >
                    <option value="WhatsApp">Mensagem no WhatsApp</option>
                    <option value="Visita">Agendar Visita</option>
                    <option value="Cadastro">Cadastro de Lead</option>
                    <option value="Ligação">Ligação</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Oferta Específica *</label>
                  <input 
                    type="text" 
                    value={briefingCampanha.oferta}
                    onChange={(e) => setBriefingCampanha({...briefingCampanha, oferta: e.target.value})}
                    placeholder="Ex: Pacote de janeiro c/ desconto"
                  />
                </div>
                <div className="input-group">
                  <label>Preço (Opcional)</label>
                  <input 
                    type="text" 
                    value={briefingCampanha.preco}
                    onChange={(e) => setBriefingCampanha({...briefingCampanha, preco: e.target.value})}
                    placeholder="Ex: R$ 5.000 ou 12x 500"
                  />
                </div>
                <div className="input-group">
                  <label>Condições de Pagamento (Opcional)</label>
                  <input 
                    type="text" 
                    value={briefingCampanha.condicoes}
                    onChange={(e) => setBriefingCampanha({...briefingCampanha, condicoes: e.target.value})}
                    placeholder="Ex: Sem juros no cartão"
                  />
                </div>
                <div className="input-group">
                  <label>Data ou Período (Opcional)</label>
                  <input 
                    type="text" 
                    value={briefingCampanha.data_periodo}
                    onChange={(e) => setBriefingCampanha({...briefingCampanha, data_periodo: e.target.value})}
                    placeholder="Ex: Até 15 de novembro"
                  />
                </div>
                <div className="input-group full-width">
                  <label>Observações Adicionais (Opcional)</label>
                  <textarea 
                    value={briefingCampanha.observacoes}
                    onChange={(e) => setBriefingCampanha({...briefingCampanha, observacoes: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid mt-4 pt-4 border-top">
              <div className="input-group">
                <label>Formato Desejado</label>
                <select 
                  value={formatoSelecionado} 
                  onChange={(e) => setFormatoSelecionado(e.target.value)}
                >
                  <option value="anuncio_instagram">Anúncio de Instagram (Feed/Stories)</option>
                  <option value="pagina_vendas">Página de Vendas (Landing Page)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Quantidade de Variações</label>
                <select 
                  value={quantidade} 
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                >
                  <option value={1}>1 Variação</option>
                  <option value={2}>2 Variações distintas</option>
                  <option value={3}>3 Variações distintas</option>
                  <option value={4}>4 Variações distintas</option>
                  <option value={5}>5 Variações distintas</option>
                </select>
              </div>
            </div>
            
            <button 
              className="btn-primary mt-4 flex-center gap-2 generate-btn" 
              onClick={handleGenerateCopy}
              disabled={generating || !briefingCampanha.oferta}
            >
              <Wand2 size={18} />
              {generating ? 'A IA está escrevendo...' : `Gerar ${quantidade > 1 ? quantidade + ' Copies' : 'Copy'}`}
            </button>
            
            {copiesGeradas.length > 0 && (
              <div className="variations-container mt-4">
                {copiesGeradas.map((copyText, index) => (
                  <div key={index} className="generated-copy-box">
                    <div className="box-header">
                      <h3>Variação {index + 1}</h3>
                    </div>
                    <textarea 
                      className="copy-editor"
                      value={copyText}
                      onChange={(e) => {
                        const novas = [...copiesGeradas];
                        novas[index] = e.target.value;
                        setCopiesGeradas(novas);
                      }}
                      rows={8}
                    />
                    <div className="box-footer mt-4">
                      <button className="btn-secondary" onClick={() => copyToClipboard(copyText)}>
                        <Copy size={16} /> Copiar Texto
                      </button>
                      <button className="btn-primary flex-center gap-2" onClick={() => handleSaveCopy(copyText, index)} disabled={savingIndex === index}>
                        <Save size={16} /> {savingIndex === index ? 'Salvando...' : 'Salvar no Histórico'}
                      </button>
                    </div>
                  </div>
                ))}
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
                    <div>
                      <span className="badge badge-info">
                        {copy.formato === 'anuncio_instagram' ? 'Anúncio Instagram' : 'Página de Vendas'}
                      </span>
                      {copy.briefing_campanha?.oferta && (
                        <span className="badge ml-2" style={{backgroundColor: 'var(--bg-input)', color: 'var(--primary)', border: '1px solid var(--primary)', marginLeft: '8px', fontSize: '0.7rem', padding: '2px 6px'}}>
                          {copy.briefing_campanha.oferta}
                        </span>
                      )}
                    </div>
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
