import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server/.env is loaded regardless of root or server execution directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

// Ensure SRV DNS records for MongoDB Atlas resolve reliably on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  // Ignore if already set or not permitted
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campuscode";
  try {
    mongoose.set("strictQuery", false);
    console.log(`[MongoDB] Connecting to database...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error: any) {
    console.warn(`[MongoDB] Connection failed: ${error?.message || error}`);
    console.log("[MongoDB] Tip: Ensure your current IP is whitelisted in MongoDB Atlas (Network Access -> Add IP Address -> Allow Access from Anywhere 0.0.0.0/0).");
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
