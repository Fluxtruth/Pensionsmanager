import fs from "fs";
import path from "path";
import Stripe from "stripe";

export function getStripeSecretKey(): string {
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

  throw new Error("STRIPE_SECRET_KEY is not defined. Please set it in .env.local");
}

export function getStripeInstance(): Stripe {
  const key = getStripeSecretKey();
  return new Stripe(key);
}
