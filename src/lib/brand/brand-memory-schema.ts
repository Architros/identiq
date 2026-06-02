import { z } from "zod";

const aspectRatioSchema = z.enum([
  "1:1",
  "9:16",
  "16:9",
  "4:5",
  "2:3",
  "21:9",
]);

export const brandMemorySchema = z.object({
  brand_style: z.string(),
  primary_color: z.string(),
  secondary_color: z.string(),
  accent_color: z.string(),
  font_pairing: z.string(),
  visual_language: z.string(),
  tone: z.string(),
});

export type BrandMemoryOutput = z.infer<typeof brandMemorySchema>;

export const wizardTypographySchema = z.object({
  hasCustomFont: z.boolean(),
  fontFamily: z.string().optional(),
  fontNotes: z.string().optional(),
});

export type WizardTypography = z.infer<typeof wizardTypographySchema>;

export const wizardOrchestrateInputSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  websiteSourceUrl: z.string().url().optional(),
  websiteSummary: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string(),
  sector: z.string(),
  feelings: z.array(z.string()),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string().optional(),
  }),
  audience: z.string().optional(),
  styleNotes: z.string().optional(),
  attachmentNames: z.array(z.string()).optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
  logoUrl: z.string().url().optional(),
  typography: wizardTypographySchema.optional(),
  assetSelections: z.record(z.string(), z.number().int().min(0)).optional(),
  assetAspectOverrides: z.record(z.string(), aspectRatioSchema).optional(),
});

export type WizardOrchestrateInput = z.infer<typeof wizardOrchestrateInputSchema>;
