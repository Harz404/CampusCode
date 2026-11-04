import { Response } from "express";
import bcrypt from "bcryptjs";
import { issueSession, validateNewPassword } from "../services/sessionService.js";
import { Session } from "../models/Session.js";
import { User, IUser } from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";

export async function register(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, role, college, degree, graduationYear, skills, bio, organization, website, description } = req.body;

    if (role !== undefined && role !== "student" && role !== "client") {
      return res.status(400).json({ error: "Registration role must be student or client" });
    }

    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string") {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    try { validateNewPassword(password); }
    catch (error) { return res.status(400).json({ error: (error as Error).message }); }

    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === "client" ? "client" : "student";

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: userRole,
      isVerified: false,
      studentProfile:
        userRole === "student"
          ? {
              college: college || "",
              degree: degree || "",
              graduationYear: graduationYear ? Number(graduationYear) : new Date().getFullYear() + 2,
              skills: Array.isArray(skills) ? skills : [],
              bio: bio || "",
              level: "beginner",
              badges: [],
              rating: 0,
              reviewCount: 0,
              totalSales: 0,
              totalEarnings: 0,
              completedProjects: 0,
            }
          : undefined,
      clientProfile:
        userRole === "client"
          ? {
              organization: organization || "",
              website: website || "",
              description: description || "",
              profileType: "startup",
              isVerified: true,
              rating: 0,
              reviewCount: 0,
              totalSpent: 0,
              projectsPosted: 0,
            }
          : undefined,
    });

    await newUser.save();
    const token = await issueSession(newUser);

    return res.status(201).json({
      token,
      user: newUser.toJSON(),
      message: "Registration successful",
    });
  } catch (error) {
    console.error("[Auth Register Error]:", error);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = await issueSession(user);
    return res.json({
      token,
      user: user.toJSON(),
      message: "Login successful",
    });
  } catch (error) {
    console.error("[Auth Login Error]:", error);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user.toJSON());
  } catch (error) {
    console.error("[Auth Profile Error]:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { name, avatar, college, degree, graduationYear, skills, bio, github, linkedin, organization, website, description } = req.body;

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (user.role === "student") {
      if (!user.studentProfile) {
        user.studentProfile = {
          college: "",
          degree: "",
          graduationYear: new Date().getFullYear() + 2,
          skills: [],
          bio: "",
          level: "beginner",
          badges: [],
          rating: 0,
          reviewCount: 0,
          totalSales: 0,
          totalEarnings: 0,
          completedProjects: 0,
        };
      }
      if (college !== undefined) user.studentProfile.college = college;
      if (degree !== undefined) user.studentProfile.degree = degree;
      if (graduationYear !== undefined) user.studentProfile.graduationYear = Number(graduationYear);
      if (skills !== undefined) user.studentProfile.skills = Array.isArray(skills) ? skills : [];
      if (bio !== undefined) user.studentProfile.bio = bio;
      if (github !== undefined) user.studentProfile.github = github;
      if (linkedin !== undefined) user.studentProfile.linkedin = linkedin;
    } else if (user.role === "client") {
      if (!user.clientProfile) {
        user.clientProfile = {
          organization: "",
          website: "",
          description: "",
          profileType: "startup",
          isVerified: true,
          rating: 0,
          reviewCount: 0,
          totalSpent: 0,
          projectsPosted: 0,
        };
      }
      if (organization !== undefined) user.clientProfile.organization = organization;
      if (website !== undefined) user.clientProfile.website = website;
      if (description !== undefined) user.clientProfile.description = description;
    }

    await user.save();
    return res.json(user.toJSON());
  } catch (error) {
    console.error("[Auth Update Profile Error]:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

export async function demoLogin(req: AuthRequest, res: Response) {
  return res.status(404).json({ error: "Demo login is disabled" });
}


export async function logout(req: AuthRequest, res: Response) {
  try {
    await Session.updateOne({ _id: req.sessionId, userId: req.user!.id }, { $set: { revokedAt: new Date() } });
    return res.json({ success: true });
  } catch { return res.status(503).json({ error: "Could not revoke session; please retry" }); }
}

export async function logoutAll(req: AuthRequest, res: Response) {
  try {
    await User.updateOne({ _id: req.user!.id }, { $inc: { authVersion: 1 } });
    return res.json({ success: true });
  } catch { return res.status(503).json({ error: "Could not revoke sessions; please retry" }); }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    try { validateNewPassword(newPassword); } catch (error) { return res.status(400).json({ error: (error as Error).message }); }
    if (typeof currentPassword !== "string" || !currentPassword) return res.status(400).json({ error: "Enter your current password" });
    const user = await User.findById(req.user!.id);
    if (!user?.password || !await bcrypt.compare(currentPassword, user.password)) return res.status(403).json({ error: "Current password is incorrect" });
    if (currentPassword === newPassword) return res.status(400).json({ error: "Choose a different new password" });
    const hash = await bcrypt.hash(newPassword, 12);
    const updated = await User.updateOne({ _id: user._id, password: user.password }, { $set: { password: hash }, $inc: { authVersion: 1 } });
    if (!updated.matchedCount) return res.status(409).json({ error: "Your password changed in another request. Sign in again." });
    return res.json({ success: true, message: "Password updated. Sign in again on all devices." });
  } catch { return res.status(503).json({ error: "Could not update password; please retry" }); }
}
