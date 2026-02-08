
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Role, Message, AuditReport } from "../types";

/**
 * Accès hautement sécurisé aux variables d'environnement.
 * Gère les cas spécifiques de Vercel et du runtime local.
 */
const getSafeEnv = (key: string): string => {
  try {
    // 1. Tentative via window.process (polyfillé dans index.html)
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
      return (window as any).process.env[key];
    }
    // 2. Tentative via process.env standard (Node context ou build-time injection)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {
    // Silence intentional to prevent console noise if error occurs in access
  }
  return '';
};

const getApiKey = (): string => {
  // On priorise GEMINI_API_KEY, puis API_KEY
  return getSafeEnv('GEMINI_API_KEY') || getSafeEnv('API_KEY');
};

const SYSTEM_INSTRUCTION = `
Tu es Douly, l'Experte-Auditrice IA de DOULIA, spécialisée dans l'analyse des flux de travail médicaux pour le Docteur Happy à l'Hôpital La Quintinie de Douala.
Réponds TOUJOURS en Français. Pas de caractères spéciaux comme les astérisques ou les hashtags de titres.
Sois chaleureuse, respectueuse et concise.
`;

export class GeminiService {
  private aiInstance: GoogleGenAI | null = null;

  private get ai(): GoogleGenAI {
    if (!this.aiInstance) {
      const key = getApiKey();
      if (!key) {
        // Au lieu de crash, on logue pour le debug
        console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
      }
      this.aiInstance = new GoogleGenAI({ apiKey: key || 'MISSING_KEY' });
    }
    return this.aiInstance;
  }

  async sendMessage(message: string, history: Message[], fileData?: { data: string, mimeType: string }): Promise<string> {
    try {
      const historyParts = history.map(m => ({
        role: m.role === Role.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const session = this.ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.6,
        },
        history: historyParts.slice(-10)
      });

      let parts: any[] = [{ text: message }];
      if (fileData) {
        parts.push({ inlineData: { data: fileData.data, mimeType: fileData.mimeType } });
      }

      const response = await session.sendMessage({ message: parts });
      return (response.text || "").replace(/[*#]/g, '').trim();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // Gestion native des exceptions sans node-domexception
      if (error instanceof Error && error.name === 'AbortError') {
        return "La requête a été interrompue. Veuillez réessayer.";
      }
      return "Docteur, une instabilité technique survient. Veuillez vérifier la connexion ou la configuration de la clé API.";
    }
  }

  async generateSpeech(text: string): Promise<string | undefined> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Lis ceci : ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS Error:", error);
      return undefined;
    }
  }

  async generateFinalReport(history: Message[]): Promise<AuditReport> {
    const historyText = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Analyse cette conversation et génère le rapport final JSON : \n${historyText}`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dailyLife: { type: Type.STRING },
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              personalChallenges: { type: Type.STRING },
              priorityFeature: { type: Type.STRING },
              timeGain: { type: Type.STRING },
              serviceImpact: { type: Type.STRING },
              technicalComplexity: { type: Type.STRING, enum: ['Bas', 'Moyen', 'Élevé'] },
              recommendedModel: { type: Type.STRING },
              budgetNote: { type: Type.STRING },
            },
            required: ['dailyLife', 'painPoints', 'priorityFeature', 'technicalComplexity']
          }
        }
      });

      return JSON.parse(response.text.trim()) as AuditReport;
    } catch (error) {
      console.error("Report Generation Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
