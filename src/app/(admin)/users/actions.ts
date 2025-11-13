'use server';

import { db, UserSession, Plan } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const UserSchema = z.object({
  mac: z.string().regex(macAddressRegex, 'Invalid MAC address format.'),
  plan: z.string().min(1, 'Plan is required.'),
  duration: z.coerce.number().min(1, 'Duration must be greater than 0.'),
});

type ActionResponse = {
  success: boolean;
  message: string;
  errors?: z.ZodIssue[];
};

export async function getUserSessions(): Promise<UserSession[]> {
  return db.userSession.findMany();
}

export async function getPlans(): Promise<Plan[]> {
  return db.plan.findMany();
}

export async function addUserAction(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const validatedFields = UserSchema.safeParse({
    mac: formData.get('mac'),
    plan: formData.get('plan'),
    duration: formData.get('duration'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.issues,
    };
  }

  const { mac, plan, duration } = validatedFields.data;
  const startTime = new Date();
  const expiryTime = new Date(startTime.getTime() + duration * 60 * 1000);

  try {
    await db.userSession.create({
      mac,
      plan,
      startTime,
      expiryTime,
    });
    revalidatePath('/users');
    return { success: true, message: 'User added successfully.' };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, message: 'Failed to add user.' };
  }
}

export async function updateUserPlanAction(
  id: number,
  newPlanName: string,
  newDurationMinutes: number
): Promise<ActionResponse> {
  try {
    const session = await db.userSession.update(id, { plan: newPlanName, expiryTime: new Date(Date.now() + newDurationMinutes * 60 * 1000) });
    if (!session) {
      return { success: false, message: 'User session not found.' };
    }
    revalidatePath('/users');
    return { success: true, message: `User plan updated to ${newPlanName}.` };
  } catch (error) {
    console.error('Error updating plan:', error);
    return { success: false, message: 'Failed to update plan.' };
  }
}

export async function extendUserSessionAction(
  id: number,
  minutes: number
): Promise<ActionResponse> {
  try {
    const session = await db.userSession.update(id, {});
    if (!session) {
      return { success: false, message: 'User session not found.' };
    }
    const newExpiry = new Date(
      session.expiryTime.getTime() + minutes * 60 * 1000
    );
    await db.userSession.update(id, { expiryTime: newExpiry });
    revalidatePath('/users');
    return { success: true, message: `Session extended by ${minutes} minutes.` };
  } catch (error) {
    console.error('Error extending session:', error);
    return { success: false, message: 'Failed to extend session.' };
  }
}

export async function revokeUserAccessAction(id: number): Promise<ActionResponse> {
  try {
    await db.userSession.update(id, { status: 'Blocked' });
    revalidatePath('/users');
    return { success: true, message: 'User access has been revoked.' };
  } catch (error) {
    console.error('Error revoking access:', error);
    return { success: false, message: 'Failed to revoke access.' };
  }
}
