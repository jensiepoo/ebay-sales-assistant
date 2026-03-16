export type AIProvider = "anthropic" | "vertex" | "openai" | "none";

export interface AIConfig {
  provider: AIProvider;
  model?: string;
}

export interface GenerateDescriptionInput {
  productName: string;
  brand?: string;
  model?: string;
  features?: string[];
  specifications?: Record<string, string>;
  condition?: string;
  msrp?: number;
}

export interface AIClient {
  generateDescription(input: GenerateDescriptionInput): Promise<string>;
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  vertex: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
  none: "",
};
