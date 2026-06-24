# Briefing — Ferramenta de Copy com IA

## Contexto geral

Você vai me ajudar a construir um web app chamado **Ferramenta de Copy**, para uso interno de agências de marketing. O objetivo é substituir o fluxo improvisado de gestores de tráfego que usam o ChatGPT puro para criar copies de anúncios e páginas de venda.

A ferramenta vai entregar copies melhores porque:
- Usa um briefing estruturado por cliente (não começa do zero toda vez)
- Tem um banco de copies que já funcionaram + diretrizes de o que funciona e o que não funciona
- Aplica formatos pré-definidos por tipo de anúncio
- Faz diagnóstico de posicionamento antes de gerar qualquer copy

---

## Stack definida

- **Frontend:** React
- **Backend:** Node.js
- **Banco de dados:** Supabase (auth + PostgreSQL)
- **IA:** API Anthropic — modelo `claude-sonnet-4-6`
- **Frontend hosting:** Vercel (conectado ao GitHub, deploy automático)
- **Backend hosting:** Railway (conectado ao GitHub, deploy automático)
- **Repositório:** GitHub

---

## Funcionalidades do MVP

### 1. Autenticação
Login simples via Supabase Auth. Apenas usuários internos da agência.

### 2. Painel de projetos
- Listar projetos existentes
- Criar novo projeto (um projeto = um cliente)
- Entrar em um projeto existente

### 3. Briefing de projeto (preenchido uma vez por cliente)

Campos:
- Nome do negócio
- Segmento: `salao_festas` ou `franquias`
- Localização (cidade, bairro)
- Descrição do espaço/produto
- Público atual real
- Público que o cliente quer atingir
- Faixa de preço praticado
- Nível de autoridade no mercado: `referencia` | `conhecido` | `novo`
- Tom de voz
- Restrições (o que não pode aparecer nos anúncios)

Após preenchimento → **Chamada 1 para a API Anthropic** (análise de briefing).

### 4. Análise de briefing (Chamada 1 — API Anthropic)

**O que é enviado:**
```
system: [diretrizes completas + banco de copies + regras de posicionamento]
user: [dados do briefing preenchido pelo gestor]
instrução: identificar inconsistências de posicionamento e gerar perguntas para o gestor responder antes de avançar
```

**O que retorna:**
- Lista de inconsistências detectadas (ex: salão periférico querendo atrair classe A)
- Perguntas específicas para o gestor responder

**Comportamento:**
- A análise e as perguntas são exibidas para o gestor
- O gestor deve responder cada pergunta antes de avançar
- Só após responder todas as perguntas o projeto é liberado para geração de copies
- As respostas ficam salvas no banco junto ao briefing

### 5. Geração de copy (Chamada 2 — API Anthropic)

O gestor seleciona um formato e clica em "Gerar copy".

**Formatos disponíveis no MVP:**
- Anúncio Instagram (feed/stories)
- Página de vendas

**O que é enviado:**
```
system: [diretrizes + banco de copies + estrutura do formato selecionado]
user: [briefing completo do projeto] + [análise de diagnóstico] + [respostas do gestor às perguntas]
instrução: gerar copy no formato selecionado seguindo as diretrizes
```

**O que retorna:**
- Copy gerada no formato correto

**Comportamento:**
- Copy exibida para o gestor revisar e editar se quiser
- Gestor pode salvar ou descartar
- Copies salvas ficam no histórico do projeto

### 6. Histórico de copies
- Dentro de cada projeto, listar todas as copies geradas
- Filtrar por formato
- Copiar copy para área de transferência

---

## Schema do banco (Supabase)

### Tabela: `projetos`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
criado_em timestamptz DEFAULT now()
nome text NOT NULL
segmento text NOT NULL -- 'salao_festas' | 'franquias'
status text DEFAULT 'briefing_pendente' -- 'briefing_pendente' | 'diagnostico_pendente' | 'ativo'
user_id uuid REFERENCES auth.users
```

### Tabela: `briefings`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
projeto_id uuid REFERENCES projetos ON DELETE CASCADE
criado_em timestamptz DEFAULT now()
atualizado_em timestamptz DEFAULT now()
nome_negocio text
localizacao text
descricao_espaco text
publico_atual text
publico_desejado text
faixa_preco text
nivel_autoridade text -- 'referencia' | 'conhecido' | 'novo'
tom_de_voz text
restricoes text
diagnostico_ia text -- retorno da Chamada 1
respostas_gestor text -- respostas do gestor às perguntas da IA
diagnostico_confirmado boolean DEFAULT false
```

