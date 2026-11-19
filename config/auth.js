import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import db from "./db";
import "dotenv/config";



export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.FRONTEND_URL],
  emailAndPassword: {enabled: true, minPasswordLength: 8},

  user: {
    modelName: 'users',
    additionalFields: {
        role: {type: 'string', defaultValue: 'student', input: true},
        plan: {type: 'string', defaultValue: 'free', input: false},
        phone: {type: 'string', required: false, input: true},
        bio: {type: 'string', required: false, input: true},
    }
  },

  databaseHooks: {
    user: {
        create: {
            before: async (user) => {
                const role = user.role === 'tutor' ? 'tutor' : 'student';
                return {data: {...user, role, plan: 'free'}}
            }
        }
    }
  }
});