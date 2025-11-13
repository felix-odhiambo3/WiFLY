import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOTP, createAdminSessionToken } from '@/lib/auth';
import { addLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const admin = await verifyAdminOTP(otp);

    // Create session token
    const token = createAdminSessionToken(admin);

    addLog({
      level: 'SUCCESS',
      source: 'AdminAuth',
      message: 'Admin login successful',
      reference: admin.email
    });

    return NextResponse.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error: any) {
    addLog({
      level: 'ERROR',
      source: 'AdminAuth',
      message: 'OTP verification failed',
      reference: error.message
    });

    return NextResponse.json(
      { error: error.message || 'OTP verification failed' },
      { status: 401 }
    );
  }
}
