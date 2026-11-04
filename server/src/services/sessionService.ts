import jwt from "jsonwebtoken";
import { Session } from "../models/Session.js";
import { IUser } from "../models/User.js";
import { getJwtSecret } from "../config/security.js";

export async function issueSession(user: IUser) {
  const secret = getJwtSecret();
  const session = await Session.create({ userId: user._id, authVersion: user.authVersion || 0, expiresAt: new Date(Date.now() + 86400000) });
  return jwt.sign({ id: user.id }, secret, { jwtid: session.id, expiresIn: "1d", algorithm: "HS256" });
}

export function validateNewPassword(password: unknown) {
  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Use a password of at least 8 characters and at most 72 UTF-8 bytes");
  }
}
