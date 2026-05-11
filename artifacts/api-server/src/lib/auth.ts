import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ACCESS_SECRET = process.env["JWT_SECRET"] ?? "lumiere-access-secret-dev";
const REFRESH_SECRET = process.env["JWT_REFRESH_SECRET"] ?? "lumiere-refresh-secret-dev";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): { userId: number; role: string } {
  return jwt.verify(token, ACCESS_SECRET) as { userId: number; role: string };
}

export function verifyRefreshToken(token: string): { userId: number } {
  return jwt.verify(token, REFRESH_SECRET) as { userId: number };
}
