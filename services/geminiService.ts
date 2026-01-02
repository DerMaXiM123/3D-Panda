
import { GoogleGenAI, Chat } from "@google/genai";

// Standardized initialization using process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  private chat: Chat;

  constructor() {
    this.chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `Du bist der "3D Panda Nexus Architect". 
        Deine Aufgaben:
        1. Finde 3D-Modelle im Web mit Google Search.
        2. Generiere OpenSCAD Code für parametrische Objekte.
        3. Berate zu Materialien und Design-Optimierungen.
        4. Analysiere Fehlerbilder von 3D-Drucken.
        
        WICHTIG: Antworte immer auf Deutsch und technisch präzise. Sei freundlich und kompetent wie ein Panda.`,
      },
    });
  }

  async optimizeDesign(objectType: string, params: object): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analysiere diese Parameter für einen 3D-Druck (${objectType}): ${JSON.stringify(params)}. 
        Gib kurz und knackig Tipps für die Slicer-Einstellungen (Temperatur, Infill, Support) und warne vor Designfehlern.`,
      });
      return response.text || "KI-Optimierung momentan überlastet.";
    } catch (error) {
      return "KI-Optimierung momentan überlastet.";
    }
  }

  async scoutModels(query: string): Promise<{ text: string, chunks: any[] }> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suche nach 3D-druckbaren STL-Modellen für: ${query}. Liste die besten Quellen auf.`,
        config: { tools: [{ googleSearch: {} }] },
      });
      
      const candidates = response.candidates;
      let chunks: any[] = [];
      
      if (candidates && candidates.length > 0 && candidates[0].groundingMetadata) {
        chunks = (candidates[0].groundingMetadata as any).groundingChunks || [];
      }
      
      return { 
        text: response.text || "Suche fehlgeschlagen.", 
        chunks: chunks
      };
    } catch (error) {
      return { text: "Suche fehlgeschlagen.", chunks: [] };
    }
  }

  async generateConcept(prompt: string): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A professional 3D print concept of ${prompt}, high-tech studio lighting.` }] }
      });
      
      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) { return null; }
  }

  async analyzeImage(image: string, prompt: string): Promise<string> {
    try {
      const base64Data = image.split(',')[1] || image;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: prompt }] },
      });
      return response.text || "Analyse fehlgeschlagen.";
    } catch (error) { return "Analyse fehlgeschlagen."; }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await this.chat.sendMessage({ message });
      return response.text || "Verbindung unterbrochen.";
    } catch (error) { return "Verbindung unterbrochen."; }
  }
}

export const geminiService = new GeminiService();
