import mongoose, { Schema, Document } from "mongoose";

export interface ISubTask {
  id?: string;
  title: string;
  completed: boolean;
}

export interface IComment {
  id?: string;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface ITask extends Document {
  id: string;
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  labels: string[];
  assigneeId?: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  dueDate?: Date;
  subtasks: ISubTask[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["backlog", "todo", "in_progress", "review", "done"],
      default: "backlog",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    labels: { type: [String], default: [] },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User" },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date },
    subtasks: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    comments: [
      {
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
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

export const Task = mongoose.model<ITask>("Task", TaskSchema);

