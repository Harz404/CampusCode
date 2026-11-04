import mongoose, { Schema, Document } from "mongoose";

export interface IProposalMilestone {
  title: string;
  description: string;
  amount: number;
  durationDays: number;
}

export interface IProposal extends Document {
  id: string;
  solutionRequestId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submissionKey?: string;
  content: string;
  price: number;
  estimatedDelivery: number;
  technologies: string[];
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  milestones: IProposalMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    solutionRequestId: { type: Schema.Types.ObjectId, ref: "SolutionRequest", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submissionKey: { type: String, unique: true, sparse: true },
    content: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedDelivery: { type: Number, required: true },
    technologies: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        amount: { type: Number, required: true },
        durationDays: { type: Number, required: true },
      },
    ],
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

export const Proposal = mongoose.model<IProposal>("Proposal", ProposalSchema);

