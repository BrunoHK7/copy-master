import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/diagnostico', async (req, res) => {
  try {
    const { briefing } = req.body;

    const systemPrompt = `
      Você é um especialista em Copywriting para marketing de agências.
      Seu objetivo é analisar o briefing preenchido por um gestor de tráfego e identificar inconsistências de posicionamento e gerar perguntas para o gestor responder antes de avançarmos para a geração de copy.
      
      Diretrizes de Copy:
      - A copy não tenta convencer quem não quer. Ela aciona quem já está pronto para decidir.
      - O que funciona: Dado concreto e específico (preço, capacidade, data), Posicionamento por contraste, Especificidade de tempo, Copy curta.
      - O que nunca gerar: Headlines genéricas ("A festa dos seus sonhos"), Apelo à dor forçada, Promessas vagas, Excesso de texto.
      - Posicionamento por nível de autoridade:
        - Referência consolidada: copy direta, quase institucional.
        - Conhecido mas não dominante: dado concreto + diferencial.
        - Novo e pouco conhecido: constrói confiança, usa prova social.

      Analise o briefing fornecido e retorne ESTRITAMENTE um JSON com o seguinte formato:
      {
        "inconsistencias": ["inconsistencia 1", "inconsistencia 2"],
        "perguntas": ["pergunta 1", "pergunta 2"]
      }
      Não retorne nenhum texto fora do JSON.
    `;

    const userPrompt = `
      Aqui estão os dados do briefing:
      Nome do negócio: ${briefing.nome_negocio}
      Segmento: ${briefing.segmento}
      Localização: ${briefing.localizacao}
      Descrição do espaço/produto: ${briefing.descricao_espaco}
      Público atual: ${briefing.publico_atual}
      Público desejado: ${briefing.publico_desejado}
      Faixa de preço: ${briefing.faixa_preco}
      Nível de autoridade: ${briefing.nivel_autoridade}
      Tom de voz: ${briefing.tom_de_voz}
      Restrições: ${briefing.restricoes}
    `;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    });

    const responseText = msg.content[0].text;
    
    // Tenta parsear a resposta para JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      res.json(jsonResponse);
    } catch (e) {
      // Se a IA não retornar um JSON perfeito
      res.json({ error: "Erro ao parsear resposta da IA", raw: responseText });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor', message: error.message });
  }
});

app.post('/api/gerar-copy', async (req, res) => {
  try {
    const { briefing, formato } = req.body;

    let formatoRegras = "";
    if (formato === 'anuncio_instagram') {
      formatoRegras = `
        Formato: Anúncio de Instagram (Feed/Stories)
        - Linha 1: gancho — dado concreto, escassez real ou contraste. Máximo 6 palavras.
        - Linha 2: entregável ou diferencial específico.
        - Linha 3: CTA simples — "Chama no WhatsApp", "Agende uma visita".
        NUNCA use excesso de texto. Seja extremamente conciso.
      `;
    } else {
      formatoRegras = `
        Formato: Página de Vendas
        1. Headline — promessa específica, sem floreio.
        2. Subheadline — reforça o diferencial.
        3. O que está incluso — lista objetiva com especificidades.
        4. Para quem é — define o público ideal.
        5. Prova social — depoimento ou dado de resultado.
        6. Preço e condições — explícito quando possível.
        7. CTA — único, claro, fricção mínima.
      `;
    }

    const systemPrompt = `
      Você é um especialista em Copywriting de alta conversão.
      Sua tarefa é escrever uma copy baseada no briefing do cliente.
      
      Regras Essenciais de Copy:
      - Não tente convencer quem não quer. Acione quem já está pronto para decidir.
      - Use dados concretos: preço, capacidade, datas. Posicionamento por contraste funciona muito.
      - Posicionamento do cliente: O nível de autoridade é "${briefing.nivel_autoridade}". Adapte o tom.
        (Novo: construa confiança e prove socialmente / Conhecido: dado concreto + diferencial / Referência: direta, quase institucional).
      - Tom de voz: ${briefing.tom_de_voz}
      - RESTRIÇÕES ABSOLUTAS (O que NUNCA usar):
        - Headlines genéricas ("A festa dos seus sonhos", "Momentos inesquecíveis")
        - Apelo à dor forçada ("Você ainda não resolveu nada?")
        - Promessas vagas ("Sem dor de cabeça", "Tudo resolvido")
        - E respeite as seguintes restrições do gestor: ${briefing.restricoes}
      
      ESTRUTURA DA COPY:
      ${formatoRegras}

      Responda ESTRITAMENTE com a copy gerada. Não adicione "Aqui está a copy:", nem cumprimentos, nem explicações.
    `;

    const diagnosticoParseado = typeof briefing.diagnostico_ia === 'string' 
      ? JSON.parse(briefing.diagnostico_ia) 
      : briefing.diagnostico_ia;

    const userPrompt = `
      Aqui estão as informações completas do projeto:
      
      [BRIEFING DO CLIENTE]
      Nome: ${briefing.nome_negocio}
      Segmento: ${briefing.segmento}
      Localização: ${briefing.localizacao}
      Descrição: ${briefing.descricao_espaco}
      Público atual: ${briefing.publico_atual}
      Público desejado: ${briefing.publico_desejado}
      Faixa de Preço: ${briefing.faixa_preco}
      
      [DIAGNÓSTICO DA IA SOBRE O POSICIONAMENTO]
      Inconsistências apontadas: ${diagnosticoParseado?.inconsistencias?.join(', ')}
      Perguntas feitas: ${diagnosticoParseado?.perguntas?.join(' ')}
      
      [RESPOSTAS DO GESTOR DE TRÁFEGO PARA ALINHAMENTO]
      Respostas e decisões do gestor: ${briefing.respostas_gestor}
      
      Gere a copy final no formato solicitado.
    `;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    });

    res.json({ copy: msg.content[0].text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar copy', message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
