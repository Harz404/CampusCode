import { Router } from "express";
import { register, login, getProfile, updateProfile, demoLogin } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/demo-login", demoLogin);
router.get("/profile", requireAuth, getProfile);
router.get("/me", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);

export default router;

