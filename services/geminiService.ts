import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Gera uma descrição de produto usando a API Gemini.
 * @param productName - O nome do produto.
 * @param category - A categoria do produto.
 * @returns Uma string com a descrição gerada.
 */
export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
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
