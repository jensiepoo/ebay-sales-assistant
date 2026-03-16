import OpenAI from "openai";
import { AIClient, GenerateDescriptionInput, DEFAULT_MODELS } from "../types";
import { buildPrompt } from "../prompt";

export class OpenAIClient implements AIClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model || DEFAULT_MODELS.openai;
  }

  async generateDescription(input: GenerateDescriptionInput): Promise<string> {
    const prompt = buildPrompt(input);

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return content;
  }
}
