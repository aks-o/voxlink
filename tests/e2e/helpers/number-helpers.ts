import { v4 as uuidv4 } from 'uuid';

export interface TestNumber {
  id: string;
  phoneNumber: string;
  countryCode: string;
  areaCode: string;
  city: string;
  region: string;
  status: 'available' | 'reserved' | 'active' | 'suspended';
  ownerId: string | null;
  monthlyRate: number;
  setupFee: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const createTestNumber = async (ownerId?: string): Promise<TestNumber> => {
  const numberId = uuidv4();
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  const number: TestNumber = {
    id: numberId,
    phoneNumber: `+1555${randomSuffix}`,
    countryCode: 'US',
    areaCode: '555',
    city: 'New York',
    region: 'NY',
    status: ownerId ? 'active' : 'available',
    ownerId: ownerId || null,
    monthlyRate: 10.00,
    setupFee: 5.00,
    features: ['voice', 'sms'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // In a real implementation, this would create the number in the database
  // For tests, we'll simulate database creation
  if (global.__POSTGRES_CLIENT__) {
    try {
      await global.__POSTGRES_CLIENT__.query(
        `INSERT INTO virtual_numbers (id, phone_number, country_code, area_code, city, region, status, owner_id, monthly_rate, setup_fee, features, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          number.id,
          number.phoneNumber,
          number.countryCode,
          number.areaCode,
          number.city,
          number.region,
          number.status,
          number.ownerId,
          number.monthlyRate,
          number.setupFee,
          JSON.stringify(number.features),
          number.createdAt,
          number.updatedAt,
        ]
      );
    } catch (error) {
      // Table might not exist in test environment, continue anyway
      console.warn('Could not insert test number into database:', error);
    }
  }

  return number;
};

export const createAvailableNumbers = async (count: number = 10): Promise<TestNumber[]> => {
  const numbers: TestNumber[] = [];
  
  for (let i = 0; i < count; i++) {
    const number = await createTestNumber();
    numbers.push(number);
  }
  
  return numbers;
};

export const createNumberWithConfiguration = async (ownerId: string) => {
  const number = await createTestNumber(ownerId);
  
  const configuration = {
    id: uuidv4(),
    numberId: number.id,
    callForwarding: {
      enabled: true,
      primaryDestination: '+1234567890',
      timeout: 30,
    },
    businessHours: {
      timezone: 'America/New_York',
      schedule: {
        monday: { open: '09:00', close: '17:00', enabled: true },
        tuesday: { open: '09:00', close: '17:00', enabled: true },
        wednesday: { open: '09:00', close: '17:00', enabled: true },
        thursday: { open: '09:00', close: '17:00', enabled: true },
        friday: { open: '09:00', close: '17:00', enabled: true },
        saturday: { open: '10:00', close: '14:00', enabled: false },
        sunday: { open: '10:00', close: '14:00', enabled: false },
      },
    },
    voicemail: {
      enabled: true,
      greeting: 'default',
      emailNotifications: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Simulate creating configuration in database
  if (global.__POSTGRES_CLIENT__) {
    try {
      await global.__POSTGRES_CLIENT__.query(
        `INSERT INTO number_configurations (id, number_id, call_forwarding, business_hours, voicemail, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          configuration.id,
          configuration.numberId,
          JSON.stringify(configuration.callForwarding),
          JSON.stringify(configuration.businessHours),
          JSON.stringify(configuration.voicemail),
          configuration.createdAt,
          configuration.updatedAt,
        ]
      );
    } catch (error) {
      console.warn('Could not insert test configuration into database:', error);
    }
  }

  return { number, configuration };
};

export const generatePhoneNumber = (countryCode: string = 'US', areaCode?: string): string => {
  switch (countryCode) {
    case 'US':
      const area = areaCode || '555';
      const exchange = Math.floor(Math.random() * 900 + 100);
      const subscriber = Math.floor(Math.random() * 9000 + 1000);
      return `+1${area}${exchange}${subscriber}`;
    
    case 'CA':
      const caArea = areaCode || '416';
      const caExchange = Math.floor(Math.random() * 900 + 100);
      const caSubscriber = Math.floor(Math.random() * 9000 + 1000);
      return `+1${caArea}${caExchange}${caSubscriber}`;
    
    case 'UK':
      const ukNumber = Math.floor(Math.random() * 100000000 + 10000000);
      return `+4420${ukNumber}`;
    
    default:
      return `+1555${Math.floor(Math.random() * 10000000 + 1000000)}`;
  }
};