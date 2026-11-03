import { Router } from "express";
import {
  getProposals,
  getProposalById,
  createProposal,
  acceptProposal,
} from "../controllers/proposalController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, getProposals);
router.get("/:id", optionalAuth, getProposalById);
router.post("/", requireAuth, createProposal);
router.post("/:id/accept", requireAuth, acceptProposal);

export default router;

