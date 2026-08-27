import { NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    let sessionId: string | null = null;
    const body = await req.json().catch(() => ({}));
    sessionId = body.sessionId || body.session_id;

    if (!sessionId) {
      const { searchParams } = new URL(req.url);
      sessionId = searchParams.get("session_id") || searchParams.get("sessionId");
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customer: session.customer,
      subscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as any)?.id || null,
      customerEmail: session.customer_details?.email,
    });
  } catch (err: any) {
    console.error("Error retrieving checkout session:", err);
    return NextResponse.json(
      { error: err.message || "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
