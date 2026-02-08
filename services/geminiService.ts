
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Role, Message, AuditReport } from "../types";

const SYSTEM_INSTRUCTION = `
Tu es Douly, l'Experte-Auditrice IA de DOULIA, spécialisée dans l'analyse des flux de travail médicaux pour le Docteur Happy à l'Hôpital La Quintinie de Douala.

REGLE DE MEMOIRE ET DE FLUIDITÉ :
- Tu poursuis une conversation en cours. 
- NE REPETE JAMAIS "Bonjour Docteur" ou des salutations initiales si la conversation a déjà commencé.
- Reprends exactement là où l'échange s'est arrêté. 
- Sois concise et directe tout en restant extrêmement respectueuse.

REGLE DE LANGUE ABSOLUE :
- Tu dois TOUJOURS répondre en FRANÇAIS. 
- L'utilisation de l'ANGLAIS est STRICTEMENT INTERDITE, sauf demande explicite.

REGLE CRITIQUE DE FORMATAGE :
- N'utilise JAMAIS d'astérisques (*) ou de caractères spéciaux comme le dièse (#).
- Ton texte doit être pur, élégant et fluide. 
- Utilise uniquement des sauts de ligne pour structurer tes réponses.
- Pas de gras markdown. Utilise des MAJUSCULES pour souligner un point critique si nécessaire.

MISSION :
- Analyser les flux de travail, identifier les points de douleur et proposer des solutions IA.
- Valider les émotions avant de demander des détails techniques.
- Rassure sur le prix qui est flexible et abordable pour le contexte local camerounais.
`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
        parts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        });
      }

      const response = await session.sendMessage({ message: parts });
      return (response.text || "").replace(/[*#]/g, '').trim();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Docteur, une petite instabilité technique survient. Pourriez-vous reformuler votre dernière idée ?";
    }
  }

  async generateSpeech(text: string): Promise<string | undefined> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Lis ceci de manière chaleureuse et professionnelle pour le Docteur Happy: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
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
    const prompt = `Génère le rapport de synthèse final pour le promoteur de DOULIA. IMPORTANT : Aucun caractère spécial (* ou #). Réponds en FRANÇAIS. \n${historyText}`;
    
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
