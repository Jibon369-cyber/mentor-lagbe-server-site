import { Router } from "express";
import Stripe from "stripe";
import { payments, users } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

const PRICES = { tutor: 15, student: 10 };

let stripeClient = null;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured on the server");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

/**
 * Saves a paid checkout session and upgrades the user to Pro.
 * It is idempotent, so the webhook and the success-page verification can
 * both run without creating duplicate payments.
 */
async function activatePlan(session) {
  const email =
    session.metadata?.userEmail || session.customer_email || session.customer_details?.email;

  if (!email) {
    throw new Error("Payment session has no customer email");
  }

  const user = await users.findOne({ email });
  if (!user) {
    throw new Error("User for this payment was not found");
  }

  const alreadySaved = await payments.findOne({
    stripeSessionId: session.id,
  });

  if (!alreadySaved) {
    const role = session.metadata?.userRole || user.role;

    await payments.insertOne({
      userEmail: user.email,
      userName: user.name,
      userRole: role,
      planName: session.metadata?.planName || `Pro ${role}`,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency || "usd",
      transactionId: session.payment_intent || session.id,
      stripeSessionId: session.id,
      paymentStatus: "paid",
      paidAt: new Date(session.created ? session.created * 1000 : Date.now()),
    });
  }

  await users.updateOne(
    { email: user.email },
    { $set: { plan: "pro", updatedAt: new Date() } },
  );

  return user;
}

router.post("/create-checkout-session", verifyToken, async (req, res, next) => {
  try {
    const user = await users.findOne({ email: req.user.email });

    if (!user || user.role === "admin") {
      return res.status(403).send({ message: "Admin does not need a plan" });
    }
    if (user.plan === "pro") {
      return res.status(400).send({ message: "You are already a Pro member" });
    }

    const amount = PRICES[user.role];
    if (!amount) {
      return res.status(400).send({ message: "This role cannot buy a plan" });
    }

    const planName = user.role === "tutor" ? "Pro Tutor" : "Pro Student";
    const metadata = {
      userEmail: user.email,
      userRole: user.role,
      planName,
    };

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: user._id.toString(),
      metadata,
      payment_intent_data: { metadata },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: {
              name: `MentorLagbe ${planName}`,
              description:
                user.role === "tutor"
                  ? "Unlimited tuition posts, verified badge and priority support."
                  : "Priority booking, unlimited applications and priority support.",
            },
          },
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    res.send({ url: session.url });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", verifyToken, async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).send({ message: "sessionId is required" });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).send({ message: "Payment not completed" });
    }

    const belongsToUser =
      session.metadata?.userEmail === req.user.email ||
      session.customer_email === req.user.email ||
      session.customer_details?.email === req.user.email;

    if (!belongsToUser) {
      return res
        .status(403)
        .send({ message: "This payment belongs to another user" });
    }

    await activatePlan(session);

    res.send({ message: "Payment verified. You are now a Pro member!" });
  } catch (error) {
    next(error);
  }
});

/**
 * Stripe webhook. Mounted in index.js with express.raw() BEFORE express.json()
 * so the signature can be verified against the raw request body.
 */
export async function handleStripeWebhook(req, res) {
  try {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (webhookSecret && signature) {
      event = getStripe().webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } else {
      // Local development fallback when no webhook secret is configured.
      event = JSON.parse(req.body.toString());
    }

    const handledEvents = [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ];

    if (handledEvents.includes(event.type)) {
      const session = event.data.object;
      if (session.payment_status === "paid") {
        await activatePlan(session);
      }
    }

    res.send({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    res.status(400).send({ message: `Webhook error: ${error.message}` });
  }
}

export default router;