### Tabela: `copies`
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
projeto_id uuid REFERENCES projetos ON DELETE CASCADE
criado_em timestamptz DEFAULT now()
formato text NOT NULL -- 'anuncio_instagram' | 'pagina_vendas'
conteudo text NOT NULL
salvo boolean DEFAULT false
```

---

## Fluxo completo do usuário

```
Login
  → Painel de projetos
    → Criar projeto (nome + segmento)
      → Formulário de briefing
        → [Chamada 1: análise de briefing]
          → Exibir diagnóstico + perguntas
            → Gestor responde perguntas
              → Projeto liberado (status = 'ativo')
                → Tela do projeto
                  → Selecionar formato
                    → [Chamada 2: geração de copy]
                      → Exibir copy gerada
                        → Gestor revisa e salva
                          → Histórico do projeto
```

---

## Diretrizes de copy (contexto que vai no system prompt)

### Princípio central
A copy não tenta convencer quem não quer. Ela aciona quem já está pronto para decidir.

### O que funciona
- Dado concreto e específico: preço, capacidade, data, condição
- Posicionamento por contraste: definir o que não é para deixar claro o que é
- Especificidade de tempo: "agenda aberta setembro", "vagas para outubro"
- Copy curta em anúncio de Instagram — quanto menos palavras, melhor, desde que cada palavra carregue informação real

### O que nunca gerar
- Headlines genéricas: "A festa dos seus sonhos", "Momentos inesquecíveis", "Seu evento merece um local incrível"
- Apelo à dor forçada: "Você ainda não resolveu nada?", "Cansado de se preocupar?"
- Promessas vagas: "Só chegar e curtir", "Sem dor de cabeça", "Tudo resolvido"
- Excesso de texto em criativo de feed Instagram
- Listas longas de entregáveis sem âncora de valor

### Posicionamento por nível de autoridade
- **Referência consolidada:** copy direta, quase institucional. Ex: "Agenda aberta setembro."
- **Conhecido mas não dominante:** dado concreto + diferencial. Ex: "Festa completa por R$7.740 — 50 convidados, sábado."
- **Novo e pouco conhecido:** constrói confiança. Usa prova social, entregáveis detalhados, posicionamento por contraste.

### Estrutura de anúncio Instagram
- Linha 1: gancho — dado concreto, escassez real ou contraste. Máximo 6 palavras.
- Linha 2: entregável ou diferencial específico
- Linha 3: CTA simples — "Chama no WhatsApp", "Agende uma visita"

### Estrutura de página de vendas
1. Headline — promessa específica, sem floreio
2. Subheadline — reforça o diferencial
3. O que está incluso — lista objetiva com especificidades
4. Para quem é — define o público ideal
5. Prova social — depoimento ou dado de resultado
6. Preço e condições — explícito quando possível
7. CTA — único, claro, fricção mínima

---

## O que quero que você faça agora

**Monte um plano de implementação detalhado**, dividido em etapas sequenciais. Cada etapa deve ser pequena o suficiente para ser implementada e testada antes de avançar para a próxima.

O plano deve:
- Ter etapas numeradas e com título claro
- Indicar o que será construído em cada etapa
- Indicar como testar que a etapa está funcionando antes de avançar
- Ter um campo de status: `[ ] pendente` | `[x] concluído` | `[~] em andamento`
- Se atualizar conforme avançarmos — quando eu disser que uma etapa foi concluída, você marca como `[x]` e atualiza o plano

Comece pelo setup do ambiente e banco de dados, e vá até o MVP completo funcionando.

Não escreva código ainda. Primeiro me apresente o plano completo para eu aprovar antes de começar a implementar.
