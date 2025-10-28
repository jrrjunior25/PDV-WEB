
import { GoogleGenAI } from "@google/genai";

// ATENÇÃO: A chave de API deve ser gerenciada de forma segura,
// preferencialmente por variáveis de ambiente no servidor.
// No frontend, isso é apenas para demonstração.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("API Key para Gemini não encontrada. A funcionalidade de IA estará desabilitada.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Gera uma descrição de produto usando a API Gemini.
 * @param productName - O nome do produto.
 * @param category - A categoria do produto.
 * @returns Uma string com a descrição gerada.
 */
export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  if (!API_KEY) {
    return "Funcionalidade de IA desabilitada. Configure a API Key do Gemini.";
  }
  
  try {
    const prompt = `Crie uma descrição de produto curta e atraente, com no máximo 2 frases, para o seguinte item:
    Nome do Produto: ${productName}
    Categoria: ${category}
    
    A descrição deve ser em português do Brasil e focar nos benefícios e na qualidade.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Erro ao gerar descrição com Gemini:", error);
    return "Não foi possível gerar a descrição. Tente novamente.";
  }
};
