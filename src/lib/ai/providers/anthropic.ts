import Anthropic from "@anthropic-ai/sdk";
import { AIClient, GenerateDescriptionInput, DEFAULT_MODELS } from "../types";
import { buildPrompt } from "../prompt";

export class AnthropicClient implements AIClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || DEFAULT_MODELS.anthropic;
  }

  async generateDescription(input: GenerateDescriptionInput): Promise<string> {
    const prompt = buildPrompt(input);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text;
    }
    throw new Error("Unexpected response type from Anthropic");
  }
}
