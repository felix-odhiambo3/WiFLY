-- WiFly PostgreSQL Schema

-- This table stores voucher codes that can be redeemed for Wi-Fi access.
CREATE TABLE vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_mac VARCHAR(17), -- Stores MAC address in XX:XX:XX:XX:XX:XX format
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_recipient VARCHAR(15) -- Stores phone number for SMS delivery
);

-- Create an index on the voucher code for faster lookups
CREATE INDEX idx_vouchers_code ON vouchers(code);

-- This table stores records of payments made through IntaSend.
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in KES (Kenyan Shillings)
  currency VARCHAR(3) DEFAULT 'KES' NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'Completed', 'Pending', 'Refunded', 'Failed'
  mac_address VARCHAR(17), -- Stores the MAC address of the user who made the payment
  plan_name VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'IntaSend' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  voucher_id INTEGER REFERENCES vouchers(id) -- Optional: link to a generated voucher
);

-- Create an index on the transaction ID for faster lookups
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- This table stores user sessions for tracking active connections
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  mac VARCHAR(17) NOT NULL,
  plan VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expiry_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'Active' NOT NULL, -- 'Active', 'Expired', 'Blocked'
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for user sessions
CREATE INDEX idx_user_sessions_mac ON user_sessions(mac);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_user_sessions_expiry ON user_sessions(expiry_time);

-- This table stores admin users for dashboard access
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- This table stores admin OTP codes for email-based authentication
CREATE TABLE admin_otps (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL, -- Store plain OTP for verification
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  request_ip VARCHAR(45), -- IPv4 or IPv6
  attempts INTEGER DEFAULT 0 NOT NULL
);

-- Create indexes for admin OTPs
CREATE INDEX idx_admin_otps_admin_id ON admin_otps(admin_id);
CREATE INDEX idx_admin_otps_expires_at ON admin_otps(expires_at);

-- This table stores admin sessions for dashboard access
CREATE TABLE admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  client_ip VARCHAR(45),
  user_agent TEXT
);

-- Create indexes for admin sessions
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- This table stores audit logs for admin actions
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Optional: Pre-populate with a sample voucher
INSERT INTO vouchers (code, duration_minutes) VALUES ('WIFLY-FREE-2024', 60);
