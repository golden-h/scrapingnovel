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
      model: "gemini-2.0-flash-thinking-exp-1219",
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
      const prompt = `Task:
      As an experienced literary translator specializing in modern city novels, translate the provided Chinese text into Vietnamese, capturing the atmospheric, poetic, and reflective tone typical of the genre.

      Self-Verification Steps:
      Before finalizing the translation, verify the following:

      Completeness: Ensure no part of the original text is missing.
      No Original Text: Check that no Chinese words or characters remain in the output.
      Fluency: Confirm the translated text reads naturally in Vietnamese and reflects the poetic, reflective tone of city novels.
      Output Format:
      Vietnamese translation only.
      Do not include explanations, comments, or original text.
      Examples
      Input:
      [Chinese text: "在繁华的都市中，他沉默地走在熙攘的人群中，寻找着属于自己的归宿。霓虹灯闪烁，车水马龙，他的内心却一片空荡，仿佛世界的喧嚣与他无关。"]

      Self-Test Result (Internal to Model):
      Completeness: ✅
      No Original Text: ✅
      Fluency Check: ✅
      Output:
      [Vietnamese translation: "Trong thành phố phồn hoa, anh lặng lẽ bước đi giữa đám đông tấp nập, tìm kiếm một chốn thuộc về mình. Đèn neon nhấp nháy, xe cộ nối đuôi không ngớt, nhưng lòng anh trống trải vô cùng, như thể sự ồn ào của thế giới chẳng liên quan gì đến anh."]

      \n\n${chineseText}`;
 
      const result = await this.model.generateContent(prompt);
      console.log('Chunk translation result:', result);
      const response = await result.response;
      const translatedText = response.text();
      return translatedText.replace(/<[^>]*>/g, '');
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
