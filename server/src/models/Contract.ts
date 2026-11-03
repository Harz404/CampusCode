import mongoose, { Schema, Document } from "mongoose";

export interface IContractMilestone {
  title: string;
  description: string;
  amount: number;
  status: "pending" | "in_progress" | "submitted" | "approved" | "revision_requested";
  dueDate?: Date;
  completedAt?: Date;
}

export interface IContract extends Document {
  id: string;
  solutionRequestId: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  totalAmount: number;
  platformFee: number;
  studentEarnings: number;
  status: "created" | "active" | "in_review" | "completed" | "disputed" | "cancelled";
  startDate: Date;
  endDate?: Date;
  milestones: IContractMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
  {
    solutionRequestId: { type: Schema.Types.ObjectId, ref: "SolutionRequest", required: true },
    proposalId: { type: Schema.Types.ObjectId, ref: "Proposal", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    studentEarnings: { type: Number, required: true },
    status: {
      type: String,
      enum: ["created", "active", "in_review", "completed", "disputed", "cancelled"],
      default: "created",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        amount: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "in_progress", "submitted", "approved", "revision_requested"],
          default: "pending",
        },
        dueDate: { type: Date },
        completedAt: { type: Date },
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

export const Contract = mongoose.model<IContract>("Contract", ContractSchema);

