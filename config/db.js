import "dotenv/config";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing. Please add it to your .env file.");
}

const DB_NAME = process.env.MONGODB_DB_NAME || "mentorLagbe";

export const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});

let database = null;

export async function connectToMongoDB() {
  if (database) return database;

  try {
    await client.connect();
    // Make sure the connection actually works before handing out the db.
    await client.db(DB_NAME).command({ ping: 1 });
    database = client.db(DB_NAME);
    console.log("You successfully connected to MongoDB!");
    return database;
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    throw err;
  }
}


export const db = await connectToMongoDB();


export const users = db.collection('users');
export const tuitions = db.collection('tuitions');
export const applications = db.collection('applications');
export const payments = db.collection('payments');
export const notifications = db.collection('notifications');


export default db;
