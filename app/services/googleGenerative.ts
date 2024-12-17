import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export class GoogleGenerativeService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: this.getDefaultConfig(),
    });
  }

  private getDefaultConfig() {
    return {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };
  }

  private async translateChunk(chineseText: string): Promise<string> {
    try {
      const prompt = `Translate this Chinese text to Vietnamese using a city novel tone:\n\n${chineseText}`;
 
      const result = await this.model.generateContent(prompt);
      console.log('Chunk translation result:', result);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Translation error for chunk:', error);
      throw error;
    }
  }

  async translate(chineseText: string, chunkSize: number = 2000): Promise<string> {
    try {
      // Split text into chunks
      const chunks: string[] = [];
      for (let i = 0; i < chineseText.length; i += chunkSize) {
        chunks.push(chineseText.slice(i, i + chunkSize));
      }

      console.log(`Splitting text into ${chunks.length} chunks`);

      // Translate each chunk with retry logic
      const translatedChunks = await Promise.all(
        chunks.map(async (chunk, index) => {
          let retries = 3;
          while (retries > 0) {
            try {
              console.log(`Translating chunk ${index + 1}/${chunks.length}`);
              const translated = await this.translateChunk(chunk);
              return translated;
            } catch (error) {
              retries--;
              if (retries === 0) throw error;
              console.log(`Retrying chunk ${index + 1}, ${retries} attempts left`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          }
        })
      );

      // Join translated chunks
      return translatedChunks.join(" ");
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async continueChat(chatSession: any, text: string): Promise<string> {
    try {
      const result = await chatSession.sendMessage(text);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Chat continuation error:', error);
      throw error;
    }
  }

  async startNewChat() {
    return this.model.startChat({
      generationConfig: this.getDefaultConfig(),
    });
  }
}

export const googleGenerativeService = new GoogleGenerativeService();
