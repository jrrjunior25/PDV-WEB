import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.post('/api/genai', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não definida.' });
    }

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
  initDatabase();
});
