/**
 * Creates Identiq subscription product + recurring prices in Stripe from the app catalog.
 * Prints Supabase SQL to wire stripe_price_id columns.
 *
 * Usage:
 *   npm run stripe:seed-prices
 *   npm run stripe:seed-prices -- --dry-run
 */
import Stripe from "stripe";
import { CUSTOM_PACK_TIERS } from "../src/lib/billing/custom-pack-pricing";
import { listDisplayPacks } from "../src/lib/billing/plan-catalog";

const ANNUAL_MONTHS_CHARGED = 10;
const PRODUCT_NAME = "Identiq Subscription";
const CATALOG_VERSION = "2026-05-v2";

type Interval = "month" | "year";

type PriceSpec = {
  lookupKey: string;
  unitAmount: number;
  interval: Interval;
  nickname: string;
  metadata: Record<string, string>;
};

function annualCents(monthlyCents: number): number {
  return monthlyCents * ANNUAL_MONTHS_CHARGED;
}

function buildPlanSpecs(): PriceSpec[] {
  const specs: PriceSpec[] = [];
  for (const plan of listDisplayPacks()) {
    specs.push(
      {
        lookupKey: `identiq_${plan.id}_monthly_${CATALOG_VERSION}`,
        unitAmount: plan.monthlyPriceCents,
        interval: "month",
        nickname: `Identiq ${plan.name} Monthly`,
        metadata: {
          identiq_plan_id: plan.id,
          identiq_interval: "monthly",
          identiq_tokens: String(plan.monthlyTokens),
          identiq_catalog: CATALOG_VERSION,
        },
      },
      {
        lookupKey: `identiq_${plan.id}_annual_${CATALOG_VERSION}`,
        unitAmount: annualCents(plan.monthlyPriceCents),
        interval: "year",
        nickname: `Identiq ${plan.name} Annual`,
        metadata: {
          identiq_plan_id: plan.id,
          identiq_interval: "annual",
          identiq_tokens: String(plan.monthlyTokens * 12),
          identiq_catalog: CATALOG_VERSION,
        },
      },
    );
  }
  return specs;
}

function buildScaleSpecs(): PriceSpec[] {
  const specs: PriceSpec[] = [];
  for (const tier of CUSTOM_PACK_TIERS) {
    specs.push(
      {
        lookupKey: `identiq_scale_${tier.monthlyTokens}_monthly_${CATALOG_VERSION}`,
        unitAmount: tier.monthlyPriceCents,
        interval: "month",
        nickname: `Identiq Scale ${tier.monthlyTokens} Monthly`,
        metadata: {
          identiq_plan_id: "custom",
          identiq_interval: "monthly",
          identiq_tokens: String(tier.monthlyTokens),
          identiq_catalog: CATALOG_VERSION,
        },
      },
      {
        lookupKey: `identiq_scale_${tier.monthlyTokens}_annual_${CATALOG_VERSION}`,
        unitAmount: annualCents(tier.monthlyPriceCents),
        interval: "year",
        nickname: `Identiq Scale ${tier.monthlyTokens} Annual`,
        metadata: {
          identiq_plan_id: "custom",
          identiq_interval: "annual",
          identiq_tokens: String(tier.monthlyTokens * 12),
          identiq_catalog: CATALOG_VERSION,
        },
      },
    );
  }
  return specs;
}

async function findProductByName(
  stripe: Stripe,
  name: string,
): Promise<Stripe.Product | null> {
  const listed = await stripe.products.list({ limit: 100, active: true });
  return listed.data.find((p) => p.name === name) ?? null;
}

async function getOrCreateProduct(
  stripe: Stripe,
  dryRun: boolean,
): Promise<string> {
  const existing = await findProductByName(stripe, PRODUCT_NAME);
  if (existing) {
    console.log(`Product exists: ${existing.id} (${PRODUCT_NAME})`);
    return existing.id;
  }

  if (dryRun) {
    console.log(`[dry-run] Would create product: ${PRODUCT_NAME}`);
    return "prod_DRY_RUN";
  }

  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description:
      "Identiq token packs — Starter, Pro, Studio, and Scale volume plans.",
    metadata: { identiq_catalog: CATALOG_VERSION },
  });
  console.log(`Created product: ${product.id}`);
  return product.id;
}

async function getOrCreatePrice(
  stripe: Stripe,
  productId: string,
  spec: PriceSpec,
  dryRun: boolean,
): Promise<string> {
  const listed = await stripe.prices.list({
    lookup_keys: [spec.lookupKey],
    limit: 1,
  });
  const existing = listed.data[0];
  if (existing) {
    if (existing.unit_amount !== spec.unitAmount) {
      throw new Error(
        `Price ${spec.lookupKey} exists as ${existing.id} at ${existing.unit_amount}¢ but catalog expects ${spec.unitAmount}¢. Archive the old price in Stripe, then rerun.`,
      );
    }
    console.log(`  reuse ${spec.lookupKey} → ${existing.id}`);
    return existing.id;
  }

  if (dryRun) {
    console.log(
      `  [dry-run] Would create ${spec.lookupKey} (${spec.unitAmount}¢/${spec.interval})`,
    );
    return `price_DRY_RUN_${spec.lookupKey}`;
  }

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: spec.unitAmount,
    lookup_key: spec.lookupKey,
    transfer_lookup_key: true,
    nickname: spec.nickname,
    metadata: spec.metadata,
    recurring: { interval: spec.interval },
  });
  console.log(`  created ${spec.lookupKey} → ${price.id}`);
  return price.id;
}

