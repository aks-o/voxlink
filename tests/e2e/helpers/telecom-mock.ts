interface MockTelecomProvider {
  availableNumbers: Map<string, any[]>;
  reservedNumbers: Set<string>;
  activatedNumbers: Set<string>;
  portingRequests: Map<string, any>;
}

class TelecomProviderMock {
  private providers: Map<string, MockTelecomProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize mock providers
    const providers = ['verizon', 'att', 'tmobile', 'sprint'];
    
    providers.forEach(provider => {
      this.providers.set(provider, {
        availableNumbers: new Map(),
        reservedNumbers: new Set(),
        activatedNumbers: new Set(),
        portingRequests: new Map(),
      });
    });

    // Populate with mock available numbers
    this.generateMockNumbers();
  }

  private generateMockNumbers() {
    const areaCodes = ['555', '212', '310', '415', '617', '312'];
    const cities = ['New York', 'Los Angeles', 'San Francisco', 'Boston', 'Chicago'];
    
    this.providers.forEach((provider, providerName) => {
      areaCodes.forEach(areaCode => {
        const numbers = [];
        
        for (let i = 0; i < 50; i++) {
          const exchange = Math.floor(Math.random() * 900 + 100);
          const subscriber = Math.floor(Math.random() * 9000 + 1000);
          const phoneNumber = `+1${areaCode}${exchange}${subscriber}`;
          
          numbers.push({
            id: `${providerName}-${phoneNumber}`,
            phoneNumber,
            countryCode: 'US',
            areaCode,
            city: cities[Math.floor(Math.random() * cities.length)],
            region: 'NY',
            monthlyRate: Math.floor(Math.random() * 20 + 5),
            setupFee: Math.floor(Math.random() * 10 + 1),
            features: ['voice', 'sms', ...(Math.random() > 0.5 ? ['fax'] : [])],
            provider: providerName,
          });
        }
        
        provider.availableNumbers.set(areaCode, numbers);
      });
    });
  }

  searchNumbers(criteria: {
    country?: string;
    areaCode?: string;
    pattern?: string;
    features?: string[];
    priceRange?: { min: number; max: number };
    limit?: number;
  }) {
    const { areaCode, pattern, features, priceRange, limit = 10 } = criteria;
    let allNumbers: any[] = [];

    // Collect numbers from all providers
    this.providers.forEach(provider => {
      if (areaCode && provider.availableNumbers.has(areaCode)) {
        allNumbers.push(...provider.availableNumbers.get(areaCode)!);
      } else if (!areaCode) {
        provider.availableNumbers.forEach(numbers => {
          allNumbers.push(...numbers);
        });
      }
    });

    // Filter by pattern
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '\\d'));
      allNumbers = allNumbers.filter(num => regex.test(num.phoneNumber));
    }

    // Filter by features
    if (features && features.length > 0) {
      allNumbers = allNumbers.filter(num =>
        features.every(feature => num.features.includes(feature))
      );
    }

    // Filter by price range
    if (priceRange) {
      allNumbers = allNumbers.filter(num =>
        num.monthlyRate >= priceRange.min && num.monthlyRate <= priceRange.max
      );
    }

    // Filter out reserved/activated numbers
    allNumbers = allNumbers.filter(num =>
      !this.isNumberReservedOrActivated(num.phoneNumber)
    );

    // Shuffle and limit results
    const shuffled = allNumbers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  reserveNumber(numberId: string, userId: string): { success: boolean; reservationId?: string; error?: string } {
    const number = this.findNumberById(numberId);
    
    if (!number) {
      return { success: false, error: 'Number not found' };
    }

    if (this.isNumberReservedOrActivated(number.phoneNumber)) {
      return { success: false, error: 'Number already reserved or activated' };
    }

    const provider = this.providers.get(number.provider);
    if (provider) {
      provider.reservedNumbers.add(number.phoneNumber);
      
      // Set reservation timeout
      setTimeout(() => {
        provider.reservedNumbers.delete(number.phoneNumber);
      }, 10 * 60 * 1000); // 10 minutes
      
      return {
        success: true,
        reservationId: `res-${numberId}-${Date.now()}`,
      };
    }

    return { success: false, error: 'Provider not available' };
  }

  activateNumber(numberId: string): { success: boolean; error?: string } {
    const number = this.findNumberById(numberId);
    
    if (!number) {
      return { success: false, error: 'Number not found' };
    }

    const provider = this.providers.get(number.provider);
    if (provider) {
      provider.reservedNumbers.delete(number.phoneNumber);
      provider.activatedNumbers.add(number.phoneNumber);
      
      return { success: true };
    }

    return { success: false, error: 'Activation failed' };
  }

  deactivateNumber(numberId: string): { success: boolean; error?: string } {
    const number = this.findNumberById(numberId);
    
    if (!number) {
      return { success: false, error: 'Number not found' };
    }

    const provider = this.providers.get(number.provider);
    if (provider) {
      provider.activatedNumbers.delete(number.phoneNumber);
      
      return { success: true };
    }

    return { success: false, error: 'Deactivation failed' };
  }

  private findNumberById(numberId: string): any | null {
    for (const provider of this.providers.values()) {
      for (const numbers of provider.availableNumbers.values()) {
        const number = numbers.find(n => n.id === numberId);
        if (number) return number;
      }
    }
    return null;
  }

  private isNumberReservedOrActivated(phoneNumber: string): boolean {
    for (const provider of this.providers.values()) {
      if (provider.reservedNumbers.has(phoneNumber) || provider.activatedNumbers.has(phoneNumber)) {
        return true;
      }
    }
    return false;
  }

  reset() {
    this.providers.clear();
    this.initializeProviders();
  }

  // Simulate network delays
  async simulateDelay(min: number = 100, max: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Simulate failures
  simulateFailure(probability: number = 0.1): boolean {
    return Math.random() < probability;
  }
}

export const mockTelecomProvider = new TelecomProviderMock();