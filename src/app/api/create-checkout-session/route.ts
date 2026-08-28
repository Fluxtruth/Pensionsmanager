import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeInstance, isStripeConfigured } from "@/lib/stripe";

const PLAN_DETAILS: Record<string, { name: string; amount: number; description: string }> = {
  S: {
    name: "Pensionsmanager - Tarif S-Small (bis 5 Zimmer)",
    amount: 2499,
    description: "Monatliches Abonnement für bis zu 5 Zimmer inklusive voller Funktionsumfang",
  },
  M: {
    name: "Pensionsmanager - Tarif M-Medium (bis 15 Zimmer)",
    amount: 3499,
    description: "Monatliches Abonnement für bis zu 15 Zimmer inklusive voller Funktionsumfang",
  },
  L: {
    name: "Pensionsmanager - Tarif L-Large (ab 16 Zimmer)",
    amount: 4499,
    description: "Monatliches Abonnement für unbegrenzte Zimmeranzahl inklusive voller Funktionsumfang",
  },
};

export async function POST(req: Request) {
  try {
    const stripe = getStripeInstance();
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe ist noch nicht vollständig eingerichtet (STRIPE_SECRET_KEY fehlt)." },
        { status: 503 }
      );
    }

    let priceId: string | undefined;
    let planId: string = "S";

    // Parse body if provided (JSON or form-data)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      if (body.priceId) priceId = body.priceId;
      if (body.planId) planId = body.planId;
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        if (formData.get("priceId")) priceId = String(formData.get("priceId"));
        if (formData.get("planId")) planId = String(formData.get("planId"));
      }
    }

    const selectedPlan = PLAN_DETAILS[planId] || PLAN_DETAILS.S;

    // Check if an explicit pre-created Stripe price ID exists
    const envPriceId =
      planId === "S"
        ? process.env.STRIPE_PRICE_S
        : planId === "M"
        ? process.env.STRIPE_PRICE_M
        : planId === "L"
        ? process.env.STRIPE_PRICE_L
        : process.env.STRIPE_DEFAULT_PRICE_ID;

    const targetPriceId = priceId || envPriceId;

    const isRealPriceId =
      targetPriceId &&
      targetPriceId.startsWith("price_") &&
      targetPriceId !== "price_..." &&
      targetPriceId !== "price_default";

    // Use pre-created price ID if available, otherwise generate dynamic price_data
    const line_items = isRealPriceId
      ? [
          {
            price: targetPriceId,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: selectedPlan.name,
                description: selectedPlan.description,
              },
              unit_amount: selectedPlan.amount,
              recurring: {
                interval: "month" as const,
              },
            },
            quantity: 1,
          },
        ];

    const mode: Stripe.Checkout.SessionCreateParams.Mode = "subscription";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: "hosted_page",
      mode,
      billing_address_collection: "required",
      name_collection: {
        individual: {
          enabled: true,
        },
        business: {
          enabled: true,
        },
      },
      payment_method_collection: "always",
      allow_promotion_codes: false,
      consent_collection: {
        terms_of_service: "required",
      },
      automatic_tax: {
        enabled: true,
      },
      submit_type: "auto",
      tax_id_collection: {
        enabled: true,
        required: "never",
      },
      integration_identifier: "hosted_mobile_app_0001",
      origin_context: "mobile_app",
      success_url: `${process.env.DOMAIN || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.DOMAIN || "http://localhost:3000"}/account/tarif`,
      line_items,
    } as any;

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (session.url) {
      if (contentType.includes("application/json")) {
        return NextResponse.json({ url: session.url, id: session.id });
      }
      return NextResponse.redirect(session.url, 303);
    }

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: any) {
    console.error("Error creating Stripe checkout session:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
