import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";

export class ChatError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function directConversation(actor: string, recipient: unknown) {
  if (typeof recipient !== "string" || !mongoose.isValidObjectId(recipient) || recipient === actor) {
    throw new ChatError(400, "Choose another valid user to message");
  }
  if (!await User.exists({ _id: recipient })) throw new ChatError(404, "Recipient not found");
  const participants = [actor, recipient].sort();
  // Preserve existing two-person histories when upgrading older records.
  const existing = await Conversation.findOne({ participants: { $all: participants, $size: 2 } });
  if (existing) return existing;
  await Conversation.init(); // Ensure the unique key exists before concurrent upserts.
  const directKey = participants.join(":");
  try {
    return await Conversation.findOneAndUpdate({ directKey }, { $setOnInsert: { participants, directKey } }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const winner = await Conversation.findOne({ directKey });
    if (!winner) throw error;
    return winner;
  }
}

export function messageContent(content: unknown): string {
  if (typeof content !== "string" || !content.trim() || content.length > 10000) throw new ChatError(400, "Message must contain between 1 and 10,000 characters");
  return content.trim();
}
