// A one-time script to seed the initial admin user.
// This should only run once when the application starts.

import { db } from './db';

// A simple mock for bcrypt.hash. In a real app, use the actual library.
const mockBcryptHash = async (password: string): Promise<string> => {
    return Promise.resolve(`hashed_${password}`);
}

export async function runAdminSeed() {
    try {
        // Check if admin table exists and has data
        const adminCount = await db.admin.count();
        if (adminCount > 0) {
            console.log('Admin user already exists. Skipping seed.');
            return;
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@wifly.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const password_hash = await mockBcryptHash(adminPassword);

        await db.admin.create({
            email: adminEmail,
            password_hash,
            role: 'admin',
        });

        await db.auditLog.create({
            admin_id: null,
            action: 'SEED_ADMIN_USER',
            details: `Initial admin user created for email: ${adminEmail}`,
            ip: 'system',
            user_agent: 'seed_script'
        });

        console.log('Successfully seeded initial admin user.');

    } catch (error) {
        console.error('Failed to run admin seed script:', error);
        // Don't throw error to prevent app startup failure
        console.warn('Admin seed failed, but continuing with app startup...');
    }
}
