/**
 * Forwards Stripe webhooks to the local Next.js API using STRIPE_SECRET_KEY from .env.local.
 * Run: npm run stripe:listen
 */
import { spawn } from "node:child_process";

const secret = process.env.STRIPE_SECRET_KEY?.trim();
if (!secret) {
  console.error(
    "STRIPE_SECRET_KEY is missing. Set it in .env.local (sk_test_...).",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  STRIPE_API_KEY: secret,
};

console.log(
  "Forwarding Stripe webhooks → http://localhost:3000/api/billing/webhook",
);
console.log(
  "If checkout fulfillment lags, copy the whsec_... secret from this output into STRIPE_WEBHOOK_SECRET and restart npm run dev.\n",
);

const child = spawn(
  "stripe",
  ["listen", "--forward-to", "localhost:3000/api/billing/webhook"],
  { stdio: "inherit", env, shell: true },
);

child.on("exit", (code) => process.exit(code ?? 0));
