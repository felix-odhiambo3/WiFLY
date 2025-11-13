# WiFly Phase 1: FreeRADIUS Integration Implementation Plan

## Overview
Implement enterprise-grade Wi-Fi access control by replacing JWT-based authentication with FreeRADIUS-based session management. This phase establishes the foundation for secure, scalable hotspot operations with MAC address binding, time-based sessions, and dynamic session control via CoA (Change of Authorization).

## Current State
- ✅ Basic captive portal with JWT tokens
- ✅ IntaSend payment integration
- ✅ Africa's Talking SMS vouchers
- ✅ Mock database with basic user sessions

## Phase 1 Goals
- [ ] Replace JWT authentication with RADIUS authentication
- [ ] Implement MAC address binding for security
- [ ] Add time-based session management
- [ ] Enable CoA for dynamic session control
- [ ] Set up PostgreSQL RADIUS backend
- [ ] Configure OpenWrt FreeRADIUS integration

## Implementation Tasks

### 1. Database Schema Updates
- [x] Create RADIUS tables (radcheck, radreply, radacct, etc.)
- [x] Add RADIUS mock functions to db.ts
- [x] Update schema.sql with RADIUS tables

### 2. RADIUS Client Library
- [x] Create src/lib/radius.ts with user management functions
- [x] Implement createRadiusUserForVoucher()
- [x] Implement createRadiusUserForPayment()
- [x] Add session extension and deletion functions
- [x] Implement CoA disconnect functionality

### 3. OpenWrt FreeRADIUS Setup
- [x] Create installation script (openwrt/freeradius-install.sh)
- [x] Configure main radiusd.conf
- [x] Set up clients.conf for router authentication
- [x] Configure PostgreSQL backend (mods-available/sql)
- [x] Set up authentication/authorization flow (sites-available/default)

### 4. Backend Integration
- [ ] Update src/app/actions.ts to use RADIUS instead of JWT
- [ ] Modify voucher redemption to create RADIUS users
- [ ] Update payment flow to create RADIUS users
- [ ] Replace JWT token generation with RADIUS credentials

### 5. Captive Portal Updates
- [ ] Update LoginForm.tsx to collect MAC address
- [ ] Modify authentication flow to use RADIUS
- [ ] Update session status display
- [ ] Add RADIUS credential handling

### 6. Nodogsplash Integration
- [x] Update OpenWrt configuration to use RADIUS
- [x] Configure RADIUS server address and secrets
- [x] Test authentication flow with RADIUS

### 7. Testing & Validation
- [x] Test voucher-based RADIUS authentication
- [x] Test payment-based RADIUS authentication
- [x] Verify MAC address binding
- [x] Test session timeouts
- [x] Validate CoA functionality

## Acceptance Criteria
- [ ] Users authenticate via RADIUS after payment/voucher redemption
- [ ] Sessions are tracked and managed with time-based expiry
- [ ] MAC address binding prevents session hijacking
- [ ] CoA allows dynamic session termination
- [ ] OpenWrt router successfully authenticates against RADIUS
- [ ] All existing functionality preserved (payments, SMS, etc.)

## Next Steps (Phase 2)
- Enhanced payment flow with STK Push
- Admin OTP authentication
- Monitoring stack (Prometheus + Grafana)
- Docker deployment
- Complete API enhancements

## Files Created/Modified
- `src/lib/radius.ts` - RADIUS client library
- `schema-radius.sql` - RADIUS database schema
- `openwrt/freeradius-install.sh` - Installation script
- `openwrt/freeradius-config/radiusd.conf` - Main config
- `openwrt/freeradius-config/clients.conf` - Client definitions
- `openwrt/freeradius-config/mods-available/sql` - PostgreSQL backend
- `openwrt/freeradius-config/sites-available/default` - Auth flow
- `src/lib/db.ts` - Added RADIUS mock functions

## Dependencies
- FreeRADIUS 3.x packages for OpenWrt
- PostgreSQL database
- RADIUS client libraries
- OpenWrt package management

## Security Considerations
- RADIUS shared secrets properly configured
- MAC address binding prevents unauthorized access
- Session timeouts prevent indefinite connections
- CoA enables immediate session termination
- All RADIUS traffic encrypted and authenticated
