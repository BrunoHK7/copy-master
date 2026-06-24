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
      model: "claude-3-5-sonnet-20240620",
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
