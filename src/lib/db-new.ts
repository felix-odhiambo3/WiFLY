// Real PostgreSQL database connection using Prisma
// This replaces the mock database implementation.

import { prisma } from './prisma';
import { addLog } from './logger';

// Re-export interfaces for backward compatibility
export interface Voucher {
  id: number;
  code: string;
  duration_minutes: number;
  is_used: boolean;
  created_at: Date;
  used_at: Date | null;
  used_by_mac: string | null;
  sms_sent?: boolean;
  sms_recipient?: string;
}

export interface Payment {
  id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'Completed' | 'Pending' | 'Refunded' | 'Failed';
  mac_address: string;
  plan_name: string;
  payment_method: 'IntaSend' | 'Manual';
  created_at: Date;
  refunded_at?: Date;
  refund_reason?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  duration: string;
  speedLimit: string;
  status: 'Active' | 'Archived';
}

export interface UserSession {
  id: number;
  mac: string;
  plan: string;
  startTime: Date;
  expiryTime: Date;
  status: 'Active' | 'Expired' | 'Blocked';
  created_at: Date;
}

// --- Admin Auth Schemas ---
export interface Admin {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin';
  created_at: Date;
}

export interface AdminOtp {
  id: number;
  admin_id: number;
  otp_hash: string;
  otp_code: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
  request_ip: string;
  attempts: number;
}

export interface AdminSession {
  id: number;
  admin_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
  last_used_at: Date;
  client_ip: string;
  user_agent: string;
}

export interface AuditLog {
  id: number;
  admin_id: number | null;
  action: string;
  details: string;
  ip: string | null;
  user_agent: string | null;
  created_at: Date;
}

