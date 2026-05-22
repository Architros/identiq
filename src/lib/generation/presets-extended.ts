import { PRESET_ICONS } from "@/lib/generation/preset-icons";
import { presetBrief } from "@/lib/generation/preset-brief";
import type {
  GenerationPreset,
  PresetCategory,
} from "@/lib/generation/presets-types";

/** Presets from docs/more-presets.md not covered by the original Studio set. */
export const extendedGenerationPresets: GenerationPreset[] = [
  // Social — additions
  {
    id: "professional-insight",
    category: "social",
    categoryLabel: "Social Media",
    title: "Professional Insight",
    description: "Share expertise and industry insights",
    platformIcon: PRESET_ICONS.professionalInsight,
    defaultPrompt: presetBrief({
      deliverable:
        "Professional insight graphic for feed engagement — editorial layout with premium typography hierarchy.",
      composition:
        "Balanced spacing, subtle gradients using brand colors, clear headline zone, polished business aesthetic for a professional audience.",
      aspectRatio: "1:1",
      platformHint: "LinkedIn / professional feed · square 1:1",
    }),
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "Professional feed · 1200×1200 (1:1)",
    lockAspectRatio: true,
  },
  {
    id: "micro-post",
    category: "social",
    categoryLabel: "Social Media",
    title: "Micro Post",
    description: "Short-form post and thread visuals",
    platformIcon: PRESET_ICONS.microPost,
    defaultPrompt: presetBrief({
      deliverable:
        "Minimal shareable micro-post graphic for short-form social and threads.",
      composition:
        "Concise typography, strong visual hierarchy, clean negative space, modern internet-native layout with brand accent highlights.",
      aspectRatio: "16:9",
      platformHint: "X / threads landscape card · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Landscape social card · 16:9",
    lockAspectRatio: true,
  },
  {
    id: "community-post",
    category: "social",
    categoryLabel: "Social Media",
    title: "Community Post",
    description: "Engagement visuals for community channels",
    platformIcon: PRESET_ICONS.communityPost,
    defaultPrompt: presetBrief({
      deliverable:
        "Community engagement post graphic — friendly, approachable, social-first.",
      composition:
        "Welcoming composition, readable headline, brand palette, visually engaging without clutter.",
      aspectRatio: "1:1",
      platformHint: "Discord / community feed · 1:1",
    }),
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "Community square · 1:1",
    lockAspectRatio: true,
  },

  // Advertising — additions
  {
    id: "promo-highlight",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "Promo Highlight",
    description: "Launches, features, and limited offers",
    platformIcon: PRESET_ICONS.promoHighlight,
    defaultPrompt: presetBrief({
      deliverable:
        "Promotional highlight banner with bold marketing typography and clear offer focal point.",
      composition:
        "High visual impact, product or message hero, CTA-friendly zones, premium commercial finish.",
      aspectRatio: "21:9",
      platformHint: "Wide promo strip · 21:9",
    }),
    aspectRatio: "21:9",
    suggestedResolution: "2K",
    platformPixelHint: "Wide promotional banner · 21:9",
    lockAspectRatio: true,
  },
  {
    id: "retail-campaign",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "Retail Campaign",
    description: "Seasonal sales and retail promotions",
    platformIcon: PRESET_ICONS.retailCampaign,
    defaultPrompt: presetBrief({
      deliverable:
        "Retail campaign poster — energetic commercial layout for a sale or seasonal push.",
      composition:
        "Bold type system, branded color blocking, modern shopping-campaign energy while staying on-brand.",
      aspectRatio: "4:5",
      platformHint: "Portrait retail ad · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait campaign · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "outdoor-display",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "Outdoor Display",
    description: "Large-format billboard-style concepts",
    platformIcon: PRESET_ICONS.outdoorDisplay,
    defaultPrompt: presetBrief({
      deliverable:
        "High-impact outdoor display concept — billboard-ready minimal composition.",
      composition:
        "Oversized headline typography, cinematic negative space, few elements, maximum legibility at distance.",
      aspectRatio: "21:9",
      platformHint: "Billboard / outdoor · 21:9 ultra-wide",
    }),
    aspectRatio: "21:9",
    suggestedResolution: "2K",
    platformPixelHint: "Outdoor ultra-wide · 21:9",
    lockAspectRatio: true,
  },
  {
    id: "promo-reward",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "Promo Reward",
    description: "Offers, codes, and reward visuals",
    platformIcon: PRESET_ICONS.promoReward,
    defaultPrompt: presetBrief({
      deliverable:
        "Premium promotional reward graphic — voucher or offer card aesthetic.",
      composition:
        "Elegant typography, subtle branded patterns, centered offer message, clean commercial design.",
      aspectRatio: "1:1",
      platformHint: "Offer card · 1:1",
    }),
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "Square offer graphic · 1:1",
    lockAspectRatio: true,
  },

  // Brand announcements
  {
    id: "product-reveal",
    category: "announcements",
    categoryLabel: "Brand Announcements",
    title: "Product Reveal",
    description: "Launch new products or features",
    platformIcon: PRESET_ICONS.productReveal,
    defaultPrompt: presetBrief({
      deliverable:
        "Product reveal campaign visual — launch moment with dramatic focus on the offer.",
      composition:
        "Futuristic premium lighting, polished type hierarchy, hero product or feature metaphor, modern tech-brand energy.",
      aspectRatio: "16:9",
      platformHint: "Launch hero · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Launch wide · 16:9",
    lockAspectRatio: true,
  },
  {
    id: "event-promo",
    category: "announcements",
    categoryLabel: "Brand Announcements",
    title: "Event Promo",
    description: "Events, webinars, and invitations",
    platformIcon: PRESET_ICONS.eventPromo,
    defaultPrompt: presetBrief({
      deliverable:
        "Event promotion graphic — invitation-style announcement poster.",
      composition:
        "Dynamic energy, date/time headline zones, branded event poster layout, clear hierarchy.",
      aspectRatio: "4:5",
      platformHint: "Event poster · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait event · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "milestone-celebration",
    category: "announcements",
    categoryLabel: "Brand Announcements",
    title: "Milestone",
    description: "Celebrate wins and milestones",
    platformIcon: PRESET_ICONS.milestoneCelebration,
    defaultPrompt: presetBrief({
      deliverable:
        "Milestone celebration visual — achievement announcement with premium restraint.",
      composition:
        "Minimal luxury layout, celebratory but refined, elegant typography, subtle brand motifs.",
      aspectRatio: "1:1",
      platformHint: "Celebration square · 1:1",
    }),
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "Square milestone · 1:1",
    lockAspectRatio: true,
  },
  {
    id: "hiring-poster",
    category: "announcements",
    categoryLabel: "Brand Announcements",
    title: "We're Hiring",
    description: "Recruiting and talent campaigns",
    platformIcon: PRESET_ICONS.hiringPoster,
    defaultPrompt: presetBrief({
      deliverable:
        "Talent recruitment poster — employer-brand hiring campaign.",
      composition:
        "Bold clean headline, contemporary professional design, welcoming team-brand aesthetic.",
      aspectRatio: "4:5",
      platformHint: "Hiring poster · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait hiring · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "launch-teaser",
    category: "announcements",
    categoryLabel: "Brand Announcements",
    title: "Launch Teaser",
    description: "Build anticipation before launches",
    platformIcon: PRESET_ICONS.launchTeaser,
    defaultPrompt: presetBrief({
      deliverable:
        "Early-access launch teaser — suspenseful pre-announcement visual.",
      composition:
        "Minimal cinematic composition, subtle futuristic typography, mystery without clutter.",
      aspectRatio: "21:9",
      platformHint: "Teaser banner · 21:9",
    }),
    aspectRatio: "21:9",
    suggestedResolution: "2K",
    platformPixelHint: "Wide teaser · 21:9",
    lockAspectRatio: true,
  },
  {
    id: "seasonal-campaign",
    category: "announcements",
    categoryLabel: "Brand Announcements",
    title: "Seasonal Campaign",
    description: "Holiday and seasonal moments",
    platformIcon: PRESET_ICONS.seasonalCampaign,
    defaultPrompt: presetBrief({
      deliverable:
        "Seasonal branded campaign visual — holiday or moment-in-time creative.",
      composition:
        "Festive but on-brand palette, elegant commercial design, celebratory atmosphere aligned with brand tone.",
      aspectRatio: "4:5",
      platformHint: "Seasonal portrait · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait seasonal · 4:5",
    lockAspectRatio: true,
  },

  // Editorial & content
  {
    id: "blog-cover",
    category: "editorial",
    categoryLabel: "Editorial & Content",
    title: "Blog Cover",
    description: "Article headers and blog heroes",
    platformIcon: PRESET_ICONS.blogCover,
    defaultPrompt: presetBrief({
      deliverable:
        "Editorial blog cover image — magazine-inspired article header.",
      composition:
        "Clean editorial grid, premium headline space, subtle visual storytelling, readable at thumbnail size.",
      aspectRatio: "16:9",
      platformHint: "Blog hero · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Article wide · 16:9",
    lockAspectRatio: true,
  },
  {
    id: "newsletter-header",
    category: "editorial",
    categoryLabel: "Editorial & Content",
    title: "Newsletter Header",
    description: "Email campaign top banners",
    platformIcon: PRESET_ICONS.newsletterHeader,
    defaultPrompt: presetBrief({
      deliverable:
        "Branded newsletter header banner — email campaign top visual.",
      composition:
        "Minimal polished layout, strong brand bar, clean spacing, works at narrow email width.",
      aspectRatio: "21:9",
      platformHint: "Email header strip · 21:9",
    }),
    aspectRatio: "21:9",
    suggestedResolution: "2K",
    platformPixelHint: "Newsletter wide · 21:9",
    lockAspectRatio: true,
  },
  {
    id: "case-study-cover",
    category: "editorial",
    categoryLabel: "Editorial & Content",
    title: "Case Study Cover",
    description: "Client stories and success pages",
    platformIcon: PRESET_ICONS.caseStudyCover,
    defaultPrompt: presetBrief({
      deliverable:
        "Client success story cover — trust-building case study hero.",
      composition:
        "Professional business editorial, credible layout, space for client outcome headline.",
      aspectRatio: "16:9",
      platformHint: "Case study hero · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Case study wide · 16:9",
    lockAspectRatio: true,
  },
  {
    id: "podcast-cover",
    category: "editorial",
    categoryLabel: "Editorial & Content",
    title: "Podcast Cover",
    description: "Podcast and audio series artwork",
    platformIcon: PRESET_ICONS.podcastCover,
    defaultPrompt: presetBrief({
      deliverable:
        "Square podcast cover artwork — show identity at small sizes.",
      composition:
        "Bold centered composition, expressive brand mood, strong title treatment, clean hierarchy.",
      aspectRatio: "1:1",
      platformHint: "Podcast artwork · 1:1",
    }),
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "Podcast square · 1:1",
    lockAspectRatio: true,
  },
  {
    id: "presentation-cover",
    category: "editorial",
    categoryLabel: "Editorial & Content",
    title: "Presentation Cover",
    description: "Deck and slide opening visuals",
    platformIcon: PRESET_ICONS.presentationCover,
    defaultPrompt: presetBrief({
      deliverable:
        "Presentation opening slide cover — corporate deck title visual.",
      composition:
        "Minimal premium layout, elegant type system, confident negative space for slide decks.",
      aspectRatio: "16:9",
      platformHint: "Slide 16:9 cover",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Presentation · 16:9",
    lockAspectRatio: true,
  },

  // Social proof & quotes
  {
    id: "thought-leadership",
    category: "quotes",
    categoryLabel: "Social Proof & Quotes",
    title: "Thought Leadership",
    description: "Opinions and industry perspectives",
    platformIcon: PRESET_ICONS.thoughtLeadership,
    defaultPrompt: presetBrief({
      deliverable:
        "Thought-leadership statement card — bold opinion or insight quote layout.",
      composition:
        "Editorial typography hierarchy, quote-forward design, minimal supporting brand frame.",
      aspectRatio: "4:5",
      platformHint: "Quote card · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait quote · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "team-spotlight",
    category: "quotes",
    categoryLabel: "Social Proof & Quotes",
    title: "Team Spotlight",
    description: "Highlight people and contributors",
    platformIcon: PRESET_ICONS.teamSpotlight,
    defaultPrompt: presetBrief({
      deliverable:
        "Team spotlight feature card — people-focused employer or culture post.",
      composition:
        "Warm professional layout, space for name/role, minimal clean framing with brand colors.",
      aspectRatio: "4:5",
      platformHint: "Team feature · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait team · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "inspirational-quote",
    category: "quotes",
    categoryLabel: "Social Proof & Quotes",
    title: "Inspirational Quote",
    description: "Motivational typography posts",
    platformIcon: PRESET_ICONS.inspirationalQuote,
    defaultPrompt: presetBrief({
      deliverable:
        "Inspirational typography poster — uplifting branded quote visual.",
      composition:
        "Calming elegant composition, centered or asymmetric quote layout, premium lifestyle brand feel.",
      aspectRatio: "4:5",
      platformHint: "Inspirational portrait · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait quote art · 4:5",
    lockAspectRatio: true,
  },

  // Information design
  {
    id: "data-story",
    category: "information",
    categoryLabel: "Information Design",
    title: "Data Story",
    description: "Turn metrics into visual narratives",
    platformIcon: PRESET_ICONS.dataStory,
    defaultPrompt: presetBrief({
      deliverable:
        "Data storytelling infographic — statistics as a visual narrative.",
      composition:
        "Clean information hierarchy, chart or metric placeholders styled in brand colors, modern business viz aesthetic.",
      aspectRatio: "16:9",
      platformHint: "Infographic wide · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Data story · 16:9",
    lockAspectRatio: true,
  },
  {
    id: "process-explainer",
    category: "information",
    categoryLabel: "Information Design",
    title: "Process Explainer",
    description: "Explain workflows step by step",
    platformIcon: PRESET_ICONS.processExplainer,
    defaultPrompt: presetBrief({
      deliverable:
        "Step-by-step workflow explainer graphic — process breakdown.",
      composition:
        "Numbered or phased layout, clear flow arrows, instructional SaaS design, premium minimal icons in brand palette.",
      aspectRatio: "16:9",
      platformHint: "Process diagram · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Workflow wide · 16:9",
    lockAspectRatio: true,
  },
  {
    id: "comparison-chart",
    category: "information",
    categoryLabel: "Information Design",
    title: "Comparison Chart",
    description: "Compare products or plans",
    platformIcon: PRESET_ICONS.comparisonChart,
    defaultPrompt: presetBrief({
      deliverable:
        "Feature or plan comparison layout — structured side-by-side comparison.",
      composition:
        "Column grid, checkmarks or tiers, elegant information design, brand-colored highlights for recommended option.",
      aspectRatio: "16:9",
      platformHint: "Comparison layout · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Comparison wide · 16:9",
    lockAspectRatio: true,
  },
  {
    id: "stat-highlight",
    category: "information",
    categoryLabel: "Information Design",
    title: "Stat Highlight",
    description: "Hero a single key metric",
    platformIcon: PRESET_ICONS.statHighlight,
    defaultPrompt: presetBrief({
      deliverable:
        "Key statistic highlight graphic — one bold metric as the hero.",
      composition:
        "Oversized number typography, minimal supporting caption, strong visual hierarchy, brand accent on metric.",
      aspectRatio: "1:1",
      platformHint: "Stat card · 1:1",
    }),
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "Square stat · 1:1",
    lockAspectRatio: true,
  },

  // Brand headers & covers
  {
    id: "social-header",
    category: "headers",
    categoryLabel: "Brand Headers & Covers",
    title: "Social Header",
    description: "Expressive profile and page headers",
    platformIcon: PRESET_ICONS.socialHeader,
    defaultPrompt: presetBrief({
      deliverable:
        "Wide social header banner — profile or page cover expressing brand personality.",
      composition:
        "Atmospheric branded scene, logo placement zone, immersive wide composition without crowded text.",
      aspectRatio: "21:9",
      platformHint: "Profile cover · 21:9",
    }),
    aspectRatio: "21:9",
    suggestedResolution: "2K",
    platformPixelHint: "Social header · 21:9",
    lockAspectRatio: true,
  },
  {
    id: "channel-art",
    category: "headers",
    categoryLabel: "Brand Headers & Covers",
    title: "Channel Art",
    description: "Creator and channel cover visuals",
    platformIcon: PRESET_ICONS.channelArt,
    defaultPrompt: presetBrief({
      deliverable:
        "Creator channel cover art — cinematic branded channel banner.",
      composition:
        "Safe zones for title on left, visually rich branded environment, works on video platforms.",
      aspectRatio: "16:9",
      platformHint: "YouTube / channel · 16:9",
    }),
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "Channel cover · 16:9",
    lockAspectRatio: true,
  },

  // Product presentation
  {
    id: "product-hero",
    category: "product",
    categoryLabel: "Product Presentation",
    title: "Product Hero",
    description: "Hero showcase for products",
    platformIcon: PRESET_ICONS.productHero,
    defaultPrompt: presetBrief({
      deliverable:
        "Signature product hero showcase — premium commercial product presentation.",
      composition:
        "Luxury lighting, product-first minimal set, elegant shadows, brand logo subtle placement.",
      aspectRatio: "4:5",
      platformHint: "Product hero · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait product · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "lifestyle-scene",
    category: "product",
    categoryLabel: "Product Presentation",
    title: "Lifestyle Scene",
    description: "Products in real environments",
    platformIcon: PRESET_ICONS.lifestyleScene,
    defaultPrompt: presetBrief({
      deliverable:
        "Lifestyle product scene — product in a realistic premium environment.",
      composition:
        "Naturalistic setting, polished commercial photography mood, branded color accents in environment.",
      aspectRatio: "4:5",
      platformHint: "Lifestyle portrait · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Lifestyle · 4:5",
    lockAspectRatio: true,
  },

  // Merchandise
  {
    id: "hoodie-mockup",
    category: "merchandise",
    categoryLabel: "Merchandise",
    title: "Hoodie Mockup",
    description: "Streetwear hoodie branding",
    platformIcon: PRESET_ICONS.hoodieMockup,
    defaultPrompt: presetBrief({
      deliverable:
        "Urban hoodie apparel mockup — streetwear presentation with brand mark on garment.",
      composition:
        "Clean fashion flat or model torso, minimal background, logo on chest or sleeve, premium urban styling.",
      aspectRatio: "4:5",
      platformHint: "Apparel mockup · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait apparel · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "apparel-tee",
    category: "merchandise",
    categoryLabel: "Merchandise",
    title: "T-Shirt Graphic",
    description: "Minimal tee branding concepts",
    platformIcon: PRESET_ICONS.apparelTee,
    defaultPrompt: presetBrief({
      deliverable:
        "Essential t-shirt graphic mockup — minimalist apparel branding.",
      composition:
        "Centered logo or wordmark on tee, clean neutral background, subtle streetwear influence.",
      aspectRatio: "4:5",
      platformHint: "Tee mockup · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait tee · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "tote-mockup",
    category: "merchandise",
    categoryLabel: "Merchandise",
    title: "Tote Bag",
    description: "Branded tote and carry goods",
    platformIcon: PRESET_ICONS.toteMockup,
    defaultPrompt: presetBrief({
      deliverable:
        "Branded tote bag mockup — everyday carry lifestyle presentation.",
      composition:
        "Simple product shot, logo on bag face, premium lifestyle staging, soft natural light.",
      aspectRatio: "4:5",
      platformHint: "Tote mockup · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait tote · 4:5",
    lockAspectRatio: true,
  },
  {
    id: "cap-mockup",
    category: "merchandise",
    categoryLabel: "Merchandise",
    title: "Cap Mockup",
    description: "Cap and headwear branding",
    platformIcon: PRESET_ICONS.capMockup,
    defaultPrompt: presetBrief({
      deliverable:
        "Premium cap or headwear mockup — embroidered brand mark presentation.",
      composition:
        "Front-facing cap, clean minimal background, subtle urban style, legible logo embroidery.",
      aspectRatio: "4:5",
      platformHint: "Headwear mockup · 4:5",
    }),
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait cap · 4:5",
    lockAspectRatio: true,
  },
];

export const extendedPresetCategories: {
  id: PresetCategory;
  label: string;
}[] = [
  { id: "announcements", label: "Brand Announcements" },
  { id: "editorial", label: "Editorial & Content" },
  { id: "quotes", label: "Social Proof & Quotes" },
  { id: "information", label: "Information Design" },
  { id: "headers", label: "Brand Headers & Covers" },
  { id: "product", label: "Product Presentation" },
  { id: "merchandise", label: "Merchandise" },
];
