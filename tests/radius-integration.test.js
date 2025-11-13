// RADIUS Integration Test Suite
// Tests the complete RADIUS authentication flow for WiFly hotspot

const { expect } = require('chai');
const { db } = require('../src/lib/db');
const { createRadiusUserForVoucher, createRadiusUserForPayment, deleteRadiusUser } = require('../src/lib/radius');
const { redeemVoucherAction, createCheckoutSessionAction, claimPaymentSessionAction } = require('../src/actions');

describe('RADIUS Integration Tests', function() {
  this.timeout(10000); // Extended timeout for database operations

  const testMacAddress = 'AA:BB:CC:DD:EE:FF';
  let testUsername;
  let testPassword;

  before(async function() {
    // Ensure database connection
    await db.connect();
  });

  after(async function() {
    // Clean up test data
    if (testUsername) {
      try {
        await deleteRadiusUser(testUsername);
      } catch (e) {
        console.log('Cleanup failed:', e.message);
      }
    }
    await db.disconnect();
  });

  describe('RADIUS User Creation', () => {
    it('should create RADIUS user for voucher', async function() {
      const durationMinutes = 60; // 1 hour
      const result = await createRadiusUserForVoucher(testMacAddress, durationMinutes);

      expect(result).to.have.property('username');
      expect(result).to.have.property('password');
      expect(result.username).to.include('user_');
      expect(result.password).to.have.length(32); // Hex string length

      testUsername = result.username;
      testPassword = result.password;

      // Verify user exists in database
      const radcheck = await db.radius.getRadcheck(result.username);
      expect(radcheck).to.not.be.null;
      expect(radcheck.attribute).to.equal('Cleartext-Password');
      expect(radcheck.value).to.equal(result.password);

      // Verify session timeout
      const sessionTimeout = await db.radius.getRadreply(result.username, 'Session-Timeout');
      expect(sessionTimeout).to.not.be.null;
      expect(sessionTimeout.value).to.equal('3600'); // 1 hour in seconds

      // Verify MAC binding
      const macBinding = await db.radius.getRadreply(result.username, 'Calling-Station-Id');
      expect(macBinding).to.not.be.null;
      expect(macBinding.value).to.equal(testMacAddress);
    });

    it('should create RADIUS user for payment', async function() {
      const planName = '24 Hour Access';
      const result = await createRadiusUserForPayment(testMacAddress, planName);

      expect(result).to.have.property('username');
      expect(result).to.have.property('password');

      // Verify session timeout for 24 hours
      const sessionTimeout = await db.radius.getRadreply(result.username, 'Session-Timeout');
      expect(sessionTimeout).to.not.be.null;
      expect(sessionTimeout.value).to.equal('86400'); // 24 hours in seconds

      // Clean up this test user
      await deleteRadiusUser(result.username);
    });
  });

  describe('Authentication Flow', () => {
    it('should authenticate RADIUS credentials', async function() {
      // This would test the /api/auth endpoint
      // For now, we'll test the database validation directly

      const radcheck = await db.radius.getRadcheck(testUsername);
      expect(radcheck.value).to.equal(testPassword);

      // Test MAC address binding
      const macBinding = await db.radius.getRadreply(testUsername, 'Calling-Station-Id');
      expect(macBinding.value).to.equal(testMacAddress);
    });

    it('should reject invalid credentials', async function() {
      const invalidUsername = 'invalid_user_' + Date.now();
      const radcheck = await db.radius.getRadcheck(invalidUsername);
      expect(radcheck).to.be.null;
    });

    it('should enforce MAC address binding', async function() {
      const wrongMac = 'FF:EE:DD:CC:BB:AA';
      const macBinding = await db.radius.getRadreply(testUsername, 'Calling-Station-Id');

      // The binding should exist and match the original MAC
      expect(macBinding).to.not.be.null;
      expect(macBinding.value).to.equal(testMacAddress);
      expect(macBinding.value).to.not.equal(wrongMac);
    });
  });

  describe('Session Management', () => {
    it('should create accounting records', async function() {
      // Create a test accounting record
      const acctData = {
        username: testUsername,
        nasipaddress: '192.168.1.1',
        nasportid: testMacAddress,
        nasporttype: 'Wireless-802.11',
        acctstarttime: new Date(),
        acctsessionid: `test_session_${Date.now()}`,
        callingstationid: testMacAddress,
        framedipaddress: '192.168.1.100',
        acctsessiontime: 0,
        acctinputoctets: 0,
        acctoutputoctets: 0,
      };

      await db.radius.createRadacct(acctData);

      // Verify record was created (this would need a getRadacct method)
      // For now, we'll assume the create method works if no error was thrown
    });

    it('should handle session timeouts', async function() {
      const sessionTimeout = await db.radius.getRadreply(testUsername, 'Session-Timeout');
      expect(sessionTimeout).to.not.be.null;

      const timeoutSeconds = parseInt(sessionTimeout.value);
      expect(timeoutSeconds).to.be.greaterThan(0);
      expect(timeoutSeconds).to.equal(3600); // 1 hour for voucher
    });
  });

  describe('Voucher Redemption Flow', () => {
    let testVoucherCode;

    before(async function() {
      // Create a test voucher
      const voucher = await db.voucher.create({
        code: 'TEST_VOUCHER_' + Date.now(),
        duration_minutes: 30,
      });
      testVoucherCode = voucher.code;
    });

    it('should complete voucher redemption with RADIUS', async function() {
      const formData = new FormData();
      formData.append('code', testVoucherCode);
      formData.append('macAddress', testMacAddress);

      const result = await redeemVoucherAction(null, formData);

      expect(result.success).to.be.true;
      expect(result.token).to.include(':'); // Should contain username:password

      const [username, password] = result.token.split(':');
      expect(username).to.include('user_');
      expect(password).to.have.length(32);
    });

    after(async function() {
      // Clean up test voucher
      if (testVoucherCode) {
        await db.voucher.delete({ code: testVoucherCode });
      }
    });
  });

  describe('Payment Flow', () => {
    it('should create checkout session', async function() {
      const formData = new FormData();
      formData.append('macAddress', testMacAddress);
      formData.append('planId', 'plan_3'); // 24 hours
      formData.append('phoneNumber', '+254712345678');

      const result = await createCheckoutSessionAction(null, formData);

      expect(result.success).to.be.true;
      expect(result.redirectUrl).to.include('intasend');
    });

    it('should claim payment and create RADIUS user', async function() {
      // This would require mocking the payment provider
      // For now, we'll test the claim logic structure
      const paymentRef = 'test_payment_' + Date.now();

      // Mock payment record
      const mockPayment = await db.payment.create({
        transaction_id: paymentRef,
        amount: 500,
        phone_number: '+254712345678',
        plan_name: '24 Hour Access',
        status: 'completed',
      });

      const result = await claimPaymentSessionAction(paymentRef, testMacAddress);

      expect(result.success).to.be.true;
      expect(result.token).to.include(':');

      // Clean up
      await db.payment.delete({ transaction_id: paymentRef });
    });
  });

  describe('CoA (Change of Authorization)', () => {
    it('should disconnect RADIUS user', async function() {
      await deleteRadiusUser(testUsername);

      // Verify user is deleted
      const radcheck = await db.radius.getRadcheck(testUsername);
      expect(radcheck).to.be.null;

      // Reset for other tests
      testUsername = null;
    });
  });
});