function printSupabaseSql(
  planPrices: Record<string, { monthly: string; annual: string }>,
  scalePrices: Record<number, { monthly: string; annual: string }>,
): void {
  console.log("\n-- ========== Supabase SQL (copy into SQL Editor) ==========\n");

  for (const plan of listDisplayPacks()) {
    const ids = planPrices[plan.id];
    if (!ids) continue;
    console.log(`UPDATE public.plans SET
  token_amount = ${plan.monthlyTokens},
  price_cents = ${plan.monthlyPriceCents},
  stripe_price_id = '${ids.monthly}',
  stripe_price_id_annual = '${ids.annual}'
WHERE id = '${plan.id}';`);
    console.log();
  }

  console.log(`UPDATE public.plans SET
  token_amount = 40,
  price_cents = 500
WHERE id = 'welcome';
-- Welcome uses inline checkout price_data; no stripe_price_id needed.
`);

  for (const tier of CUSTOM_PACK_TIERS) {
    const ids = scalePrices[tier.monthlyTokens];
    if (!ids) continue;
    console.log(`UPDATE public.plan_scale_prices SET
  monthly_tokens = ${tier.monthlyTokens},
  monthly_price_cents = ${tier.monthlyPriceCents},
  annual_price_cents = ${annualCents(tier.monthlyPriceCents)},
  stripe_price_id = '${ids.monthly}',
  stripe_price_id_annual = '${ids.annual}',
  active = true
WHERE monthly_tokens = ${tier.monthlyTokens};

-- If no row matched, insert:
INSERT INTO public.plan_scale_prices (
  monthly_tokens, monthly_price_cents, annual_price_cents,
  stripe_price_id, stripe_price_id_annual, active
)
SELECT ${tier.monthlyTokens}, ${tier.monthlyPriceCents}, ${annualCents(tier.monthlyPriceCents)},
  '${ids.monthly}', '${ids.annual}', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_scale_prices WHERE monthly_tokens = ${tier.monthlyTokens}
);
`);
  }

  console.log(`-- Deactivate legacy scale tiers if present:
UPDATE public.plan_scale_prices SET active = false
WHERE monthly_tokens IN (500, 1000, 2000, 5000) AND active = true;
`);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    console.error("STRIPE_SECRET_KEY is missing. Set it in .env.local.");
    process.exit(1);
  }

  const mode = secret.startsWith("sk_live_") ? "LIVE" : "TEST";
  console.log(`Stripe mode: ${mode}${dryRun ? " (dry-run)" : ""}`);
  if (mode === "LIVE" && !dryRun) {
    console.log("Creating real live catalog prices…\n");
  }

  const stripe = new Stripe(secret);
  const productId = await getOrCreateProduct(stripe, dryRun);

  const planPrices: Record<string, { monthly: string; annual: string }> = {};
  const scalePrices: Record<number, { monthly: string; annual: string }> = {};

  console.log("\nPlans (starter, pro, studio):");
  for (const plan of listDisplayPacks()) {
    const monthlySpec = buildPlanSpecs().find(
      (s) =>
        s.metadata.identiq_plan_id === plan.id &&
        s.metadata.identiq_interval === "monthly",
    )!;
    const annualSpec = buildPlanSpecs().find(
      (s) =>
        s.metadata.identiq_plan_id === plan.id &&
        s.metadata.identiq_interval === "annual",
    )!;
    console.log(`\n${plan.name} ($${plan.monthlyPriceCents / 100}/mo, ${plan.monthlyTokens} tokens):`);
    const monthly = await getOrCreatePrice(stripe, productId, monthlySpec, dryRun);
    const annual = await getOrCreatePrice(stripe, productId, annualSpec, dryRun);
    planPrices[plan.id] = { monthly, annual };
  }

  console.log("\nScale tiers:");
  for (const tier of CUSTOM_PACK_TIERS) {
    const monthlySpec = buildScaleSpecs().find(
      (s) =>
        s.metadata.identiq_tokens === String(tier.monthlyTokens) &&
        s.metadata.identiq_interval === "monthly",
    )!;
    const annualSpec = buildScaleSpecs().find(
      (s) =>
        s.metadata.identiq_tokens === String(tier.monthlyTokens) &&
        s.metadata.identiq_interval === "annual",
    )!;
    console.log(
      `\nScale ${tier.monthlyTokens} ($${tier.monthlyPriceCents / 100}/mo):`,
    );
    const monthly = await getOrCreatePrice(stripe, productId, monthlySpec, dryRun);
    const annual = await getOrCreatePrice(stripe, productId, annualSpec, dryRun);
    scalePrices[tier.monthlyTokens] = { monthly, annual };
  }

  printSupabaseSql(planPrices, scalePrices);
  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
