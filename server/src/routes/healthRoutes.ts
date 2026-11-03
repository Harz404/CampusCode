import { Router } from "express";
import { isDbConnected } from "../config/db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: isDbConnected() ? "connected" : "disconnected",
    service: "CampusCode MERN Backend",
  });
});

export default router;

