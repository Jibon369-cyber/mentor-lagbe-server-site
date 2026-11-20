import { Router } from "express";
import Stripe from "stripe";
import { users, payments } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = { tutor: 15, student: 10 };

router.use(verifyToken);

router.post("/create-checkout-session", async (req, res) => {
  const user = await users.findOne({ email: req.user.email });

  if (!user || user.role === "admin") {
    return res.status(403).send({ message: "Admin does not need a plan" });
  }
  if (user.plan === "pro") {
    return res.status(400).send({ message: "You are already a Pro member" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PRICES[user.role] * 100,
          product_data: { name: `MentorLagbe Pro Plan (${user.role})` },
        },
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
  });

  res.send({ url: session.url });
});

router.post("/verify", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId)
    return res.status(400).send({ message: "sessionId is required" });

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return res.status(400).send({ message: "Payment not completed" });
  }
  if (session.customer_email !== req.user.email) {
    return res
      .status(403)
      .send({ message: "This payment belongs to another user" });
  }

  // Save only once (page refresh must not create a duplicate)
  const alreadySaved = await payments.findOne({ stripeSessionId: sessionId });
  if (!alreadySaved) {
    const user = await users.findOne({ email: req.user.email });

    await payments.insertOne({
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      planName: "Pro",
      amount: session.amount_total / 100,
      currency: session.currency,
      transactionId: session.payment_intent,
      stripeSessionId: sessionId,
      paymentStatus: "paid",
      paidAt: new Date(),
    });

    await users.updateOne({ email: user.email }, { $set: { plan: "pro" } });
  }

  res.send({ message: "Payment verified. You are now a Pro member!" });
});

export default router;