
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Role, Message, AuditReport } from "../types";

// Accès ultra-sécurisé aux variables Vercel
const getApiKey = (): string => {
  if (typeof window !== 'undefined' && (window as any).process?.env?.GEMINI_API_KEY) {
    return (window as any).process.env.GEMINI_API_KEY;
  }
  return (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) 
    ? process.env.GEMINI_API_KEY 
    : (process.env?.API_KEY || '');
};

const SYSTEM_INSTRUCTION = `
Tu es Douly, l'Experte-Auditrice IA de DOULIA, spécialisée dans l'analyse des flux de travail médicaux pour le Docteur Happy à l'Hôpital La Quintinie de Douala.
Réponds TOUJOURS en Français. Pas de caractères spéciaux comme les astérisques.
`;

export class GeminiService {
  private aiInstance: GoogleGenAI | null = null;

  // On initialise l'IA seulement quand on en a besoin (Lazy loading)
  private get ai(): GoogleGenAI {
    if (!this.aiInstance) {
      const key = getApiKey();
      if (!key) {
        console.warn("ATTENTION : Clé API manquante dans les variables d'environnement Vercel.");
      }
      this.aiInstance = new GoogleGenAI({ apiKey: key });
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
    } catch (error) {
      console.error("Erreur Gemini:", error);
      return "Docteur, une instabilité technique survient. Vérifiez la configuration de la clé API.";
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
      return undefined;
    }
  }

  async generateFinalReport(history: Message[]): Promise<AuditReport> {
    const historyText = history.map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Génère le rapport final JSON : \n${historyText}`;
    
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
  }
}

export const geminiService = new GeminiService();
