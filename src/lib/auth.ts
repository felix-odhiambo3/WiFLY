import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from './db';
import { addLog } from './logger';

const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development-only';

if (!jwtSecret || jwtSecret === 'fallback-jwt-secret-for-development-only') {
  console.warn('⚠️  WARNING: Using fallback JWT secret. Set JWT_SECRET environment variable for production!');
}

export const SessionJwtPayloadSchema = z.object({
  mac: z.string(),
  plan: z.string(),
  durationMinutes: z.number(),
});

export type SessionJwtPayload = z.infer<typeof SessionJwtPayloadSchema>;

/**
 * Creates a signed JWT for a user session.
 * @param payload - The data to include in the token.
 * @returns The signed JWT string.
 */
export function createSessionToken(payload: SessionJwtPayload): string {
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: `${payload.durationMinutes}m`,
  });
  return token;
}

/**
 * Verifies a session token and returns its payload.
 * Throws an error if the token is invalid or expired.
 * @param token - The JWT string to verify.
 * @returns The decoded payload.
 */
export function verifySessionToken(token: string): SessionJwtPayload & { iat: number; exp: number } {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const payload = SessionJwtPayloadSchema.extend({
      iat: z.number(),
      exp: z.number(),
    }).parse(decoded);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid or expired session token.');
  }
}

// Admin OTP Authentication Schema
export const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const OtpVerificationSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * Generates a 6-digit OTP code.
 * @returns The OTP code as a string.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes an OTP for secure storage.
 * @param otp - The plain OTP string.
 * @returns The hashed OTP.
 */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verifies an OTP against its hash.
 * @param otp - The plain OTP string.
 * @param hash - The hashed OTP.
 * @returns True if the OTP matches the hash.
 */
export function verifyOTP(otp: string, hash: string): boolean {
  return crypto.createHash('sha256').update(otp).digest('hex') === hash;
}

/**
 * Authenticates an admin user with email and password.
 * @param email - Admin email address.
 * @param password - Admin password.
 * @returns Admin user object if authentication successful.
 */
export async function authenticateAdmin(email: string, password: string) {
  const admin = await db.admin.findUnique({ email });

  if (!admin) {
    addLog({ level: 'WARN', source: 'AdminAuth', message: 'Admin login attempt with unknown email', reference: email });
    throw new Error('Invalid email or password');
  }

  // In a real app, use proper password hashing like bcrypt
  // For demo purposes, we're using simple comparison
  const mockHashedPassword = `hashed_${password}`;
  if (admin.password_hash !== mockHashedPassword) {
    addLog({ level: 'WARN', source: 'AdminAuth', message: 'Admin login attempt with wrong password', reference: email });
    throw new Error('Invalid email or password');
  }

  addLog({ level: 'INFO', source: 'AdminAuth', message: 'Admin authentication successful', reference: email });
  return admin;
}

/**
 * Sends an OTP to the admin's email.
 * In production, integrate with email service like SendGrid, Mailgun, etc.
 * @param adminId - The admin ID.
 * @param email - The admin's email address.
 * @returns The OTP code (for demo purposes).
 */
export async function sendAdminOTP(adminId: number, email: string): Promise<string> {
  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  // Store OTP in database
  await db.adminOtp.create({
    admin_id: adminId,
    otp_hash: otpHash,
    otp_code: otp, // Store plain OTP for email sending (in production, don't store plain OTP)
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    request_ip: '127.0.0.1', // In production, get from request
    attempts: 0,
    used: false,
  });

  // In production, send email with OTP
  // For demo purposes, we'll log the OTP
  console.log(`📧 OTP for ${email}: ${otp}`);
  addLog({ level: 'INFO', source: 'AdminAuth', message: 'OTP sent to admin email', reference: email });

  return otp; // Return OTP for demo purposes only
}

/**
 * Verifies an admin OTP.
 * @param otp - The OTP code entered by the admin.
 * @returns Admin user object if verification successful.
 */
export async function verifyAdminOTP(otp: string) {
  const otpRecord = await db.adminOtp.findUnique({ otp_code: otp, used: false });

  if (!otpRecord) {
    addLog({ level: 'WARN', source: 'AdminAuth', message: 'OTP verification failed - invalid or used OTP', reference: otp });
    throw new Error('Invalid or expired OTP');
  }

  if (otpRecord.expires_at < new Date()) {
    addLog({ level: 'WARN', source: 'AdminAuth', message: 'OTP verification failed - expired OTP', reference: otp });
    throw new Error('OTP has expired');
  }

  if (otpRecord.attempts >= 3) {
    addLog({ level: 'WARN', source: 'AdminAuth', message: 'OTP verification failed - too many attempts', reference: otp });
    throw new Error('Too many failed attempts');
  }

  // Mark OTP as used
  await db.adminOtp.update(otpRecord.id, { used: true });

  // Get admin details
  const admin = await db.admin.findUnique({ email: otpRecord.admin_id.toString() });
  if (!admin) {
    addLog({ level: 'ERROR', source: 'AdminAuth', message: 'OTP verified but admin not found', reference: otp });
    throw new Error('Admin account not found');
  }

  addLog({ level: 'SUCCESS', source: 'AdminAuth', message: 'OTP verification successful', reference: admin.email });
  return admin;
}

/**
 * Creates an admin session token.
 * @param admin - The admin user object.
 * @returns Session token.
 */
export function createAdminSessionToken(admin: { id: number; email: string }): string {
  const payload = {
    adminId: admin.id,
    email: admin.email,
    role: 'admin',
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
}

/**
 * Verifies an admin session token.
 * @param token - The session token.
 * @returns Decoded admin payload.
 */
export function verifyAdminSessionToken(token: string) {
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    return {
      adminId: decoded.adminId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    addLog({ level: 'WARN', source: 'AdminAuth', message: 'Admin session token verification failed' });
    throw new Error('Invalid admin session');
  }
}
