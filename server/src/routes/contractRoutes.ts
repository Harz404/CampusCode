import { Router } from "express";
import {
  getContracts,
  getContractById,
  updateContractMilestone,
} from "../controllers/contractController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, getContracts);
router.get("/:id", optionalAuth, getContractById);
router.patch("/:id/milestones/:milestoneIndex", requireAuth, updateContractMilestone);

export default router;

