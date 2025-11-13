// This file mocks a database connection for demonstration purposes.
// In a real application, you would replace this with a connection to a
// PostgreSQL database (e.g., using `pg` or `node-postgres`).

import { addLog } from './logger';

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
  otp_code: string; // Store plain OTP for email sending
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

// Mock data
let mockVouchers: Voucher[] = [
  {
    id: 1,
    code: 'WIFLY-FREE-2024',
    duration_minutes: 60,
    is_used: false,
    created_at: new Date('2024-01-01T00:00:00Z'),
    used_at: null,
    used_by_mac: null,
  },
];
let nextVoucherId = 2;

let nextPaymentId = 5;
let mockPayments: Payment[] = [
  {
    id: 1,
    transaction_id: 'txn_1',
    mac_address: '0A:1B:2C:3D:4E:5F',
    amount: 500,
    currency: 'Ksh',
    plan_name: '24 Hours',
    payment_method: 'IntaSend',
    status: 'Completed',
    created_at: new Date('2024-07-30T10:00:00Z'),
  },
  {
    id: 2,
    transaction_id: 'txn_2',
    mac_address: '1A:2B:3C:4D:5E:6F',
    amount: 50,
    currency: 'Ksh',
    plan_name: '1 Hour',
    payment_method: 'IntaSend',
    status: 'Completed',
    created_at: new Date('2024-07-30T11:30:00Z'),
  },
  {
    id: 3,
    transaction_id: 'txn_3',
    mac_address: 'DE:AD:BE:EF:CA:FE',
    amount: 0,
    currency: 'Ksh',
    plan_name: '1 Hour (Admin)',
    payment_method: 'Manual',
    status: 'Completed',
    created_at: new Date('2024-07-30T13:00:00Z'),
  },
  {
    id: 4,
    transaction_id: 'txn_4',
    mac_address: 'AA:BB:CC:DD:EE:FF',
    amount: 250,
    currency: 'Ksh',
    plan_name: '12 Hours',
    payment_method: 'IntaSend',
    status: 'Refunded',
    created_at: new Date('2024-07-28T08:00:00Z'),
  },
];

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

let nextUserSessionId = 6;
const mockUserSessions: UserSession[] = [
  {
    id: 1,
    mac: '0A:1B:2C:3D:4E:5F',
    plan: '24 Hour Access',
    startTime: new Date('2024-07-30T10:00:00Z'),
    expiryTime: new Date('2024-07-31T10:00:00Z'),
    status: 'Active',
  },
  {
    id: 2,
    mac: '1A:2B:3C:4D:5E:6F',
    plan: '1 Hour Access',
    startTime: new Date('2024-07-30T11:30:00Z'),
    expiryTime: new Date('2024-07-30T12:30:00Z'),
    status: 'Expired',
  },
  {
    id: 3,
    mac: '7A:8B:9C:0D:1E:2F',
    plan: 'Voucher (60 min)',
    startTime: new Date('2024-07-29T21:00:00Z'),
    expiryTime: new Date('2024-07-29T22:00:00Z'),
    status: 'Expired',
  },
    {
    id: 4,
    mac: 'DE:AD:BE:EF:CA:FE',
    plan: 'Free Access (Admin)',
    startTime: new Date('2024-07-30T13:00:00Z'),
    expiryTime: new Date('2024-07-30T14:00:00Z'),
    status: 'Active',
  },
    {
    id: 5,
    mac: 'F1:E2:D3:C4:B5:A6',
    plan: '24 Hour Access',
    startTime: new Date('2024-07-25T08:00:00Z'),
    expiryTime: new Date('2024-07-26T08:00:00Z'),
    status: 'Blocked',
  },
];

let mockAdmins: Admin[] = [];
let nextAdminId = 1;

let mockAdminOtps: AdminOtp[] = [];
let nextAdminOtpId = 1;

