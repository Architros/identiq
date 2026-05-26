export const FAQ_ITEMS = [
  {
    id: "tokens",
    question: "How do tokens work?",
    answer:
      "Tokens are used when you generate images in Studio, remix library templates, or run brand starter packs. Your balance appears in the top bar. Purchase more anytime from Manage Subscription in your profile menu.",
  },
  {
    id: "brands",
    question: "How do I create or switch brands?",
    answer:
      "Use New Brand in the header or the brand selector to start a wizard. Each brand has its own memory, assets, and generation history. Switch brands from the selector without leaving the app.",
  },
  {
    id: "studio",
    question: "What is Studio?",
    answer:
      "Studio is where you pick a format preset (LinkedIn, Instagram, ads, and more), add optional direction, and generate on-brand images in one click. You can attach reference images for style guidance.",
  },
  {
    id: "library",
    question: "What is the Library?",
    answer:
      "Library lets you browse ad templates from top brands and recreate them with your active brand. Open a template, then remix it on Brand assets or Studio.",
  },
  {
    id: "storage",
    question: "Is there a limit on saved assets?",
    answer:
      "Yes. Each plan includes a cap on stored generated assets in your library. Upgrade your pack if you need more room.",
  },
] as const;

export type FaqItem = (typeof FAQ_ITEMS)[number];
