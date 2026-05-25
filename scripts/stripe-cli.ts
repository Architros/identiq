/**
 * Runs the Stripe CLI with STRIPE_API_KEY from .env.local (STRIPE_SECRET_KEY).
 * Usage: npm run stripe -- customers list
 */
import { spawn } from "node:child_process";

const secret = process.env.STRIPE_SECRET_KEY?.trim();
if (!secret) {
  console.error(
    "STRIPE_SECRET_KEY is missing. Set sk_test_... in .env.local.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Pass Stripe CLI args, e.g. npm run stripe -- trigger checkout.session.completed");
  process.exit(1);
}

const child = spawn("stripe", args, {
  stdio: "inherit",
  env: { ...process.env, STRIPE_API_KEY: secret },
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
