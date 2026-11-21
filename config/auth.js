import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import db from "./db.js";
import "dotenv/config";

const frontendOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// The client calls /api/auth/* through a Next.js rewrite, so the public
// origin of the app is what BetterAuth must use for OAuth callbacks.
const baseURL =
  process.env.BETTER_AUTH_URL || frontendOrigins[0] || "http://localhost:3000";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: Array.from(
    new Set([
      ...frontendOrigins,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]),
  ),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Google sign-in. The provider is only registered when both credentials
  // exist, so local development still works without OAuth keys.
  ...(googleConfigured
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            prompt: "select_account",
          },
        },
      }
    : {}),

  user: {
    modelName: "users",
    additionalFields: {
      role: { type: "string", defaultValue: "student", input: true },
      plan: { type: "string", defaultValue: "free", input: false },
      phone: { type: "string", required: false, input: true },
      bio: { type: "string", required: false, input: true },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Nobody can sign up as admin. Only student or tutor is allowed.
          const requestedRole =
            typeof user.role === "string" ? user.role.toLowerCase() : "";
          const role = requestedRole === "tutor" ? "tutor" : "student";
          return { data: { ...user, role, plan: "free" } };
        },
      },
    },
  },
});

export const googleAuthEnabled = googleConfigured;
