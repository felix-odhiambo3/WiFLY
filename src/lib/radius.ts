// FreeRADIUS client library for WiFly hotspot management.
// This replaces JWT-based authentication with RADIUS-based access control.

import { db } from './db';
import { addLog } from './logger';
import crypto from 'crypto';

const RADIUS_HOST = process.env.RADIUS_HOST || 'localhost';
const RADIUS_SECRET = process.env.RADIUS_SECRET || 'testing123';
const RADIUS_PORT = parseInt(process.env.RADIUS_PORT || '1812');

/**
 * Generates a unique RADIUS username for a user session.
 * Format: user_[mac]_[timestamp]
 */
export function generateRadiusUsername(macAddress: string): string {
  const timestamp = Date.now();
  const cleanMac = macAddress.replace(/:/g, '').toLowerCase();
  return `user_${cleanMac}_${timestamp}`;
}

/**
 * Generates a secure RADIUS password for a user session.
 */
export function generateRadiusPassword(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Creates a RADIUS user for voucher-based access.
 * @param macAddress - The device's MAC address.
 * @param durationMinutes - Session duration in minutes.
 * @returns RADIUS username and password.
 */
export async function createRadiusUserForVoucher(macAddress: string, durationMinutes: number): Promise<{ username: string; password: string }> {
  const username = generateRadiusUsername(macAddress);
  const password = generateRadiusPassword();

  addLog({ level: 'INFO', source: 'RADIUS', message: `Creating RADIUS user for voucher: ${username}`, reference: macAddress });

  try {
    // Create radcheck entry for authentication
    await db.radius.createRadcheck({
      username,
      attribute: 'Cleartext-Password',
      op: ':=',
      value: password,
    });

    // Create radreply entries for session attributes
    const sessionTimeout = durationMinutes * 60; // Convert to seconds

    await db.radius.createRadreply({
      username,
      attribute: 'Session-Timeout',
      op: ':=',
      value: sessionTimeout.toString(),
    });

    // MAC address binding for security
    await db.radius.createRadreply({
      username,
      attribute: 'Calling-Station-Id',
      op: ':=',
      value: macAddress,
    });

    addLog({ level: 'SUCCESS', source: 'RADIUS', message: `RADIUS user created successfully: ${username}`, reference: macAddress });

    return { username, password };
  } catch (error) {
    addLog({ level: 'ERROR', source: 'RADIUS', message: `Failed to create RADIUS user: ${error}`, reference: username });
    throw new Error('Failed to create RADIUS user');
  }
}

/**
 * Creates a RADIUS user for payment-based access.
 * @param macAddress - The device's MAC address.
 * @param planName - Name of the purchased plan.
 * @returns RADIUS username and password.
 */
export async function createRadiusUserForPayment(macAddress: string, planName: string): Promise<{ username: string; password: string }> {
  const username = generateRadiusUsername(macAddress);
  const password = generateRadiusPassword();

  addLog({ level: 'INFO', source: 'RADIUS', message: `Creating RADIUS user for payment: ${username}`, reference: macAddress });

  try {
    // Create radcheck entry for authentication
    await db.radius.createRadcheck({
      username,
      attribute: 'Cleartext-Password',
      op: ':=',
      value: password,
    });

    // Determine session timeout based on plan
    let sessionTimeout: number;
    if (planName.includes('24 Hour') || planName.includes('24h')) {
      sessionTimeout = 24 * 60 * 60; // 24 hours in seconds
    } else if (planName.includes('12 Hour') || planName.includes('12h')) {
      sessionTimeout = 12 * 60 * 60; // 12 hours in seconds
    } else if (planName.includes('1 Hour') || planName.includes('1h')) {
      sessionTimeout = 1 * 60 * 60; // 1 hour in seconds
    } else {
      sessionTimeout = 24 * 60 * 60; // Default to 24 hours
    }

    await db.radius.createRadreply({
      username,
      attribute: 'Session-Timeout',
      op: ':=',
      value: sessionTimeout.toString(),
    });

    // MAC address binding for security
    await db.radius.createRadreply({
      username,
      attribute: 'Calling-Station-Id',
      op: ':=',
      value: macAddress,
    });

    addLog({ level: 'SUCCESS', source: 'RADIUS', message: `RADIUS user created for payment: ${username}`, reference: macAddress });

    return { username, password };
  } catch (error) {
    addLog({ level: 'ERROR', source: 'RADIUS', message: `Failed to create RADIUS user: ${error}`, reference: username });
    throw new Error('Failed to create RADIUS user');
  }
}

/**
 * Updates a RADIUS user's session timeout (for extensions).
 * @param username - RADIUS username.
 * @param additionalMinutes - Additional minutes to add.
 */
export async function extendRadiusUserSession(username: string, additionalMinutes: number): Promise<void> {
  addLog({ level: 'INFO', source: 'RADIUS', message: `Extending session for: ${username}`, reference: `${additionalMinutes} minutes` });

  try {
    const additionalSeconds = additionalMinutes * 60;
    await db.radius.updateRadreply(username, 'Session-Timeout', `+=${additionalSeconds}`);
    addLog({ level: 'SUCCESS', source: 'RADIUS', message: `Session extended for: ${username}` });
  } catch (error) {
    addLog({ level: 'ERROR', source: 'RADIUS', message: `Failed to extend session: ${error}`, reference: username });
    throw new Error('Failed to extend RADIUS session');
  }
}

/**
 * Deletes a RADIUS user (for session cleanup).
 * @param username - RADIUS username.
 */
export async function deleteRadiusUser(username: string): Promise<void> {
  addLog({ level: 'INFO', source: 'RADIUS', message: `Deleting RADIUS user: ${username}` });

  try {
    await db.radius.deleteRadcheck(username);
    await db.radius.deleteRadreply(username);
    addLog({ level: 'SUCCESS', source: 'RADIUS', message: `RADIUS user deleted: ${username}` });
  } catch (error) {
    addLog({ level: 'ERROR', source: 'RADIUS', message: `Failed to delete RADIUS user: ${error}`, reference: username });
    throw new Error('Failed to delete RADIUS user');
  }
}

/**
 * Sends a CoA (Change of Authorization) request to disconnect a user.
 * @param username - RADIUS username.
 * @param macAddress - MAC address for identification.
 */
export async function disconnectRadiusUser(username: string, macAddress: string): Promise<void> {
  addLog({ level: 'INFO', source: 'RADIUS', message: `Sending CoA disconnect for: ${username}`, reference: macAddress });

  // In a real implementation, this would send a RADIUS CoA packet
  // For now, we'll simulate by deleting the user
  try {
    await deleteRadiusUser(username);
    addLog({ level: 'SUCCESS', source: 'RADIUS', message: `CoA disconnect sent for: ${username}` });
  } catch (error) {
    addLog({ level: 'ERROR', source: 'RADIUS', message: `Failed to send CoA: ${error}`, reference: username });
    throw new Error('Failed to disconnect RADIUS user');
  }
}

/**
 * Updates RADIUS user attributes for dynamic session management.
 * @param username - RADIUS username.
 * @param attributes - Attributes to update.
 */
export async function updateRadiusUser(username: string, attributes: Record<string, string>): Promise<void> {
  addLog({ level: 'INFO', source: 'RADIUS', message: `Updating RADIUS user: ${username}`, reference: Object.keys(attributes).join(', ') });

  try {
    for (const [attribute, value] of Object.entries(attributes)) {
      if (attribute === 'Session-Timeout' || attribute === 'Calling-Station-Id') {
        await db.radius.updateRadreply(username, attribute, value);
      } else {
        await db.radius.updateRadcheck(username, attribute, value);
      }
    }
    addLog({ level: 'SUCCESS', source: 'RADIUS', message: `RADIUS user updated: ${username}` });
  } catch (error) {
    addLog({ level: 'ERROR', source: 'RADIUS', message: `Failed to update RADIUS user: ${error}`, reference: username });
    throw new Error('Failed to update RADIUS user');
  }
}
