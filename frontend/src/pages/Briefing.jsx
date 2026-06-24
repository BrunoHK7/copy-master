import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';
import './Briefing.css';

export default function Briefing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_negocio: '',
    localizacao: '',
    descricao_espaco: '',
    publico_atual: '',
    publico_desejado: '',
    faixa_preco: '',
    nivel_autoridade: 'novo',
    tom_de_voz: '',
    restricoes: ''
  });

  useEffect(() => {
    fetchProjetoEBriefing();
  }, [id]);

  const fetchProjetoEBriefing = async () => {
    setLoading(true);
    
    // Fetch project
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
    
    setProjeto(projData);

    // Fetch briefing if exists
    const { data: briefData } = await supabase
      .from('briefings')
      .select('*')
      .eq('projeto_id', id)
      .single();
      
    if (briefData) {
      setFormData({
        nome_negocio: briefData.nome_negocio || projData.nome,
        localizacao: briefData.localizacao || '',
        descricao_espaco: briefData.descricao_espaco || '',
        publico_atual: briefData.publico_atual || '',
        publico_desejado: briefData.publico_desejado || '',
        faixa_preco: briefData.faixa_preco || '',
        nivel_autoridade: briefData.nivel_autoridade || 'novo',
        tom_de_voz: briefData.tom_de_voz || '',
        restricoes: briefData.restricoes || ''
      });
    } else {
      setFormData(prev => ({ ...prev, nome_negocio: projData.nome }));
    }
    
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { data: existing } = await supabase
      .from('briefings')
      .select('id')
      .eq('projeto_id', id)
      .single();

    if (existing) {
      // Update
      await supabase
        .from('briefings')
        .update({
          ...formData,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Insert
      await supabase
        .from('briefings')
        .insert([{ projeto_id: id, ...formData }]);
    }

    setSaving(false);
    alert('Briefing salvo com sucesso!');
    // Próxima etapa: chamar IA. Por enquanto apenas salvamos.
  };

  if (loading) return <div className="loader">Carregando briefing...</div>;

  return (
    <div className="briefing-page">
      <div className="page-header">
        <div className="header-left">
          <button className="icon-btn-secondary" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Briefing: {projeto?.nome}</h1>
            <p className="page-subtitle">Preencha as informações detalhadas do cliente para gerar copies de alta conversão.</p>
          </div>
        </div>
      </div>

      <div className="briefing-container">
        <form onSubmit={handleSubmit} className="briefing-form">
          <div className="form-section">
            <h3>Informações Básicas</h3>
            <div className="form-grid">
              <div className="input-group">
                <label>Nome do Negócio</label>
                <input 
                  type="text" name="nome_negocio" 
                  value={formData.nome_negocio} onChange={handleChange} required 
                />
              </div>
              <div className="input-group">
                <label>Localização (Cidade, Bairro)</label>
                <input 
                  type="text" name="localizacao" 
                  value={formData.localizacao} onChange={handleChange} required 
                />
              </div>
              <div className="input-group full-width">
                <label>Descrição do Espaço/Produto</label>
                <textarea 
                  name="descricao_espaco" rows={3}
                  value={formData.descricao_espaco} onChange={handleChange} required 
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Público e Preço</h3>
            <div className="form-grid">
              <div className="input-group full-width">
                <label>Público Atual (Quem já compra?)</label>
                <textarea 
                  name="publico_atual" rows={2}
                  value={formData.publico_atual} onChange={handleChange} required 
                />
              </div>
              <div className="input-group full-width">
                <label>Público Desejado (Quem o cliente quer atrair?)</label>
                <textarea 
                  name="publico_desejado" rows={2}
                  value={formData.publico_desejado} onChange={handleChange} required 
                />
              </div>
              <div className="input-group">
                <label>Faixa de Preço (Seja específico)</label>
                <input 
                  type="text" name="faixa_preco" placeholder="Ex: R$ 5.000 a R$ 10.000"
                  value={formData.faixa_preco} onChange={handleChange} required 
                />
              </div>
              <div className="input-group">
                <label>Nível de Autoridade no Mercado</label>
                <select name="nivel_autoridade" value={formData.nivel_autoridade} onChange={handleChange}>
                  <option value="novo">Novo / Pouco Conhecido</option>
                  <option value="conhecido">Conhecido, mas não dominante</option>
                  <option value="referencia">Referência Consolidada</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Tom de Voz e Regras</h3>
            <div className="form-grid">
              <div className="input-group full-width">
                <label>Tom de Voz</label>
                <input 
                  type="text" name="tom_de_voz" placeholder="Ex: Sofisticado, direto e exclusivo."
                  value={formData.tom_de_voz} onChange={handleChange} required 
                />
              </div>
              <div className="input-group full-width">
                <label>Restrições (O que NÃO pode aparecer nos anúncios?)</label>
                <textarea 
                  name="restricoes" rows={2} placeholder="Ex: Evitar a palavra 'barato' ou 'promoção'."
                  value={formData.restricoes} onChange={handleChange} required 
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary flex-center gap-2" disabled={saving}>
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Briefing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
