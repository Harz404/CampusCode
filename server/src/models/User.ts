import mongoose, { Schema, Document } from "mongoose";

export interface IBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: Date;
}

export interface IStudentProfile {
  college: string;
  degree: string;
  graduationYear: number;
  skills: string[];
  github?: string;
  linkedin?: string;
  bio: string;
  level: "beginner" | "contributor" | "builder" | "expert" | "top_developer";
  badges: IBadge[];
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalEarnings: number;
  completedProjects: number;
  portfolioUrl?: string;
}

export interface IClientProfile {
  organization: string;
  website?: string;
  description: string;
  profileType: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  totalSpent: number;
  projectsPosted: number;
}

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  authVersion: number;
  avatar?: string;
  role: "student" | "client" | "admin";
  isVerified: boolean;
  githubUsername?: string;
  githubAccessToken?: string;
  studentProfile?: IStudentProfile;
  clientProfile?: IClientProfile;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema(
  {
    college: { type: String, default: "" },
    degree: { type: String, default: "" },
    graduationYear: { type: Number, default: new Date().getFullYear() + 2 },
    skills: { type: [String], default: [] },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    bio: { type: String, default: "" },
    level: {
      type: String,
      enum: ["beginner", "contributor", "builder", "expert", "top_developer"],
      default: "beginner",
    },
    badges: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String, required: true },
        description: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    portfolioUrl: { type: String, default: "" },
  },
  { _id: false }
);

const ClientProfileSchema = new Schema(
  {
    organization: { type: String, default: "" },
    website: { type: String, default: "" },
    description: { type: String, default: "" },
    profileType: { type: String, default: "startup" },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    projectsPosted: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    authVersion: { type: Number, default: 0 },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["student", "client", "admin"], default: "student" },
    isVerified: { type: Boolean, default: false },
    githubUsername: { type: String },
    githubAccessToken: { type: String },
    studentProfile: StudentProfileSchema,
    clientProfile: ClientProfileSchema,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.authVersion;
        delete ret.githubAccessToken;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);

