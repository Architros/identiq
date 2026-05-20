import { z } from "zod";

export const generationRequestSchema = z.object({
  chatId: z.string().optional(),
  brandId: z.string().min(1),
  brandDisplayName: z.string().optional(),
  brandMemory: z.object({
    brand_style: z.string(),
    primary_color: z.string(),
    secondary_color: z.string(),
    font_pairing: z.string(),
    visual_language: z.string(),
    tone: z.string(),
  }),
  brandAssets: z.array(
    z.object({
      type: z.enum([
        "logo_primary",
        "logo_secondary",
        "logo_icon",
        "logo_monochrome",
        "logo_white",
      ]),
      url: z.string(),
      label: z.string(),
    }),
  ),
  presets: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      defaultPrompt: z.string(),
      aspectRatio: z.string(),
    }),
  ),
  userPrompt: z.string(),
  imageAssist: z.boolean(),
  referenceImageCount: z.number().int().min(0),
  settings: z.object({
    aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5", "2:3", "21:9"]),
    resolution: z.enum(["1K", "2K"]),
    quantity: z.number().int().min(1).max(4),
  }),
});

export type GenerationRequestBody = z.infer<typeof generationRequestSchema>;
