import { generateText } from "ai";
import { createVertex } from "@ai-sdk/google-vertex";
import { AIClient, GenerateDescriptionInput, DEFAULT_MODELS } from "../types";
import { buildPrompt } from "../prompt";

export class VertexClient implements AIClient {
  private model: ReturnType<ReturnType<typeof createVertex>>;

  constructor(projectId: string, model?: string, credentials?: string) {
    console.log('VertexClient init:', { projectId, model: model || DEFAULT_MODELS.vertex, hasCredentials: !!credentials });

    const vertex = createVertex({
      project: projectId,
      location: "us-central1",
      googleAuthOptions: credentials
        ? { credentials: JSON.parse(credentials) }
        : undefined,
    });

    this.model = vertex(model || DEFAULT_MODELS.vertex);
  }

  async generateDescription(input: GenerateDescriptionInput): Promise<string> {
    const prompt = buildPrompt(input);
    console.log('VertexClient.generateDescription: calling generateText...');

    const result = await generateText({
      model: this.model,
      prompt,
    });

    console.log('VertexClient.generateDescription: got response, length:', result.text?.length || 0);

    if (!result.text) {
      throw new Error("No text response from Vertex AI");
    }

    return result.text;
  }
}
