import { IProduct } from "../models/Product.js";

export class ProductError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function productInput(body: Record<string, unknown>, creating = false) {
  const fields: Record<string, any> = {};
  for (const [key, maximum] of Object.entries({ name: 150, description: 50000, shortDescription: 500, category: 100, license: 100, documentation: 100000, installation: 100000 })) {
    if (body[key] !== undefined || (creating && ["name", "description", "category"].includes(key))) {
      const value = body[key];
      if (typeof value !== "string" || value.length > maximum || (["name", "description", "category"].includes(key) && !value.trim())) throw new ProductError(400, `Invalid product ${key}`);
      fields[key] = value.trim();
    }
  }
  if (body.isFree !== undefined) {
    if (typeof body.isFree !== "boolean") throw new ProductError(400, "Choose free or paid pricing");
    fields.isFree = body.isFree;
  }
  if (body.price !== undefined) {
    if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0 || !Number.isSafeInteger(Math.round(body.price * 100))) throw new ProductError(400, "Invalid product price");
    fields.price = Math.round(body.price * 100) / 100;
  }
  if (fields.isFree === true) fields.price = 0;
  for (const key of ["technologies", "tags", "features", "requirements"]) {
    if (body[key] === undefined) continue;
    if (!Array.isArray(body[key]) || body[key].length > 100 || body[key].some((value: unknown) => typeof value !== "string" || value.length > 2000)) throw new ProductError(400, `Invalid product ${key}`);
    fields[key] = body[key];
  }
  for (const key of ["demoUrl", "githubUrl", "driveUrl", "downloadUrl"]) {
    if (body[key] === undefined) continue;
    if (body[key] === "") { fields[key] = ""; continue; }
    try {
      if (typeof body[key] !== "string" || body[key].length > 2000) throw new Error();
      const url = new URL(body[key] as string);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error();
      fields[key] = url.href;
    } catch { throw new ProductError(400, `Invalid ${key}; use an HTTP or HTTPS link`); }
  }
  if (body.screenshots !== undefined) {
    if (!Array.isArray(body.screenshots) || body.screenshots.length > 10 || body.screenshots.some((image: unknown) => typeof image !== "string" || image.length > 2000000 || !/^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(image))) throw new ProductError(400, "Invalid product screenshots");
    fields.screenshots = body.screenshots;
  }
  return fields;
}

export function validateSubmission(product: Pick<IProduct, "name" | "description" | "category" | "price" | "isFree" | "documentation" | "githubUrl" | "driveUrl" | "downloadUrl">) {
  productInput(product as unknown as Record<string, unknown>, true);
  if (!product.isFree && product.price <= 0) throw new ProductError(400, "Paid products need a positive price");
  if (!product.documentation?.trim() || !(product.githubUrl || product.driveUrl || product.downloadUrl)) throw new ProductError(400, "Provide documentation and a source delivery link before submitting");
}

export function moderationTransition(current: string, next: unknown, reason: unknown) {
  const allowed: Record<string, string[]> = { pending_review: ["published", "rejected"], published: ["archived"] };
  if (typeof next !== "string" || !allowed[current]?.includes(next)) throw new ProductError(409, "Product status changed or this moderation action is not allowed");
  if (typeof reason !== "string" || reason.length > 2000 || (["rejected", "archived"].includes(next) && !reason.trim())) throw new ProductError(400, "Provide a moderation reason of at most 2,000 characters");
  return { status: next, reason: reason.trim() };
}
