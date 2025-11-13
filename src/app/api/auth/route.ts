import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addLog } from '@/lib/logger';

// RADIUS Authentication Endpoint for Nodogsplash
// This endpoint validates RADIUS credentials against the database
// URL format: http://[GatewayAddress]:[GatewayPort]/nodogsplash_auth/?token=[username:password]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const mac = searchParams.get('mac'); // MAC address from Nodogsplash

    if (!token) {
      addLog({ level: 'WARN', source: 'AuthAPI', message: 'Missing token parameter in auth request' });
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    addLog({ level: 'INFO', source: 'AuthAPI', message: `Received auth request with token: ${token}`, reference: mac || 'no-mac' });

    // Parse RADIUS credentials from token
    const [username, password] = token.split(':');

    if (!username || !password) {
      addLog({ level: 'WARN', source: 'AuthAPI', message: 'Invalid token format', reference: token });
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    // Validate RADIUS credentials against database
    const radiusUser = await db.radius.getRadcheck(username);

    if (!radiusUser) {
      addLog({ level: 'WARN', source: 'AuthAPI', message: `RADIUS user not found: ${username}`, reference: mac || 'no-mac' });
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Verify password
    if (radiusUser.value !== password) {
      addLog({ level: 'WARN', source: 'AuthAPI', message: `Invalid password for user: ${username}`, reference: mac || 'no-mac' });
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Check MAC address binding if specified
    if (mac) {
      const macBinding = await db.radius.getRadreply(username, 'Calling-Station-Id');
      if (macBinding && macBinding.value !== mac) {
        addLog({ level: 'WARN', source: 'AuthAPI', message: `MAC address mismatch for user: ${username}`, reference: `${mac} != ${macBinding.value}` });
        return NextResponse.json({ error: 'MAC address binding violation' }, { status: 403 });
      }
    }

    // Get session timeout
    const sessionTimeout = await db.radius.getRadreply(username, 'Session-Timeout');
    const timeoutSeconds = sessionTimeout ? parseInt(sessionTimeout.value) : 3600; // Default 1 hour

    // Create or update accounting record
    await db.radius.createRadacct({
      username,
      nasipaddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      nasportid: mac || 'unknown',
      nasporttype: 'Wireless-802.11',
      acctstarttime: new Date(),
      acctsessionid: `${username}_${Date.now()}`,
      callingstationid: mac || 'unknown',
      framedipaddress: '192.168.1.0', // Will be assigned by DHCP
      acctsessiontime: 0,
      acctinputoctets: 0,
      acctoutputoctets: 0,
    });

    addLog({ level: 'SUCCESS', source: 'AuthAPI', message: `RADIUS authentication successful for user: ${username}`, reference: mac || 'no-mac' });

    // Return success response that Nodogsplash understands
    // This allows the user to access the internet
    return new NextResponse(
      `<html><head><title>WiFly - Authenticated</title></head><body><h1>Authentication Successful</h1><p>You are now connected to WiFly hotspot.</p><p>Session timeout: ${Math.floor(timeoutSeconds / 60)} minutes</p><script>window.location.href = 'http://wifly-portal.com/status';</script></body></html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'X-Session-Timeout': timeoutSeconds.toString(),
        },
      }
    );

  } catch (error: any) {
    addLog({ level: 'ERROR', source: 'AuthAPI', message: 'Error processing auth request: ' + error.message });
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Handle POST requests if needed for additional auth methods
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
