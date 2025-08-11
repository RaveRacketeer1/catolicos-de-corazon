import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Catholic spiritual director system prompt
const SPIRITUAL_DIRECTOR_PROMPT = `
Eres un director espiritual católico virtual, formado en la doctrina tradicional de la Iglesia Católica. 
Tu misión es acompañar espiritualmente a los fieles con sabiduría, compasión y fidelidad al Magisterio.

PRINCIPIOS FUNDAMENTALES:
- Siempre responde según la doctrina católica auténtica
- Cita las Sagradas Escrituras, el Catecismo, y los Santos Padres cuando sea apropiado
- Mantén un tono pastoral, cálido pero respetuoso
- Nunca contradices la enseñanza oficial de la Iglesia
- Promueve la oración, los sacramentos y la vida virtuosa
- Responde en español de manera clara y accesible

ÁREAS DE ESPECIALIZACIÓN:
- Dirección espiritual personal
- Interpretación de las Sagradas Escrituras
- Vida de oración y contemplación
- Discernimiento vocacional
- Vida sacramental
- Enseñanza moral católica
- Vidas de los santos

LIMITACIONES:
- No puedes absolver pecados (solo un sacerdote puede hacerlo)
- No reemplazas la dirección espiritual presencial
- Siempre recomienda acudir a un sacerdote para los sacramentos
- No das consejos médicos o legales

Responde siempre con caridad cristiana y sabiduría pastoral.
`;

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      systemInstruction: SPIRITUAL_DIRECTOR_PROMPT,
    });
  }

  async generateSpiritualResponse(message: string, conversationHistory: any[] = []): Promise<{
    response: string;
    tokensUsed: number;
  }> {
    try {
      // Build conversation context
      const context = conversationHistory
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.isUser ? 'Usuario' : 'Director Espiritual'}: ${msg.content}`)
        .join('\n');

      const fullPrompt = context 
        ? `Contexto de la conversación:\n${context}\n\nNueva consulta: ${message}`
        : message;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Estimate tokens (rough calculation)
      const tokensUsed = Math.ceil((fullPrompt.length + text.length) / 4);

      return {
        response: text,
        tokensUsed,
      };
    } catch (error) {
      console.error('Error generating spiritual response:', error);
      throw new Error('Error al generar respuesta espiritual. Por favor, intenta nuevamente.');
    }
  }

  async generatePersonalizedPrayer(intent: {
    category: string;
    personalContext?: string;
    liturgicalContext?: any;
  }): Promise<{
    title: string;
    content: string;
    tokensUsed: number;
  }> {
    try {
      const prayerPrompt = `
        Genera una oración católica personalizada con las siguientes características:
        - Categoría: ${intent.category}
        - Contexto personal: ${intent.personalContext || 'General'}
        - Contexto litúrgico: ${intent.liturgicalContext ? JSON.stringify(intent.liturgicalContext) : 'Tiempo Ordinario'}
        
        La oración debe:
        - Ser auténticamente católica y doctrinalmente correcta
        - Incluir referencias bíblicas apropiadas
        - Tener un tono pastoral y devoto
        - Ser apropiada para la categoría solicitada
        - Durar entre 1-2 minutos de recitación
        
        Formato de respuesta:
        TÍTULO: [Título de la oración]
        CONTENIDO: [Texto completo de la oración]
      `;

      const result = await this.model.generateContent(prayerPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const titleMatch = text.match(/TÍTULO:\s*(.+)/);
      const contentMatch = text.match(/CONTENIDO:\s*([\s\S]+)/);

      const title = titleMatch ? titleMatch[1].trim() : 'Oración Personalizada';
      const content = contentMatch ? contentMatch[1].trim() : text;

      const tokensUsed = Math.ceil((prayerPrompt.length + text.length) / 4);

      return {
        title,
        content,
        tokensUsed,
      };
    } catch (error) {
      console.error('Error generating prayer:', error);
      throw new Error('Error al generar oración personalizada. Por favor, intenta nuevamente.');
    }
  }

  async explainLiturgicalReading(reading: {
    book: string;
    chapter: string;
    verses: string;
    text: string;
  }): Promise<{
    explanation: string;
    spiritualApplication: string;
    tokensUsed: number;
  }> {
    try {
      const explanationPrompt = `
        Como director espiritual católico, explica esta lectura litúrgica:
        
        Lectura: ${reading.book} ${reading.chapter}, ${reading.verses}
        Texto: "${reading.text}"
        
        Proporciona:
        1. EXPLICACIÓN: Contexto histórico y significado teológico
        2. APLICACIÓN ESPIRITUAL: Cómo aplicar este pasaje en la vida diaria
        
        Mantén un tono pastoral y accesible, citando santos y doctores de la Iglesia cuando sea apropiado.
      `;

      const result = await this.model.generateContent(explanationPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response
      const explanationMatch = text.match(/EXPLICACIÓN:\s*([\s\S]*?)(?=APLICACIÓN ESPIRITUAL:|$)/);
      const applicationMatch = text.match(/APLICACIÓN ESPIRITUAL:\s*([\s\S]+)/);

      const explanation = explanationMatch ? explanationMatch[1].trim() : text;
      const spiritualApplication = applicationMatch ? applicationMatch[1].trim() : '';

      const tokensUsed = Math.ceil((explanationPrompt.length + text.length) / 4);

      return {
        explanation,
        spiritualApplication,
        tokensUsed,
      };
    } catch (error) {
      console.error('Error explaining reading:', error);
      throw new Error('Error al explicar la lectura. Por favor, intenta nuevamente.');
    }
  }
}

export const geminiService = new GeminiService();