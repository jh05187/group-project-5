import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}

export async function attachOptionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      req.user = null;
      return next();
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.userId);
    req.user = user || null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
}
