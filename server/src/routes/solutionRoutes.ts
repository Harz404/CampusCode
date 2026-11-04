import { access, allowFields } from "../middleware/access.js";
import { Router } from "express";
import {
  getSolutionRequests,
  getSolutionRequestById,
  createSolutionRequest,
  updateSolutionRequest,
  deleteSolutionRequest,
} from "../controllers/solutionController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, getSolutionRequests);
router.get("/:id", optionalAuth, getSolutionRequestById);
router.post("/", requireAuth, createSolutionRequest);
router.patch("/:id", requireAuth, access("solution", true), allowFields("solution"), updateSolutionRequest);
router.put("/:id", requireAuth, access("solution", true), allowFields("solution"), updateSolutionRequest);
router.delete("/:id", requireAuth, access("solution", true), deleteSolutionRequest);

export default router;

