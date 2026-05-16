import "server-only";
import { z } from "zod";

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_LLM_MODEL: z
    .string()
    .default("openai/gpt-4o-mini"),
  OPENROUTER_IMAGE_MODEL: z
    .string()
    .default("openai/gpt-5.4-image-2"),
  /** Dev uses same image model by default; AI_DEV_MODE still caps quantity/resolution. */
  OPENROUTER_IMAGE_MODEL_DEV: z
    .string()
    .default("openai/gpt-5.4-image-2"),
  GEMINI_API_KEY: z.string().optional(),
  AI_DEV_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_LLM_MODEL: process.env.OPENROUTER_LLM_MODEL,
    OPENROUTER_IMAGE_MODEL: process.env.OPENROUTER_IMAGE_MODEL,
    OPENROUTER_IMAGE_MODEL_DEV: process.env.OPENROUTER_IMAGE_MODEL_DEV,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_DEV_MODE: process.env.AI_DEV_MODE,
  });

  if (!parsed.success) {
    const details = JSON.stringify(parsed.error.flatten().fieldErrors);
    throw new Error(`Invalid environment variables: ${details}`);
  }

  const data = parsed.data;
  const isDev =
    data.AI_DEV_MODE || process.env.NODE_ENV === "development";

  return {
    ...data,
    isDev,
    imageModelId: isDev
      ? data.OPENROUTER_IMAGE_MODEL_DEV
      : data.OPENROUTER_IMAGE_MODEL,
  };
}

export const env = loadEnv();