// Real database functions using Prisma
export const db = {
  voucher: {
    findMany: async (): Promise<Voucher[]> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: 'Finding all vouchers.' });
        const vouchers = await prisma.voucher.findMany({
          orderBy: { created_at: 'desc' }
        });
        return vouchers;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find vouchers', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    findUnique: async (where: { code: string }): Promise<Voucher | null> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Searching for voucher with code: ${where.code}` });
        const voucher = await prisma.voucher.findUnique({
          where: { code: where.code }
        });
        return voucher;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find voucher', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    update: async (params: { where: { id: number }; data: Partial<Voucher> }): Promise<Voucher> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Updating voucher ID: ${params.where.id}`, reference: JSON.stringify(params.data) });
        const voucher = await prisma.voucher.update({
          where: { id: params.where.id },
          data: params.data
        });
        return voucher;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to update voucher', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    create: async (data: { code: string; duration_minutes: number; sms_recipient?: string }): Promise<Voucher> => {
      try {
        addLog({ level: 'SUCCESS', source: 'Database', message: `Creating new voucher with code: ${data.code}` });
        const voucher = await prisma.voucher.create({
          data: {
            code: data.code,
            duration_minutes: data.duration_minutes,
            sms_recipient: data.sms_recipient,
            sms_sent: false,
            is_used: false
          }
        });
        return voucher;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create voucher', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    delete: async (id: number): Promise<Voucher> => {
      try {
        addLog({ level: 'WARN', source: 'Database', message: `Deleting voucher ID: ${id}` });
        const voucher = await prisma.voucher.delete({
          where: { id }
        });
        return voucher;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to delete voucher', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    }
  },
  payment: {
    findMany: async (): Promise<Payment[]> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: 'Finding all payments.' });
        const payments = await prisma.payment.findMany({
          orderBy: { created_at: 'desc' }
        });
        return payments;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find payments', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    create: async (data: Omit<Payment, 'id' | 'created_at' | 'currency' | 'status'>): Promise<Payment> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Creating new payment record for ref: ${data.transaction_id}`, reference: data.mac_address || 'N/A' });
        const payment = await prisma.payment.create({
          data: {
            transaction_id: data.transaction_id,
            amount: data.amount,
            currency: 'KES',
            status: 'Pending',
            mac_address: data.mac_address,
            plan_name: data.plan_name,
            payment_method: data.payment_method,
            refunded_at: data.refunded_at,
            refund_reason: data.refund_reason
          }
        });
        return payment;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create payment', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    findUnique: async (where: { transaction_id: string }): Promise<Payment | null> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Searching for payment with ref: ${where.transaction_id}` });
        const payment = await prisma.payment.findUnique({
          where: { transaction_id: where.transaction_id }
        });
        return payment;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find payment', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    update: async (id: number, data: Partial<Omit<Payment, 'id'>>): Promise<Payment> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Updating payment ID: ${id}`, reference: JSON.stringify(data) });
        const payment = await prisma.payment.update({
          where: { id },
          data
        });
        return payment;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to update payment', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    delete: async (id: number): Promise<Payment> => {
      try {
        addLog({ level: 'WARN', source: 'Database', message: `Deleting payment ID: ${id}` });
        const payment = await prisma.payment.delete({
          where: { id }
        });
        return payment;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to delete payment', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    }
  },
  plan: {
    findMany: async (): Promise<Plan[]> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: 'Finding all plans.' });
        // For now, return mock plans since we don't have a plans table
        // In a real implementation, you'd have a plans table
        const mockPlans: Plan[] = [
          {
            id: 'plan_1',
            name: '1 Hour Access',
            price: 'Ksh 50',
            duration: '60 minutes',
            speedLimit: '5 Mbps',
            status: 'Active',
          },
          {
            id: 'plan_2',
            name: '12 Hour Access',
            price: 'Ksh 250',
            duration: '720 minutes',
            speedLimit: '10 Mbps',
            status: 'Active',
          },
          {
            id: 'plan_3',
            name: '24 Hour Access',
            price: 'Ksh 500',
            duration: '1440 minutes',
            speedLimit: '10 Mbps',
            status: 'Active',
          },
          {
            id: 'plan_4',
            name: 'Weekly Pass',
            price: 'Ksh 1000',
            duration: '7 days',
            speedLimit: '15 Mbps',
            status: 'Active',
          },
          {
            id: 'plan_5',
            name: 'Legacy 30 Min',
            price: 'Ksh 20',
            duration: '30 minutes',
            speedLimit: '2 Mbps',
            status: 'Archived',
          },
        ];
        return mockPlans;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find plans', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    create: async (data: Omit<Plan, 'id' | 'status'>): Promise<Plan> => {
      try {
        addLog({ level: 'SUCCESS', source: 'Database', message: `Creating new plan: ${data.name}` });
        // Mock implementation - in real app, you'd save to database
        const newPlan: Plan = {
          id: `plan_${Date.now()}`,
          ...data,
          status: 'Active',
        };
        return newPlan;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create plan', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    update: async (id: string, data: Omit<Plan, 'id' | 'status'>): Promise<Plan> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Updating plan ID: ${id}`, reference: JSON.stringify(data) });
        // Mock implementation
        const updatedPlan: Plan = {
          id,
          ...data,
          status: 'Active',
        };
        return updatedPlan;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to update plan', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    delete: async (id: string): Promise<Plan> => {
      try {
        addLog({ level: 'WARN', source: 'Database', message: `Deleting plan ID: ${id}` });
        // Mock implementation
        throw new Error('Plan deletion not implemented');
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to delete plan', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
  },
  userSession: {
    findMany: async (): Promise<UserSession[]> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: 'Finding all user sessions.' });
        const sessions = await prisma.userSession.findMany({
          orderBy: { created_at: 'desc' }
        });
        return sessions.map(session => ({
          id: session.id,
          mac: session.mac,
          plan: session.plan,
          startTime: session.start_time,
          expiryTime: session.expiry_time,
          status: session.status as 'Active' | 'Expired' | 'Blocked',
          created_at: session.created_at
        }));
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find user sessions', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    create: async (data: Omit<UserSession, 'id' | 'status'>): Promise<UserSession> => {
      try {
        addLog({ level: 'SUCCESS', source: 'Database', message: `Creating new session for: ${data.mac}` });
        const session = await prisma.userSession.create({
          data: {
            mac: data.mac,
            plan: data.plan,
            start_time: data.startTime,
            expiry_time: data.expiryTime,
            status: 'Active'
          }
        });
        return {
          id: session.id,
          mac: session.mac,
          plan: session.plan,
          startTime: session.start_time,
          expiryTime: session.expiry_time,
          status: session.status as 'Active' | 'Expired' | 'Blocked',
          created_at: session.created_at
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create user session', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    update: async (id: number, data: Partial<Omit<UserSession, 'id'>>): Promise<UserSession> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Updating session ID: ${id}`, reference: JSON.stringify(data) });
        const updateData: any = {};
        if (data.status) updateData.status = data.status;
        if (data.expiryTime) updateData.expiry_time = data.expiryTime;

        const session = await prisma.userSession.update({
          where: { id },
          data: updateData
        });
        return {
          id: session.id,
          mac: session.mac,
          plan: session.plan,
          startTime: session.start_time,
          expiryTime: session.expiry_time,
          status: session.status as 'Active' | 'Expired' | 'Blocked',
          created_at: session.created_at
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to update user session', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    delete: async (id: number): Promise<UserSession> => {
      try {
        addLog({ level: 'WARN', source: 'Database', message: `Deleting session ID: ${id}` });
        const session = await prisma.userSession.delete({
          where: { id }
        });
        return {
          id: session.id,
          mac: session.mac,
          plan: session.plan,
          startTime: session.start_time,
          expiryTime: session.expiry_time,
          status: session.status as 'Active' | 'Expired' | 'Blocked',
          created_at: session.created_at
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to delete user session', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    }
  },
  admin: {
    count: async (): Promise<number> => {
      try {
        const count = await prisma.admin.count();
        return count;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to count admins', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    create: async (data: Omit<Admin, 'id' | 'created_at'>): Promise<Admin> => {
      try {
        const admin = await prisma.admin.create({
          data: {
            email: data.email,
            password_hash: data.password_hash,
            role: data.role
          }
        });
        return {
          id: admin.id,
          email: admin.email,
          password_hash: admin.password_hash,
          role: admin.role as 'admin',
          created_at: admin.created_at
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create admin', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    findUnique: async (where: { email: string }): Promise<Admin | null> => {
      try {
        const admin = await prisma.admin.findUnique({
          where: { email: where.email }
        });
        if (!admin) return null;
        return {
          id: admin.id,
          email: admin.email,
          password_hash: admin.password_hash,
          role: admin.role as 'admin',
          created_at: admin.created_at
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find admin', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    }
  },
  adminOtp: {
    create: async (data: Omit<AdminOtp, 'id' | 'created_at'>): Promise<AdminOtp> => {
      try {
        const otp = await prisma.adminOtp.create({
          data: {
            admin_id: data.admin_id,
            otp_hash: data.otp_hash,
            otp_code: data.otp_code,
            expires_at: data.expires_at,
            used: data.used,
            request_ip: data.request_ip,
            attempts: data.attempts
          }
        });
        return {
          id: otp.id,
          admin_id: otp.admin_id,
          otp_hash: otp.otp_hash,
          otp_code: otp.otp_code,
          expires_at: otp.expires_at,
          used: otp.used,
          created_at: otp.created_at,
          request_ip: otp.request_ip,
          attempts: otp.attempts
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create admin OTP', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    findUnique: async (where: { otp_code: string; used: boolean }): Promise<AdminOtp | null> => {
      try {
        const otp = await prisma.adminOtp.findFirst({
          where: {
            otp_code: where.otp_code,
            used: where.used
          }
        });
        if (!otp) return null;
        return {
          id: otp.id,
          admin_id: otp.admin_id,
          otp_hash: otp.otp_hash,
          otp_code: otp.otp_code,
          expires_at: otp.expires_at,
          used: otp.used,
          created_at: otp.created_at,
          request_ip: otp.request_ip,
          attempts: otp.attempts
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to find admin OTP', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    update: async (id: number, data: Partial<Omit<AdminOtp, 'id'>>): Promise<AdminOtp> => {
      try {
        const otp = await prisma.adminOtp.update({
          where: { id },
          data
        });
        return {
          id: otp.id,
          admin_id: otp.admin_id,
          otp_hash: otp.otp_hash,
          otp_code: otp.otp_code,
          expires_at: otp.expires_at,
          used: otp.used,
          created_at: otp.created_at,
          request_ip: otp.request_ip,
          attempts: otp.attempts
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to update admin OTP', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    }
  },
  auditLog: {
    create: async (data: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> => {
      try {
        const log = await prisma.auditLog.create({
          data: {
            admin_id: data.admin_id,
            action: data.action,
            details: data.details,
            ip: data.ip,
            user_agent: data.user_agent
          }
        });
        return {
          id: log.id,
          admin_id: log.admin_id,
          action: log.action,
          details: log.details,
          ip: log.ip,
          user_agent: log.user_agent,
          created_at: log.created_at
        };
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create audit log', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    }
  },
  // RADIUS database functions using Prisma
  radius: {
    createRadcheck: async (data: { username: string; attribute: string; op: string; value: string }): Promise<any> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Creating radcheck entry for ${data.username}` });
        const radcheck = await prisma.radcheck.create({
          data: {
            username: data.username,
            attribute: data.attribute,
            op: data.op,
            value: data.value
          }
        });
        return radcheck;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create radcheck', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    createRadreply: async (data: { username: string; attribute: string; op: string; value: string }): Promise<any> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Creating radreply entry for ${data.username}` });
        const radreply = await prisma.radreply.create({
          data: {
            username: data.username,
            attribute: data.attribute,
            op: data.op,
            value: data.value
          }
        });
        return radreply;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to create radreply', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    updateRadcheck: async (username: string, attribute: string, value: string): Promise<any> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Updating radcheck for ${username}` });
        const radcheck = await prisma.radcheck.updateMany({
          where: {
            username,
            attribute
          },
          data: {
            value
          }
        });
        return radcheck;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to update radcheck', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    updateRadreply: async (username: string, attribute: string, value: string): Promise<any> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Updating radreply for ${username}` });
        const radreply = await prisma.radreply.updateMany({
          where: {
            username,
            attribute
          },
          data: {
            value
          }
        });
        return radreply;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to update radreply', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    deleteRadcheck: async (username: string, attribute?: string): Promise<any> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Deleting radcheck for ${username}` });
        const where: any = { username };
        if (attribute) where.attribute = attribute;

        const radcheck = await prisma.radcheck.deleteMany({
          where
        });
        return radcheck;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to delete radcheck', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
    deleteRadreply: async (username: string, attribute?: string): Promise<any> => {
      try {
        addLog({ level: 'INFO', source: 'Database', message: `Deleting radreply for ${username}` });
        const where: any = { username };
        if (attribute) where.attribute = attribute;

        const radreply = await prisma.radreply.deleteMany({
          where
        });
        return radreply;
      } catch (error) {
        addLog({ level: 'ERROR', source: 'Database', message: 'Failed to delete radreply', reference: error instanceof Error ? error.message : 'Unknown error' });
        throw error;
      }
    },
  },
};
