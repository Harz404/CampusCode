import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  id: string;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: "text" | "file" | "image" | "system";
  attachmentUrl?: string;
  isRead: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  clientMessageId?: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["text", "file", "image", "system"], default: "text" },
    attachmentUrl: { type: String },
    isRead: { type: Boolean, default: false },
    editedAt: { type: Date },
    deletedAt: { type: Date },
    clientMessageId: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

MessageSchema.index({ senderId: 1, clientMessageId: 1 }, { unique: true, partialFilterExpression: { clientMessageId: { $type: "string" } } });
export const Message = mongoose.model<IMessage>("Message", MessageSchema);

