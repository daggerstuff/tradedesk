import { SignJWT, jwtVerify } from 'jose';
import { createId } from '@paralleldrive/cuid2';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export interface JWTPayload {
  userId: string;
  email: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export function generateId(prefix?: string): string {
  const id = createId();
  return prefix ? `${prefix}_${id}` : id;
}

export function generateToken(): string {
  return createId() + createId();
}
