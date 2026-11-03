import { Router } from "express";
import { planProject, analyzeRequirement, generateProposal } from "../controllers/aiController.js";

const router = Router();

router.post("/plan", planProject);
router.post("/analyze", analyzeRequirement);
router.post("/proposal", generateProposal);

export default router;

