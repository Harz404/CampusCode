import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createReview, receivedReviews, contractReviews } from "../controllers/reviewController.js";
const router = Router();
router.use(requireAuth);
router.get("/", receivedReviews);
router.get("/contracts/:contractId", contractReviews);
router.post("/", createReview);
export default router;