let mockAuditLogs: AuditLog[] = [];
let nextAuditLogId = 1;


// Mock database functions
export const db = {
  voucher: {
    findMany: async (): Promise<Voucher[]> => {
        addLog({ level: 'INFO', source: 'Database', message: `Finding all vouchers.` });
        return Promise.resolve(mockVouchers);
    },
    findUnique: async (where: { code: string }): Promise<Voucher | null> => {
      addLog({ level: 'INFO', source: 'Database', message: `Searching for voucher with code: ${where.code}` });
      const voucher = mockVouchers.find((v) => v.code === where.code) || null;
      return Promise.resolve(voucher);
    },
    update: async (params: { where: { id: number }; data: Partial<Voucher> }): Promise<Voucher> => {
      addLog({ level: 'INFO', source: 'Database', message: `Updating voucher ID: ${params.where.id}`, reference: JSON.stringify(params.data) });
      const index = mockVouchers.findIndex((v) => v.id === params.where.id);
      if (index !== -1) {
        mockVouchers[index] = { ...mockVouchers[index], ...params.data };
        return Promise.resolve(mockVouchers[index]);
      }
      addLog({ level: 'ERROR', source: 'Database', message: `Voucher ID not found for update: ${params.where.id}` });
      throw new Error('Voucher not found');
    },
     create: async (data: { code: string; duration_minutes: number; sms_recipient?: string }): Promise<Voucher> => {
      addLog({ level: 'SUCCESS', source: 'Database', message: `Creating new voucher with code: ${data.code}` });
      const newVoucher: Voucher = {
        id: nextVoucherId++,
        ...data,
        is_used: false,
        created_at: new Date(),
        used_at: null,
        used_by_mac: null,
        sms_sent: false,
      };
      mockVouchers.unshift(newVoucher);
      return Promise.resolve(newVoucher);
    },
    delete: async (id: number): Promise<Voucher> => {
        addLog({ level: 'WARN', source: 'Database', message: `Deleting voucher ID: ${id}` });
        const index = mockVouchers.findIndex((v) => v.id === id);
        if (index !== -1) {
            const deleted = mockVouchers.splice(index, 1);
            return Promise.resolve(deleted[0]);
        }
        addLog({ level: 'ERROR', source: 'Database', message: `Voucher ID not found for deletion: ${id}` });
        throw new Error('Voucher not found');
    }
  },
  payment: {
    findMany: async (): Promise<Payment[]> => {
      addLog({ level: 'INFO', source: 'Database', message: `Finding all payments.` });
      return Promise.resolve(mockPayments);
    },
    create: async (data: Omit<Payment, 'id' | 'created_at' | 'currency' | 'status'>): Promise<Payment> => {
      addLog({ level: 'INFO', source: 'Database', message: `Creating new payment record for ref: ${data.transaction_id}`, reference: data.mac_address || 'N/A' });
      const newPayment: Payment = {
        id: nextPaymentId++,
        currency: 'Ksh',
        status: 'Pending', // Start as pending, will be updated by webhook
        created_at: new Date(),
        ...data,
      };
      mockPayments.unshift(newPayment);
      return Promise.resolve(newPayment);
    },
    findUnique: async (where: { transaction_id: string }): Promise<Payment | null> => {
      addLog({ level: 'INFO', source: 'Database', message: `Searching for payment with ref: ${where.transaction_id}` });
      const payment = mockPayments.find((p) => p.transaction_id === where.transaction_id) || null;
      return Promise.resolve(payment);
    },
     update: async (id: number, data: Partial<Omit<Payment, 'id'>>): Promise<Payment> => {
      addLog({ level: 'INFO', source: 'Database', message: `Updating payment ID: ${id}`, reference: JSON.stringify(data) });
      const index = mockPayments.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockPayments[index] = { ...mockPayments[index], ...data };
        if (data.status === 'Refunded') {
          mockPayments[index].refunded_at = new Date();
        }
        return Promise.resolve(mockPayments[index]);
      }
       addLog({ level: 'ERROR', source: 'Database', message: `Payment ID not found for update: ${id}` });
      throw new Error('Payment not found');
    },
    delete: async (id: number): Promise<Payment> => {
        addLog({ level: 'WARN', source: 'Database', message: `Deleting payment ID: ${id}` });
        const index = mockPayments.findIndex((p) => p.id === id);
        if (index !== -1) {
            const deleted = mockPayments.splice(index, 1);
            return Promise.resolve(deleted[0]);
        }
        addLog({ level: 'ERROR', source: 'Database', message: `Payment ID not found for deletion: ${id}` });
        throw new Error('Payment not found');
    }
  },
  plan: {
    findMany: async (): Promise<Plan[]> => {
      addLog({ level: 'INFO', source: 'Database', message: 'Finding all plans.' });
      return Promise.resolve(mockPlans);
    },
    create: async (data: Omit<Plan, 'id' | 'status'>): Promise<Plan> => {
      addLog({ level: 'SUCCESS', source: 'Database', message: `Creating new plan: ${data.name}` });
      const newPlan: Plan = {
        id: `plan_${Date.now()}`,
        ...data,
        status: 'Active',
      };
      mockPlans.unshift(newPlan);
      return Promise.resolve(newPlan);
    },
    update: async (id: string, data: Omit<Plan, 'id' | 'status'>): Promise<Plan> => {
      addLog({ level: 'INFO', source: 'Database', message: `Updating plan ID: ${id}`, reference: JSON.stringify(data) });
      const index = mockPlans.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockPlans[index] = { ...mockPlans[index], ...data };
        return Promise.resolve(mockPlans[index]);
      }
      addLog({ level: 'ERROR', source: 'Database', message: `Plan ID not found for update: ${id}` });
      throw new Error('Plan not found');
    },
    delete: async (id: string): Promise<Plan> => {
      addLog({ level: 'WARN', source: 'Database', message: `Deleting plan ID: ${id}` });
      const index = mockPlans.findIndex((p) => p.id === id);
      if (index !== -1) {
        const deleted = mockPlans.splice(index, 1);
        return Promise.resolve(deleted[0]);
      }
      addLog({ level: 'ERROR', source: 'Database', message: `Plan ID not found for deletion: ${id}` });
      throw new Error('Plan not found');
    },
  },
  userSession: {
    findMany: async (): Promise<UserSession[]> => {
      addLog({ level: 'INFO', source: 'Database', message: 'Finding all user sessions.' });
      return Promise.resolve(mockUserSessions);
    },
    create: async (data: Omit<UserSession, 'id' | 'status'>): Promise<UserSession> => {
      addLog({ level: 'SUCCESS', source: 'Database', message: `Creating new session for: ${data.mac}` });
      const newSession: UserSession = {
        id: nextUserSessionId++,
        status: 'Active',
        ...data,
      };
      mockUserSessions.unshift(newSession);
      return Promise.resolve(newSession);
    },
    update: async (id: number, data: Partial<Omit<UserSession, 'id'>>): Promise<UserSession> => {
      addLog({ level: 'INFO', source: 'Database', message: `Updating session ID: ${id}`, reference: JSON.stringify(data) });
      const index = mockUserSessions.findIndex((s) => s.id === id);
      if (index !== -1) {
        mockUserSessions[index] = { ...mockUserSessions[index], ...data };
        return Promise.resolve(mockUserSessions[index]);
      }
      addLog({ level: 'ERROR', source: 'Database', message: `Session ID not found for update: ${id}` });
      throw new Error('Session not found');
    },
    delete: async (id: number): Promise<UserSession> => {
      addLog({ level: 'WARN', source: 'Database', message: `Deleting session ID: ${id}` });
      const index = mockUserSessions.findIndex((s) => s.id === id);
      if (index !== -1) {
        const deleted = mockUserSessions.splice(index, 1);
        return Promise.resolve(deleted[0]);
      }
      addLog({ level: 'ERROR', source: 'Database', message: `Session ID not found for deletion: ${id}` });
      throw new Error('Session not found');
    }
  },
  admin: {
    count: async (): Promise<number> => {
      return Promise.resolve(mockAdmins.length);
    },
    create: async (data: Omit<Admin, 'id' | 'created_at'>): Promise<Admin> => {
      const newAdmin: Admin = {
        id: nextAdminId++,
        ...data,
        created_at: new Date(),
      };
      mockAdmins.push(newAdmin);
      return Promise.resolve(newAdmin);
    },
    findUnique: async (where: { email: string }): Promise<Admin | null> => {
      const admin = mockAdmins.find((a) => a.email === where.email) || null;
      return Promise.resolve(admin);
    }
  },
  adminOtp: {
    create: async (data: Omit<AdminOtp, 'id' | 'created_at'>): Promise<AdminOtp> => {
      const newOtp: AdminOtp = {
        id: nextAdminOtpId++,
        ...data,
        created_at: new Date(),
      };
      mockAdminOtps.push(newOtp);
      return Promise.resolve(newOtp);
    },
    findUnique: async (where: { otp_code: string; used: boolean }): Promise<AdminOtp | null> => {
      const otp = mockAdminOtps.find((o) => o.otp_code === where.otp_code && o.used === where.used) || null;
      return Promise.resolve(otp);
    },
    update: async (id: number, data: Partial<Omit<AdminOtp, 'id'>>): Promise<AdminOtp> => {
      const index = mockAdminOtps.findIndex((o) => o.id === id);
      if (index !== -1) {
        mockAdminOtps[index] = { ...mockAdminOtps[index], ...data };
        return Promise.resolve(mockAdminOtps[index]);
      }
      throw new Error('OTP not found');
    }
  },
  auditLog: {
    create: async (data: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> => {
      const newLog: AuditLog = {
        id: nextAuditLogId++,
        ...data,
        created_at: new Date(),
      };
      mockAuditLogs.unshift(newLog);
      // For demonstration, also log to the main logger
      addLog({ level: 'ADMIN', source: 'Audit', message: data.action, reference: data.details });
      return Promise.resolve(newLog);
    }
  },
  // RADIUS database functions (mock implementations)
  radius: {
    createRadcheck: async (data: { username: string; attribute: string; op: string; value: string }): Promise<any> => {
      addLog({ level: 'INFO', source: 'Database', message: `Creating radcheck entry for ${data.username}` });
      // Mock implementation - in real app, this would insert into PostgreSQL
      return Promise.resolve({ id: Date.now() });
    },
    createRadreply: async (data: { username: string; attribute: string; op: string; value: string }): Promise<any> => {
      addLog({ level: 'INFO', source: 'Database', message: `Creating radreply entry for ${data.username}` });
      return Promise.resolve({ id: Date.now() });
    },
    updateRadcheck: async (username: string, attribute: string, value: string): Promise<any> => {
      addLog({ level: 'INFO', source: 'Database', message: `Updating radcheck for ${username}` });
      return Promise.resolve(true);
    },
    updateRadreply: async (username: string, attribute: string, value: string): Promise<any> => {
      addLog({ level: 'INFO', source: 'Database', message: `Updating radreply for ${username}` });
      return Promise.resolve(true);
    },
    deleteRadcheck: async (username: string, attribute?: string): Promise<any> => {
      addLog({ level: 'INFO', source: 'Database', message: `Deleting radcheck for ${username}` });
      return Promise.resolve(true);
    },
    deleteRadreply: async (username: string, attribute?: string): Promise<any> => {
      addLog({ level: 'INFO', source: 'Database', message: `Deleting radreply for ${username}` });
      return Promise.resolve(true);
    },
  },
};
