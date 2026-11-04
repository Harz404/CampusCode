import { access, allowFields } from "../middleware/access.js";
import { Router } from "express";
import {
  getProposals,
  getProposalById,
  createProposal,
  acceptProposal,
} from "../controllers/proposalController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getProposals);
router.get("/:id", requireAuth, access("proposal"), getProposalById);
router.post("/", requireAuth, createProposal);
router.post("/:id/accept", requireAuth, access("proposal", true), acceptProposal);

export default router;

