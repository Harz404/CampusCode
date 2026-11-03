import mongoose, { Schema, Document } from "mongoose";

export interface IProductReview {
  id?: string;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IProductQualityScore {
  documentation: number;
  codeQuality: number;
  demoAvailability: number;
  readme: number;
  testing: number;
  overall: number;
}

export interface IProduct extends Document {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  price: number;
  isFree: boolean;
  status: "draft" | "pending_review" | "published" | "rejected" | "archived";
  sellerId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  technologies: string[];
  tags: string[];
  features: string[];
  requirements: string[];
  license: string;
  demoUrl?: string;
  githubUrl?: string;
  driveUrl?: string;
  downloadUrl?: string;
  documentation?: string;
  installation?: string;
  screenshots: string[];
  qualityScore?: IProductQualityScore;
  rating: number;
  reviewCount: number;
  salesCount: number;
  viewCount: number;
  downloadCount: number;
  version: string;
  reviews: IProductReview[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "pending_review", "published", "rejected", "archived"],
      default: "published",
    },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    technologies: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    features: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    license: { type: String, default: "Commercial" },
    demoUrl: { type: String },
    githubUrl: { type: String },
    driveUrl: { type: String },
    downloadUrl: { type: String },
    documentation: { type: String },
    installation: { type: String },
    screenshots: { type: [String], default: [] },
    qualityScore: {
      documentation: { type: Number, default: 90 },
      codeQuality: { type: Number, default: 95 },
      demoAvailability: { type: Number, default: 90 },
      readme: { type: Number, default: 92 },
      testing: { type: Number, default: 85 },
      overall: { type: Number, default: 90 },
    },
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    version: { type: String, default: "1.0.0" },
    reviews: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
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

export const Product = mongoose.model<IProduct>("Product", ProductSchema);

