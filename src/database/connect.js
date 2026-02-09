import { MongoClient, ServerApiVersion } from "mongodb";
import config from "#@/config/config.js";

const client = new MongoClient(config.DB_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db; // cache db connection

export const connect = async () => {
  try {
    if (!db) {
      await client.connect();
      db = client.db("ecomm");
      await db.command({ ping: 1 });
      console.log("✅ MongoDB connected successfully");
    }
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
};

export const collection = (name) => {
  if (!db) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return db.collection(name);
};

export const close = async () => {
  if (client) {
    await client.close();
    db = null;
    console.log("🔌 MongoDB connection closed");
  }
};

export default { connect, collection, close };
