-- Tabela: projetos
CREATE TABLE public.projetos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz DEFAULT now(),
    nome text NOT NULL,
    segmento text NOT NULL, -- 'salao_festas' | 'franquias'
    status text DEFAULT 'briefing_pendente', -- 'briefing_pendente' | 'diagnostico_pendente' | 'ativo'
    user_id uuid REFERENCES auth.users
);

-- Tabela: briefings
CREATE TABLE public.briefings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id uuid REFERENCES public.projetos ON DELETE CASCADE,
    criado_em timestamptz DEFAULT now(),
    atualizado_em timestamptz DEFAULT now(),
    nome_negocio text,
    localizacao text,
    descricao_espaco text,
    publico_atual text,
    publico_desejado text,
    faixa_preco text,
    nivel_autoridade text, -- 'referencia' | 'conhecido' | 'novo'
    tom_de_voz text,
    restricoes text,
    diagnostico_ia text, -- retorno da Chamada 1
    respostas_gestor text, -- respostas do gestor às perguntas da IA
    diagnostico_confirmado boolean DEFAULT false
);

-- Tabela: copies
CREATE TABLE public.copies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id uuid REFERENCES public.projetos ON DELETE CASCADE,
    criado_em timestamptz DEFAULT now(),
    formato text NOT NULL, -- 'anuncio_instagram' | 'pagina_vendas'
    conteudo text NOT NULL,
    salvo boolean DEFAULT false
);

-- Políticas de segurança RLS (Row Level Security) básicas
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados verem/editarem apenas seus próprios projetos
CREATE POLICY "Users can manage their own projetos" ON public.projetos
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage briefings of their projetos" ON public.briefings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projetos WHERE id = projeto_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage copies of their projetos" ON public.copies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projetos WHERE id = projeto_id AND user_id = auth.uid()
        )
    );
