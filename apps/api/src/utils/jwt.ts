import { sign, verify } from 'hono/jwt';

const JWT_ACCESS_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JWTPayload {
  userId: string;
  studioId: string | null;
  role: 'SUPER_ADMIN'|'ADMIN' | 'INSTRUCTOR' | 'CLIENT';
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

// Access Token: 15 dakika geçerli
export async function generateAccessToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 15; // 15 dk
  return await sign({ ...payload, exp: expiresAt }, JWT_ACCESS_SECRET);
}

// Refresh Token: 7 gün geçerli
export async function generateRefreshToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 gün
  return await sign({ ...payload, exp: expiresAt }, JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    return (await verify(token, JWT_ACCESS_SECRET,{ alg:'HS256'})) as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    return (await verify(token, JWT_REFRESH_SECRET,{ alg:'HS256'})) as unknown as JWTPayload;
  } catch {
    return null;
  }
}