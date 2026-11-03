import { Router } from "express";
import { getAdminStats, getAdminUsers, updateProductStatus } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/stats", requireAdmin, getAdminStats);
router.get("/users", requireAdmin, getAdminUsers);
router.patch("/products/:id/status", requireAdmin, updateProductStatus);

export default router;

