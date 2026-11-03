import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "campuscode_super_secret_jwt_key_2026_dev_prod";

function generateToken(user: IUser) {
  return jwt.sign(
    {
      id: user.id || user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, role, college, degree, graduationYear, skills, bio, organization, website, description } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === "client" ? "client" : role === "admin" ? "admin" : "student";

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: userRole,
      isVerified: true,
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
    const token = generateToken(newUser);

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
    if (!email || !password) {
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

    const token = generateToken(user);
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
  try {
    const role = (req.body.role || "student").toLowerCase();
    let email = "student@campuscode.dev";
    if (role === "client") email = "client@campuscode.dev";
    if (role === "admin") email = "admin@campuscode.dev";

    let user = await User.findOne({ email });
    if (!user) {
      // Auto-create demo user if not found
      user = new User({
        name: role === "client" ? "Apex Solutions" : role === "admin" ? "CampusCode Admin" : "Alex Rivera",
        email,
        password: await bcrypt.hash("demo123456", 10),
        role: role as "student" | "client" | "admin",
        isVerified: true,
        studentProfile: role === "student" ? {
          college: "Stanford University",
          degree: "B.S. Computer Science",
          graduationYear: 2026,
          skills: ["React", "TypeScript", "Node.js", "Python", "MongoDB"],
          bio: "Full-stack developer passionate about building performant apps.",
          level: "builder",
          badges: [],
          rating: 4.9,
          reviewCount: 14,
          totalSales: 8,
          totalEarnings: 32000,
          completedProjects: 7,
          portfolioUrl: "https://github.com",
        } : undefined,
        clientProfile: role === "client" ? {
          organization: "Apex Innovations",
          website: "https://apex.dev",
          description: "Building next-gen enterprise tools.",
          profileType: "startup",
          isVerified: true,
          rating: 5.0,
          reviewCount: 6,
          totalSpent: 45000,
          projectsPosted: 4,
        } : undefined,
      });
      await user.save();
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: user.toJSON(),
      message: `Demo login as ${role} successful`,
    });
  } catch (error) {
    console.error("[Auth Demo Login Error]:", error);
    return res.status(500).json({ error: "Demo login failed" });
  }
}

