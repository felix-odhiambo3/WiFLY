import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, sendAdminOTP } from '@/lib/auth';
import { addLog } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate admin
    const admin = await authenticateAdmin(email, password);

    // Send OTP
    const otp = await sendAdminOTP(admin.id, admin.email);

    addLog({
      level: 'INFO',
      source: 'AdminAuth',
      message: 'OTP sent successfully',
      reference: admin.email
    });

    return NextResponse.json({
      message: 'OTP sent to your email',
      // In production, don't return the OTP
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error: any) {
    addLog({
      level: 'ERROR',
      source: 'AdminAuth',
      message: 'Admin login failed',
      reference: error.message
    });

    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}
