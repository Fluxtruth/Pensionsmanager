import { NextResponse } from "next/server";
import { getStripeInstance, isStripeConfigured } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({
        hasActiveSubscription: false,
        status: "unconfigured",
        customerType: "none",
        subscriptionId: null,
        cancelAtPeriodEnd: false,
      });
    }

    const stripe = getStripeInstance();

    // 1. Check for active subscriptions in Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 5,
    });

    if (subscriptions.data && subscriptions.data.length > 0) {
      const latestSub = subscriptions.data[0];
      return NextResponse.json({
        hasActiveSubscription: true,
        status: "active",
        customerType: "subscriber",
        subscriptionId: latestSub.id,
        cancelAtPeriodEnd: !!latestSub.cancel_at_period_end,
        currentPeriodEnd: (latestSub as any).current_period_end || null,
      });
    }

    // 2. Check for recent completed checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
    });

    const recentPaidSession = sessions.data?.find(
      (s) => s.payment_status === "paid" && s.status === "complete"
    );

    if (recentPaidSession) {
      const subId =
        typeof recentPaidSession.subscription === "string"
          ? recentPaidSession.subscription
          : (recentPaidSession.subscription as any)?.id || "sub_active";

      return NextResponse.json({
        hasActiveSubscription: true,
        status: "active",
        customerType: "subscriber",
        subscriptionId: subId,
        cancelAtPeriodEnd: false,
      });
    }

    return NextResponse.json({
      hasActiveSubscription: false,
      status: "canceled",
      customerType: "none",
      subscriptionId: null,
      cancelAtPeriodEnd: false,
    });
  } catch (err: any) {
    console.error("Error syncing Stripe subscription status:", err);
    return NextResponse.json(
      {
        hasActiveSubscription: false,
        status: "error",
        error: err.message || "Failed to check Stripe status",
      },
      { status: 500 }
    );
  }
}
