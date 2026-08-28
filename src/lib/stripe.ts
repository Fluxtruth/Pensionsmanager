import fs from "fs";
import path from "path";
import Stripe from "stripe";

export function getStripeSecretKey(): string | null {
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/STRIPE_SECRET_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        const val = match[1].trim();
        process.env.STRIPE_SECRET_KEY = val;
        return val;
      }
    }
  } catch (e) {
    console.warn("Could not read .env.local directly:", e);
  }

  return null;
}

export function isStripeConfigured(): boolean {
  return !!getStripeSecretKey();
}

export function getStripeInstance(): Stripe {
  // Use placeholder during build time / CI environments where STRIPE_SECRET_KEY is absent
  const key = getStripeSecretKey() || "sk_test_placeholder_for_build_purposes";
  return new Stripe(key);
}
