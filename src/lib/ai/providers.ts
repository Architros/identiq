import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { env } from "@/lib/env";

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  ...(env.GEMINI_API_KEY
    ? { api_keys: { google: env.GEMINI_API_KEY } }
    : {}),
});

export const llmModel = openrouter.chat(env.OPENROUTER_LLM_MODEL);

export function getImageModel() {
  return openrouter.imageModel(env.imageModelId);
}

export function getActiveImageModelId() {
  return env.imageModelId;
}

export function isAiDevMode() {
  return env.isDev;
}
