import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  id: string;
  projectId?: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  directKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    directKey: { type: String, unique: true, sparse: true },
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

export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);

