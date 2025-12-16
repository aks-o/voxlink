#!/usr/bin/env node

// VoxLink Development Data Seeding Script
// This script populates the development database with sample data

const { Client } = require('pg');
const Redis = require('ioredis');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'voxlink_dev',
  user: 'voxlink',
  password: 'voxlink_dev_password'
};

const billingDbConfig = {
  host: 'localhost',
  port: 5434,
  database: 'voxlink_billing',
  user: 'voxlink',
  password: 'voxlink_billing_password'
};

async function seedDatabase() {
  console.log('🌱 Seeding development data...');
  
  const client = new Client(dbConfig);
  const billingClient = new Client(billingDbConfig);
  const redis = new Redis('redis://localhost:6379');

  try {
    await client.connect();
    await billingClient.connect();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    
    // Clear Redis cache
    await redis.flushall();
    
    // Sample users
    console.log('👥 Creating sample users...');
    const users = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'admin@voxlink.com',
        name: 'VoxLink Admin',
        role: 'admin'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        email: 'demo@business.com',
        name: 'Demo Business User',
        role: 'user'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'test@startup.com',
        name: 'Test Startup',
        role: 'user'
      }
    ];

    // Sample virtual numbers
    console.log('📞 Creating sample virtual numbers...');
    const virtualNumbers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        phone_number: '+1-555-0101',
        country_code: 'US',
        area_code: '555',
        city: 'New York',
        region: 'NY',
        status: 'active',
        owner_id: users[1].id,
        monthly_rate: 15.00,
        setup_fee: 5.00
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        phone_number: '+1-555-0102',
        country_code: 'US',
        area_code: '555',
        city: 'Los Angeles',
        region: 'CA',
        status: 'active',
        owner_id: users[1].id,
        monthly_rate: 15.00,
        setup_fee: 5.00
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        phone_number: '+1-555-0103',
        country_code: 'US',
        area_code: '555',
        city: 'Chicago',
        region: 'IL',
        status: 'active',
        owner_id: users[2].id,
        monthly_rate: 15.00,
        setup_fee: 5.00
      }
    ];

    // Sample number configurations
    console.log('⚙️ Creating sample configurations...');
    const configurations = [
      {
        id: '550e8400-e29b-41d4-a716-446655440201',
        number_id: virtualNumbers[0].id,
        call_forwarding_enabled: true,
        primary_destination: '+1-555-1001',
        business_hours_enabled: true,
        timezone: 'America/New_York'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440202',
        number_id: virtualNumbers[1].id,
        call_forwarding_enabled: true,
        primary_destination: '+1-555-1002',
        business_hours_enabled: true,
        timezone: 'America/Los_Angeles'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440203',
        number_id: virtualNumbers[2].id,
        call_forwarding_enabled: true,
        primary_destination: '+1-555-1003',
        business_hours_enabled: false,
        timezone: 'America/Chicago'
      }
    ];

    // Sample usage records
    console.log('📊 Creating sample usage records...');
    const usageRecords = [];
    const eventTypes = ['inbound_call', 'outbound_call', 'sms_received', 'sms_sent'];
    
    for (let i = 0; i < 50; i++) {
      const randomNumber = virtualNumbers[Math.floor(Math.random() * virtualNumbers.length)];
      const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
      
      usageRecords.push({
        id: `550e8400-e29b-41d4-a716-44665544${String(i + 300).padStart(4, '0')}`,
        number_id: randomNumber.id,
        event_type: randomEventType,
        duration: randomEventType.includes('call') ? Math.floor(Math.random() * 600) : null,
        cost: Math.random() * 2,
        timestamp: randomDate,
        metadata: JSON.stringify({
          from: randomEventType.includes('inbound') ? '+1-555-9999' : randomNumber.phone_number,
          to: randomEventType.includes('inbound') ? randomNumber.phone_number : '+1-555-9999'
        })
      });
    }

    // Cache some sample data in Redis
    console.log('💾 Caching sample data in Redis...');
    await redis.set('available_numbers:US:555', JSON.stringify([
      { number: '+1-555-0201', city: 'Boston', monthly_rate: 15.00 },
      { number: '+1-555-0202', city: 'Miami', monthly_rate: 15.00 },
      { number: '+1-555-0203', city: 'Seattle', monthly_rate: 15.00 },
      { number: '+1-555-0204', city: 'Denver', monthly_rate: 15.00 },
      { number: '+1-555-0205', city: 'Phoenix', monthly_rate: 15.00 }
    ]), 'EX', 3600);

    // Set some session data
    await redis.set('session:demo_user', JSON.stringify({
      userId: users[1].id,
      email: users[1].email,
      name: users[1].name,
      role: users[1].role,
      loginTime: new Date().toISOString()
    }), 'EX', 86400);

    console.log('✅ Development data seeded successfully!');
    console.log('');
    console.log('📋 Sample Data Created:');
    console.log(`   • ${users.length} users`);
    console.log(`   • ${virtualNumbers.length} virtual numbers`);
    console.log(`   • ${configurations.length} configurations`);
    console.log(`   • ${usageRecords.length} usage records`);
    console.log('');
    console.log('🔑 Sample Login Credentials:');
    console.log('   • Admin: admin@voxlink.com');
    console.log('   • Demo User: demo@business.com');
    console.log('   • Test User: test@startup.com');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
    await billingClient.end();
    await redis.disconnect();
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };