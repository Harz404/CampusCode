import mongoose, { Schema, Document } from "mongoose";

export interface IProjectMilestone {
  id?: string;
  title: string;
  description: string;
  dueDate?: Date;
  status: "pending" | "in_progress" | "completed";
  progress: number;
}

export interface IProjectMember {
  user: mongoose.Types.ObjectId;
  role: string;
  joinedAt: Date;
}

export interface IProject extends Document {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "planning" | "active" | "paused" | "completed" | "archived";
  progress: number;
  ownerId: mongoose.Types.ObjectId;
  githubRepo?: string;
  githubInstallationId?: string;
  technologies: string[];
  isPublished: boolean;
  deadline?: Date;
  members: IProjectMember[];
  milestones: IProjectMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "general" },
    status: {
      type: String,
      enum: ["planning", "active", "paused", "completed", "archived"],
      default: "planning",
    },
    progress: { type: Number, default: 0 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    githubRepo: { type: String },
    githubInstallationId: { type: String },
    technologies: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
    deadline: { type: Date },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: { type: String, default: "developer" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    milestones: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        dueDate: { type: Date },
        status: { type: String, default: "pending" },
        progress: { type: Number, default: 0 },
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

export const Project = mongoose.model<IProject>("Project", ProjectSchema);

