import { NextResponse } from "next/server";
import { getStripeInstance, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { subscriptionId, immediate, reactivate } = body;

    const stripe = getStripeInstance();
    const hasStripeConfig = isStripeConfigured();

    const isTestMode =
      !hasStripeConfig ||
      process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ||
      process.env.NODE_ENV !== "production";

    // 1. Reactivate previously canceled subscription before period end
    if (reactivate) {
      try {
        if (hasStripeConfig && subscriptionId && !subscriptionId.startsWith("sub_test_")) {
          const result = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
          });
          return NextResponse.json({
            success: true,
            message: "Kündigung erfolgreich zurückgenommen. Das Abonnement läuft regulär weiter.",
            subscription: {
              id: result.id,
              status: result.status,
              cancel_at_period_end: result.cancel_at_period_end,
              current_period_end: (result as any).current_period_end,
            },
          });
        }
      } catch (err: any) {
        if (!isTestMode) throw err;
      }

      return NextResponse.json({
        success: true,
        message: "Kündigung erfolgreich zurückgenommen (Testmodus).",
        subscription: {
          id: subscriptionId || "sub_test_pension_default",
          status: "active",
          cancel_at_period_end: false,
        },
      });
    }

    // 2. Immediate cancellation guard
    if (immediate && !isTestMode) {
      return NextResponse.json(
        { error: "Sofortige Kündigung ist in Produktion nur über den Administrator/Support möglich." },
        { status: 403 }
      );
    }

    // 3. Try canceling in Stripe
    try {
      if (hasStripeConfig && subscriptionId && !subscriptionId.startsWith("sub_test_")) {
        let result;
        if (immediate) {
          result = await stripe.subscriptions.cancel(subscriptionId);
        } else {
          result = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          });
        }

        return NextResponse.json({
          success: true,
          immediate: !!immediate,
          subscription: {
            id: result.id,
            status: result.status,
            cancel_at_period_end: result.cancel_at_period_end,
            current_period_end: (result as any).current_period_end,
          },
        });
      }
    } catch (stripeErr: any) {
      // In test mode, if subscription does not exist in Stripe, simulate local cancellation gracefully
      if (isTestMode && (stripeErr.code === "resource_missing" || stripeErr.message?.includes("No such subscription"))) {
        console.warn(`[Stripe Test] Subscription ${subscriptionId} not found in Stripe sandbox. Simulating cancellation.`);
        return NextResponse.json({
          success: true,
          immediate: !!immediate,
          simulated: true,
          subscription: {
            id: subscriptionId,
            status: immediate ? "canceled" : "active",
            cancel_at_period_end: !immediate,
          },
        });
      }
      throw stripeErr;
    }

    // Fallback for mock/test IDs
    return NextResponse.json({
      success: true,
      immediate: !!immediate,
      simulated: true,
      subscription: {
        id: subscriptionId || "sub_test_pension_default",
        status: immediate ? "canceled" : "active",
        cancel_at_period_end: !immediate,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Fehler bei der Kündigung des Abonnements." },
      { status: 500 }
    );
  }
}
