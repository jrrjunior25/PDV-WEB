import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

dotenv.config();

const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY não definida. Defina no .env');
  process.exit(1);
}

const app = express();
// Em dev, permita o origin do frontend. Em produção, restrinja para seu domínio.
app.use(cors({ origin: true }));
app.use(bodyParser.json());

app.post('/api/genai', async (req, res) => {
  try {
    const { prompt, options } = req.body;

    // Exemplo de proxy via fetch — substitua a URL e payload conforme a API real do GenAI
    const apiResponse = await fetch('https://genai.googleapis.com/v1beta/generateText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        ...options
      }),
    });

    const json = await apiResponse.json();
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({ error: json });
    }
    return res.json(json);
  } catch (err: any) {
    console.error('Erro no proxy /api/genai:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
