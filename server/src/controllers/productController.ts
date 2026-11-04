import { randomUUID } from "node:crypto";
import { productInput, ProductError, validateSubmission } from "../services/productService.js";
import { Project } from "../models/Project.js";
import { sameId } from "../middleware/access.js";
import { Response } from "express";
import { Product } from "../models/Product.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getProducts(req: AuthRequest, res: Response) {
  try {
    const { category, search, sort, free, sellerId } = req.query;
    const filter: Record<string, unknown> = req.user?.role === "admin" || (typeof sellerId === "string" && sameId(sellerId, req.user?.id)) ? {} : { status: "published", moderationVerified: true };

    if ((category && (typeof category !== "string" || category.length > 100)) || (search && (typeof search !== "string" || search.length > 200))) return res.status(400).json({ error: "Invalid product search" });
    if (category && category !== "all") {
      filter.category = new RegExp(escapeSearch(category as string), "i");
    }

    if (search) {
      const searchRegex = new RegExp(escapeSearch(search as string), "i");
      filter.$or = [{ name: searchRegex }, { description: searchRegex }, { tags: searchRegex }];
    }

    if (free === "true") {
      filter.isFree = true;
    } else if (free === "false") {
      filter.isFree = false;
    }

    if (sellerId) {
      if (mongoose.Types.ObjectId.isValid(sellerId as string)) {
        filter.sellerId = sellerId;
      }
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "popular") sortOption = { salesCount: -1 };

    if (sort === "price_low") sortOption = { price: 1 };
    if (sort === "price_high") sortOption = { price: -1 };

    const products = await Product.find(filter)
      .sort(sortOption)
      .populate("sellerId", "name avatar studentProfile");

    const formatted = products.map((p) => {
      const pJson: any = serializeProduct(p, req.user?.id, req.user?.role);
      if (pJson.sellerId && typeof pJson.sellerId === "object") {
        pJson.seller = pJson.sellerId;
        pJson.sellerId = (pJson.seller as { id?: string }).id || pJson.sellerId;
      }
      return pJson;
    });

    return res.json({ products: formatted, total: formatted.length });
  } catch (error) {
    console.error("[Product GET Error]:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}

export async function getProductByIdOrSlug(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    let product;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).populate("sellerId", "name avatar studentProfile");
    }
    if (!product) {
      product = await Product.findOne({ slug: id }).populate("sellerId", "name avatar studentProfile");
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if ((product.status !== "published" || product.moderationVerified !== true) && !sameId(product.sellerId, req.user?.id) && req.user?.role !== "admin") {
      return res.status(404).json({ error: "Product not found" });
    }
    await Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } });
    const productData: any = serializeProduct(product, req.user?.id, req.user?.role);
    if (productData.sellerId && typeof productData.sellerId === "object") {
      productData.seller = productData.sellerId;
      productData.sellerId = (productData.seller as { id?: string }).id || productData.sellerId;
    }

    return res.json(productData);
  } catch (error) {
    console.error("[Product GetById Error]:", error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
}

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const sellerId = req.user?.id || req.body.sellerId;
    if (!sellerId) {
      return res.status(401).json({ error: "Unauthorized: Seller ID required" });
    }

    if (req.user?.role !== "student") return res.status(403).json({ error: "Only student developers can list products" });
    const fields = productInput(req.body, true);
    if (req.body.projectId && (!mongoose.isValidObjectId(req.body.projectId) || !await Project.exists({ _id: req.body.projectId, ownerId: sellerId }))) return res.status(404).json({ error: "Project not found" });
    const slug = fields.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + randomUUID();
    const newProduct = new Product({ ...fields, slug, sellerId, projectId: req.body.projectId || undefined, status: "draft", rating: 0, reviewCount: 0, salesCount: 0, viewCount: 0 });

    await newProduct.save();
    return res.status(201).json(serializeProduct(newProduct, req.user!.id));
  } catch (error) {
    if (error instanceof ProductError) return res.status(error.status).json({ error: error.message });
    console.error("[Product Create Error]:", error);
    return res.status(500).json({ error: "Failed to create product" });
  }
}

export async function updateProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const fields = productInput(req.body);
    const product = await Product.findOneAndUpdate({ _id: id, sellerId: req.user!.id, status: { $ne: "archived" } }, { $set: { ...fields, status: "draft", moderationVerified: false, moderationReason: "" } }, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(serializeProduct(product, req.user!.id));
  } catch (error) {
    if (error instanceof ProductError) return res.status(error.status).json({ error: error.message });
    console.error("[Product Update Error]:", error);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndUpdate({ _id: id, sellerId: req.user!.id }, { $set: { status: "archived" } }, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json({ success: true, message: "Product archived" });
  } catch (error) {
    console.error("[Product Delete Error]:", error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
}


export function serializeProduct(product: any, actor?: string, role?: string) {
  const data = product.toJSON();
  // Purchase-backed product reviews and assessed quality scores are not implemented yet.
  data.rating = 0; data.reviewCount = 0; delete data.qualityScore;
  if (!sameId(product.sellerId, actor) && role !== "admin") { delete data.moderationHistory; delete data.moderationReason; }
  if (!data.isFree && !sameId(product.sellerId, actor) && role !== "admin") {
    delete data.driveUrl; delete data.githubUrl; delete data.downloadUrl;
    delete data.documentation; delete data.installation;
  }
  return data;
}

export async function submitProduct(req: AuthRequest, res: Response) {
  try {
    const product = await Product.findOne({ _id: req.params.id, sellerId: req.user!.id });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (!["draft", "rejected"].includes(product.status)) return res.status(409).json({ error: "Only drafts and rejected products can be submitted" });
    validateSubmission(product.toObject());
    const saved = await Product.findOneAndUpdate({ _id: product._id, sellerId: req.user!.id, status: product.status, updatedAt: product.updatedAt }, { $set: { status: "pending_review", moderationReason: "" } }, { new: true, runValidators: true });
    if (!saved) return res.status(409).json({ error: "Product changed; refresh and retry" });
    return res.json(serializeProduct(saved, req.user!.id));
  } catch (error) {
    if (error instanceof ProductError) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: "Could not submit product" });
  }
}

function escapeSearch(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
