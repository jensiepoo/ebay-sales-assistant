import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { AIClient, GenerateDescriptionInput, DEFAULT_MODELS } from "../types";
import { buildPrompt } from "../prompt";

export class GoogleAIClient implements AIClient {
  private model: ReturnType<typeof google>;

  constructor(model?: string) {
    // Uses GOOGLE_GENERATIVE_AI_API_KEY env var automatically
    this.model = google(model || DEFAULT_MODELS.google);
  }

  async generateDescription(input: GenerateDescriptionInput): Promise<string> {
    const prompt = buildPrompt(input);

    const result = await generateText({
      model: this.model,
      prompt,
    });

    if (!result.text) {
      throw new Error("No text response from Google AI");
    }

    return result.text;
  }
}
