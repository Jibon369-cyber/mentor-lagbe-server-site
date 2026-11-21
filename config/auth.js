import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import db from "./db.js";
import { notifyAdmins } from "../services/notificationService.js";
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

  // Always register Google so Better Auth recognizes the provider. Set both
  // GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the server environment to
  // complete the OAuth flow.
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      prompt: "select_account",
    },
  },

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
        after: async (user) => {
          // Notify all admins about new user signup
          await notifyAdmins({
            recipientRole: "admin",
            title: "New User Signed Up",
            message: `${user.name} (${user.email}) signed up as ${user.role}`,
            actionUrl: `/dashboard/admin/users#user-${user.id}`,
            referenceId: user.id,
            referenceType: "user",
          });
        },
      },
    },
  },
});

export const googleAuthEnabled = googleConfigured;
