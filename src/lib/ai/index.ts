import { AIClient, AIProvider, AIConfig } from "./types";
import { AnthropicClient } from "./providers/anthropic";
import { VertexClient } from "./providers/vertex";
import { OpenAIClient } from "./providers/openai";

export * from "./types";

let cachedClient: AIClient | null = null;
let cachedConfig: string | null = null;

export function getAIClient(config?: AIConfig): AIClient | null {
  const provider = config?.provider || detectProvider();

  if (provider === "none") {
    return null;
  }

  const configKey = `${provider}:${config?.model || ""}`;
  if (cachedClient && cachedConfig === configKey) {
    return cachedClient;
  }

  cachedClient = createClient(provider, config?.model);
  cachedConfig = configKey;
  return cachedClient;
}

function detectProvider(): AIProvider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  // Support both JSON credentials and ADC (project ID only)
  if (process.env.GOOGLE_VERTEX_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT) return "vertex";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

function createClient(provider: AIProvider, model?: string): AIClient | null {
  switch (provider) {
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
      return new AnthropicClient(apiKey, model);
    }
    case "vertex": {
      const credentials = process.env.GOOGLE_VERTEX_CREDENTIALS;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT;

      if (credentials) {
        // JSON credentials provided - extract project ID from it
        const creds = JSON.parse(credentials);
        return new VertexClient(creds.project_id, model, credentials);
      } else if (projectId) {
        // Use Application Default Credentials
        return new VertexClient(projectId, model);
      }
      throw new Error("Set GOOGLE_CLOUD_PROJECT or GOOGLE_VERTEX_CREDENTIALS");
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY not set");
      return new OpenAIClient(apiKey, model);
    }
    default:
      return null;
  }
}

export function isAIEnabled(): boolean {
  return detectProvider() !== "none";
}
