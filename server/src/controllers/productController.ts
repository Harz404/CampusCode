import { Response } from "express";
import { Product } from "../models/Product.js";
import { AuthRequest } from "../middleware/auth.js";
import mongoose from "mongoose";

export async function getProducts(req: AuthRequest, res: Response) {
  try {
    const { category, search, sort, free, sellerId } = req.query;
    const filter: Record<string, unknown> = {};

    if (category && category !== "all") {
      filter.category = new RegExp(category as string, "i");
    }

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
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
    if (sort === "rating") sortOption = { rating: -1 };
    if (sort === "price_low") sortOption = { price: 1 };
    if (sort === "price_high") sortOption = { price: -1 };

    const products = await Product.find(filter)
      .sort(sortOption)
      .populate("sellerId", "name email avatar studentProfile");

    const formatted = products.map((p) => {
      const pJson: any = p.toJSON();
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
      product = await Product.findById(id).populate("sellerId", "name email avatar studentProfile");
    }
    if (!product) {
      product = await Product.findOne({ slug: id }).populate("sellerId", "name email avatar studentProfile");
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Increment view count
    product.viewCount = (product.viewCount || 0) + 1;
    await product.save();

    const productData: any = product.toJSON();
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

    const {
      name,
      description,
      shortDescription,
      category,
      price,
      isFree,
      technologies,
      tags,
      features,
      requirements,
      license,
      demoUrl,
      githubUrl,
      driveUrl,
      downloadUrl,
      documentation,
      installation,
      screenshots,
    } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ error: "Name, description, and category are required" });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;

    const newProduct = new Product({
      name: name.trim(),
      slug,
      description,
      shortDescription: shortDescription || description.slice(0, 120),
      category: category.toLowerCase(),
      price: isFree ? 0 : Number(price) || 0,
      isFree: Boolean(isFree),
      status: "published",
      sellerId,
      technologies: Array.isArray(technologies) ? technologies : [],
      tags: Array.isArray(tags) ? tags : [],
      features: Array.isArray(features) ? features : ["Full source code", "Documentation included"],
      requirements: Array.isArray(requirements) ? requirements : ["Node.js 18+"],
      license: license || "Commercial",
      demoUrl,
      githubUrl,
      driveUrl,
      downloadUrl,
      documentation,
      installation,
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      rating: 5.0,
      reviewCount: 1,
      salesCount: 0,
      viewCount: 1,
      version: "1.0.0",
    });

    await newProduct.save();
    return res.status(201).json(newProduct.toJSON());
  } catch (error) {
    console.error("[Product Create Error]:", error);
    return res.status(500).json({ error: "Failed to create product" });
  }
}

export async function updateProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(product.toJSON());
  } catch (error) {
    console.error("[Product Update Error]:", error);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("[Product Delete Error]:", error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
}

