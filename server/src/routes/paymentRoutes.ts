import { Router } from "express";
import {
  createPaymentOrder,
  getTransactions,
  requestPayout,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/order", requireAuth, createPaymentOrder);
router.get("/transactions", requireAuth, getTransactions);
router.post("/payout", requireAuth, requestPayout);

export default router;

