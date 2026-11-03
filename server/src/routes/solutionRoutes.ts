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
router.patch("/:id", requireAuth, updateSolutionRequest);
router.put("/:id", requireAuth, updateSolutionRequest);
router.delete("/:id", requireAuth, deleteSolutionRequest);

export default router;

