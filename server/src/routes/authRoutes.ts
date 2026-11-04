import { rateLimit } from "../middleware/rateLimit.js";
import { forgotPassword, resetPassword, requestVerification, verifyEmail } from "../controllers/recoveryController.js";
import { Router } from "express";
import { register, login, getProfile, updateProfile, demoLogin, logout, logoutAll, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", rateLimit("register", 20), register);
router.post("/login", rateLimit("login", 30), login);
router.post("/demo-login", demoLogin);
router.post("/logout", requireAuth, logout);
router.post("/logout-all", requireAuth, logoutAll);
router.post("/change-password", requireAuth, rateLimit("change-password", 10), changePassword);
router.post("/forgot-password", rateLimit("forgot-password", 5, 3600000), forgotPassword);
router.post("/reset-password", rateLimit("reset-password", 10), resetPassword);
router.post("/request-verification", requireAuth, rateLimit("verify-request", 5, 3600000), requestVerification);
router.post("/verify-email", rateLimit("verify-email", 20), verifyEmail);
router.get("/profile", requireAuth, getProfile);
router.get("/me", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);

export default router;

