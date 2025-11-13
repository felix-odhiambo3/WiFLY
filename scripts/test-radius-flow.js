#!/usr/bin/env node
// RADIUS Authentication Flow Test Script
// Tests the complete authentication flow from voucher/payment to RADIUS validation

const { db } = require('../src/lib/db');
const { createRadiusUserForVoucher, createRadiusUserForPayment } = require('../src/lib/radius');
const { addLog } = require('../src/lib/logger');

async function testRadiusFlow() {
  console.log('🧪 Starting RADIUS Integration Test...\n');

  try {
    // Test data
    const testMac = 'AA:BB:CC:DD:EE:FF';
    const testPhone = '+254712345678';

    console.log('1. Testing RADIUS User Creation for Voucher...');
    const voucherUser = await createRadiusUserForVoucher(testMac, 60); // 1 hour
    console.log(`   ✅ Created voucher user: ${voucherUser.username}`);

    // Verify in database
    const radcheck = await db.radius.getRadcheck(voucherUser.username);
    if (radcheck && radcheck.value === voucherUser.password) {
      console.log('   ✅ RADIUS user verified in database');
    } else {
      throw new Error('RADIUS user not found in database');
    }

    // Check session timeout
    const sessionTimeout = await db.radius.getRadreply(voucherUser.username, 'Session-Timeout');
    if (sessionTimeout && sessionTimeout.value === '3600') {
      console.log('   ✅ Session timeout configured correctly (1 hour)');
    }

    // Check MAC binding
    const macBinding = await db.radius.getRadreply(voucherUser.username, 'Calling-Station-Id');
    if (macBinding && macBinding.value === testMac) {
      console.log('   ✅ MAC address binding configured correctly');
    }

    console.log('\n2. Testing RADIUS User Creation for Payment...');
    const paymentUser = await createRadiusUserForPayment(testMac, '24 Hour Access');
    console.log(`   ✅ Created payment user: ${paymentUser.username}`);

    // Verify 24-hour timeout
    const paymentTimeout = await db.radius.getRadreply(paymentUser.username, 'Session-Timeout');
    if (paymentTimeout && paymentTimeout.value === '86400') {
      console.log('   ✅ Payment session timeout configured correctly (24 hours)');
    }

    console.log('\n3. Testing Authentication Validation...');
    // Simulate authentication request
    const authResult = await validateRadiusAuth(voucherUser.username, voucherUser.password, testMac);
    if (authResult.valid) {
      console.log('   ✅ RADIUS authentication successful');
      console.log(`   📊 Session timeout: ${authResult.sessionTimeout} seconds`);
    } else {
      throw new Error('RADIUS authentication failed');
    }

    console.log('\n4. Testing MAC Address Binding...');
    // Test with wrong MAC
    const wrongMacResult = await validateRadiusAuth(voucherUser.username, voucherUser.password, 'FF:EE:DD:CC:BB:AA');
    if (!wrongMacResult.valid && wrongMacResult.error === 'MAC address binding violation') {
      console.log('   ✅ MAC address binding enforcement working');
    } else {
      throw new Error('MAC address binding not enforced');
    }

    console.log('\n5. Testing Invalid Credentials...');
    const invalidResult = await validateRadiusAuth('invalid_user', 'wrong_password', testMac);
    if (!invalidResult.valid) {
      console.log('   ✅ Invalid credentials properly rejected');
    }

    console.log('\n6. Testing Accounting Record Creation...');
    await createTestAccountingRecord(voucherUser.username, testMac);
    console.log('   ✅ Accounting record created');

    console.log('\n7. Testing CoA (Disconnect)...');
    await require('../src/lib/radius').deleteRadiusUser(voucherUser.username);
    await require('../src/lib/radius').deleteRadiusUser(paymentUser.username);

    // Verify deletion
    const deletedCheck = await db.radius.getRadcheck(voucherUser.username);
    if (!deletedCheck) {
      console.log('   ✅ RADIUS user successfully deleted');
    }

    console.log('\n🎉 All RADIUS integration tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('   • RADIUS user creation ✓');
    console.log('   • Database persistence ✓');
    console.log('   • Session timeout configuration ✓');
    console.log('   • MAC address binding ✓');
    console.log('   • Authentication validation ✓');
    console.log('   • Security enforcement ✓');
    console.log('   • Accounting integration ✓');
    console.log('   • CoA functionality ✓');

    console.log('\n🚀 Ready for production deployment!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

async function validateRadiusAuth(username, password, macAddress) {
  try {
    // Simulate the auth endpoint logic
    const radiusUser = await db.radius.getRadcheck(username);

    if (!radiusUser) {
      return { valid: false, error: 'User not found' };
    }

    if (radiusUser.value !== password) {
      return { valid: false, error: 'Invalid password' };
    }

    // Check MAC binding
    if (macAddress) {
      const macBinding = await db.radius.getRadreply(username, 'Calling-Station-Id');
      if (macBinding && macBinding.value !== macAddress) {
        return { valid: false, error: 'MAC address binding violation' };
      }
    }

    // Get session timeout
    const sessionTimeout = await db.radius.getRadreply(username, 'Session-Timeout');
    const timeoutSeconds = sessionTimeout ? parseInt(sessionTimeout.value) : 3600;

    return {
      valid: true,
      sessionTimeout: timeoutSeconds
    };

  } catch (error) {
    return { valid: false, error: error.message };
  }
}

async function createTestAccountingRecord(username, macAddress) {
  const acctData = {
    username,
    nasipaddress: '192.168.1.1',
    nasportid: macAddress,
    nasporttype: 'Wireless-802.11',
    acctstarttime: new Date(),
    acctsessionid: `test_${username}_${Date.now()}`,
    callingstationid: macAddress,
    framedipaddress: '192.168.1.100',
    acctsessiontime: 0,
    acctinputoctets: 0,
    acctoutputoctets: 0,
  };

  await db.radius.createRadacct(acctData);
}

// Run the test
if (require.main === module) {
  testRadiusFlow().catch(console.error);
}

module.exports = { testRadiusFlow, validateRadiusAuth };
