import { access, allowFields } from "../middleware/access.js";
import { Router } from "express";
import {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  submitProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, getProducts);
router.get("/:id", optionalAuth, getProductByIdOrSlug);
router.post("/:id/submit", requireAuth, access("product", true), submitProduct);
router.post("/", requireAuth, createProduct);
router.patch("/:id", requireAuth, access("product", true), allowFields("product"), updateProduct);
router.put("/:id", requireAuth, access("product", true), allowFields("product"), updateProduct);
router.delete("/:id", requireAuth, access("product", true), deleteProduct);

export default router;

