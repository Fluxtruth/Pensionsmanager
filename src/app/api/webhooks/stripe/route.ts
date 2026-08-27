import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (endpointSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } else {
      // In development without webhook secret, parse JSON directly (with warning)
      console.warn("⚠️ Warning: STRIPE_WEBHOOK_SECRET is not set. Processing event without signature verification.");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle billing and subscription events
  switch (event.type) {
    // -------------------------------------------------------------
    // Empfohlene Ereignisse (Recommended Events)
    // -------------------------------------------------------------
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`✅ Checkout Session completed: ${session.id}`, {
        customer: session.customer,
        subscription: session.subscription,
        customer_email: session.customer_details?.email,
      });

      // Consent tracking
      if (session.consent?.terms_of_service === "accepted") {
        console.log("Customer accepted Terms of Service");
      }
      if (session.consent?.promotions === "opt_in") {
        console.log("Customer opted in for promotional emails:", session.customer_details?.email);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`💰 Invoice paid: ${invoice.id} for customer ${invoice.customer}`, {
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
      });
      break;
    }

    case "invoice.payment_failed": {
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.warn(`⚠️ Invoice payment failed: ${failedInvoice.id} for customer ${failedInvoice.customer}`);
      break;
    }

    // -------------------------------------------------------------
    // Optionale Ereignisse (Optional Subscription & Payment Events)
    // -------------------------------------------------------------
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`🆕 Subscription created: ${subscription.id} (Status: ${subscription.status})`);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`🔄 Subscription updated: ${subscription.id} (Status: ${subscription.status})`);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`🛑 Subscription canceled/deleted: ${subscription.id}`);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`💳 PaymentIntent succeeded: ${paymentIntent.id} (Amount: ${paymentIntent.amount})`);
      break;
    }

    case "setup_intent.succeeded": {
      const setupIntent = event.data.object as Stripe.SetupIntent;
      console.log(`⚙️ SetupIntent succeeded: ${setupIntent.id} (Customer: ${setupIntent.customer})`);
      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
