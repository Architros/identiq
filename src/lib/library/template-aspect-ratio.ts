import type { AspectRatio } from "@/lib/generation/presets";
import type { LibraryTemplate } from "@/lib/library/types";

const RATIO_VALUES: { ratio: AspectRatio; value: number }[] = [
  { ratio: "1:1", value: 1 },
  { ratio: "4:5", value: 4 / 5 },
  { ratio: "9:16", value: 9 / 16 },
  { ratio: "2:3", value: 2 / 3 },
  { ratio: "16:9", value: 16 / 9 },
  { ratio: "21:9", value: 21 / 9 },
];

export function aspectRatioFromTemplateDimensions(
  width?: number,
  height?: number,
): AspectRatio {
  if (!width || !height || width <= 0 || height <= 0) {
    return "4:5";
  }
  const value = width / height;
  let best = RATIO_VALUES[0];
  let bestDelta = Math.abs(value - best.value);
  for (const candidate of RATIO_VALUES) {
    const delta = Math.abs(value - candidate.value);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best.ratio;
}

export function aspectRatioForLibraryTemplate(
  template: LibraryTemplate,
): AspectRatio {
  return aspectRatioFromTemplateDimensions(template.width, template.height);
}
