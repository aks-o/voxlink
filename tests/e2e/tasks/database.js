const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/voxlink_test',
    },
  },
});

async function seedTestData() {
  try {
    // Create test users
    await prisma.user.createMany({
      data: [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
        },
        {
          id: '2',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', // password123
        },
      ],
      skipDuplicates: true,
    });

    // Create test virtual numbers
    await prisma.virtualNumber.createMany({
      data: [
        {
          id: 'test-number-1',
          phoneNumber: '+15551234567',
          countryCode: 'US',
          areaCode: '555',
          city: 'Test City',
          state: 'TX',
          status: 'AVAILABLE',
          features: ['SMS', 'VOICE'],
          monthlyPrice: 5.00,
          setupPrice: 0.00,
          provider: 'twilio',
        },
        {
          id: 'test-number-2',
          phoneNumber: '+15551234568',
          countryCode: 'US',
          areaCode: '555',
          city: 'Test City',
          state: 'TX',
          status: 'AVAILABLE',
          features: ['SMS', 'VOICE', 'MMS'],
          monthlyPrice: 7.00,
          setupPrice: 0.00,
          provider: 'bandwidth',
        },
        {
          id: 'test-number-3',
          phoneNumber: '+15551234569',
          countryCode: 'US',
          areaCode: '555',
          city: 'Test City',
          state: 'TX',
          status: 'ACTIVE',
          features: ['SMS', 'VOICE'],
          monthlyPrice: 5.00,
          setupPrice: 0.00,
          provider: 'twilio',
          ownerId: '1',
        },
      ],
      skipDuplicates: true,
    });

    // Create test configurations
    await prisma.numberConfiguration.createMany({
      data: [
        {
          numberId: 'test-number-3',
          forwardingEnabled: false,
          smsEnabled: true,
          voiceEnabled: true,
          recordingEnabled: false,
        },
      ],
      skipDuplicates: true,
    });

    // Create test usage records
    await prisma.usageRecord.createMany({
      data: [
        {
          numberId: 'test-number-3',
          type: 'SMS_OUTBOUND',
          quantity: 10,
          cost: 1.00,
          timestamp: new Date('2023-01-01'),
        },
        {
          numberId: 'test-number-3',
          type: 'VOICE_OUTBOUND',
          quantity: 120, // seconds
          cost: 2.40,
          timestamp: new Date('2023-01-02'),
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Test data seeded successfully');
    return null;
  } catch (error) {
    console.error('❌ Failed to seed test data:', error);
    throw error;
  }
}

async function cleanTestData() {
  try {
    // Clean up in reverse dependency order
    await prisma.usageRecord.deleteMany({
      where: {
        numberId: {
          startsWith: 'test-',
        },
      },
    });

    await prisma.numberConfiguration.deleteMany({
      where: {
        numberId: {
          startsWith: 'test-',
        },
      },
    });

    await prisma.virtualNumber.deleteMany({
      where: {
        id: {
          startsWith: 'test-',
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'admin@example.com'],
        },
      },
    });

    console.log('✅ Test data cleaned successfully');
    return null;
  } catch (error) {
    console.error('❌ Failed to clean test data:', error);
    return null; // Don't throw on cleanup failure
  }
}

async function resetDatabase() {
  try {
    await cleanTestData();
    await seedTestData();
    console.log('✅ Database reset successfully');
    return null;
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    throw error;
  }
}

module.exports = {
  seedTestData,
  cleanTestData,
  resetDatabase,
};