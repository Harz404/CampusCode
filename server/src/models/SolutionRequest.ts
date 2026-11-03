import mongoose, { Schema, Document } from "mongoose";

export interface ISolutionRequest extends Document {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  category: string;
  solutionType: string;
  difficulty: string;
  status: "open" | "in_progress" | "completed" | "closed" | "cancelled";
  clientId: mongoose.Types.ObjectId;
  budgetMin?: number;
  budgetMax?: number;
  isFixedPrice: boolean;
  deadline?: Date;
  preferredTechnologies: string[];
  requiredFeatures: string[];
  expectedDeliverables: string[];
  attachments: string[];
  proposalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SolutionRequestSchema = new Schema<ISolutionRequest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    problemStatement: { type: String, default: "" },
    category: { type: String, required: true },
    solutionType: { type: String, default: "web" },
    difficulty: { type: String, default: "intermediate" },
    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "closed", "cancelled"],
      default: "open",
    },
    clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    budgetMin: { type: Number },
    budgetMax: { type: Number },
    isFixedPrice: { type: Boolean, default: true },
    deadline: { type: Date },
    preferredTechnologies: { type: [String], default: [] },
    requiredFeatures: { type: [String], default: [] },
    expectedDeliverables: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    proposalCount: { type: Number, default: 0 },
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

export const SolutionRequest = mongoose.model<ISolutionRequest>("SolutionRequest", SolutionRequestSchema);

