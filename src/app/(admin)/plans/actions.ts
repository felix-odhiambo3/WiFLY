'use server';

import { db, Plan } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const PlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Plan name is required.'),
  price: z.string().min(1, 'Price is required.'),
  duration: z.string().min(1, 'Duration is required.'),
  speedLimit: z.string().min(1, 'Speed limit is required.'),
});

type ActionResponse = {
  success: boolean;
  message: string;
  errors?: z.ZodIssue[];
};

export async function getPlans(): Promise<Plan[]> {
  return db.plan.findMany();
}

export async function createPlanAction(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const validatedFields = PlanSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.issues,
    };
  }

  try {
    await db.plan.create(validatedFields.data);
    revalidatePath('/plans');
    return { success: true, message: `Plan "${validatedFields.data.name}" created.` };
  } catch (error) {
    console.error('Error creating plan:', error);
    return { success: false, message: 'Failed to create plan.' };
  }
}

export async function updatePlanAction(
  prevState: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = PlanSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.issues,
    };
  }
  
  const { id, ...planData } = validatedFields.data;

  if (!id) {
    return { success: false, message: 'Plan ID is missing.' };
  }
  
  try {
    await db.plan.update(id, planData);
    revalidatePath('/plans');
    return { success: true, message: `Plan "${planData.name}" updated.` };
  } catch (error) {
    console.error('Error updating plan:', error);
    return { success: false, message: 'Failed to update plan.' };
  }
}

export async function deletePlanAction(id: string): Promise<ActionResponse> {
  try {
    await db.plan.delete(id);
    revalidatePath('/plans');
    return { success: true, message: 'Plan deleted successfully.' };
  } catch (error) {
    console.error('Error deleting plan:', error);
    return { success: false, message: 'Failed to delete plan.' };
  }
}