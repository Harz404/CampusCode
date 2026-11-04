import { access } from "../middleware/access.js";
import { Router } from "express";
import {
  getContracts,
  getContractById,
  updateContractMilestone,
} from "../controllers/contractController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getContracts);
router.get("/:id", requireAuth, access("contract"), getContractById);
router.post("/:id/milestones", requireAuth, access("contract"), updateContractMilestone);
router.patch("/:id/milestones/:milestoneId", requireAuth, access("contract"), updateContractMilestone);

export default router;

