# Telecom Provider Integration

This directory contains the real telecom provider integrations that replace the mock implementations with actual API connections to major telecommunications providers.

## 🌐 Supported Providers

### Primary Providers
- **Twilio** - Global communications platform with extensive API coverage
- **Bandwidth** - North American focused provider with competitive pricing

### Planned Providers
- **Vonage** - Global provider with strong international coverage
- **Plivo** - Developer-friendly platform with good pricing
- **Telnyx** - Modern carrier with global reach

## 🏗️ Architecture

### Provider Manager
The `TelecomProviderManager` orchestrates multiple providers with:
- **Automatic failover** when providers are unavailable
- **Circuit breaker pattern** to prevent cascading failures
- **Health monitoring** with periodic checks
- **Load balancing** based on provider priority and health
- **Caching** to reduce API calls and improve performance

### Base Provider
All providers extend `BaseTelecomProvider` which provides:
- **Common request/response handling**
- **Error handling and retry logic**
- **Metrics collection and monitoring**
- **Health check implementations**
- **Phone number formatting utilities**

## 🔧 Configuration

### Environment Variables

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ENABLED=true

# Bandwidth Configuration
BANDWIDTH_USERNAME=your_username
BANDWIDTH_PASSWORD=your_password
BANDWIDTH_ACCOUNT_ID=your_account_id
BANDWIDTH_SITE_ID=your_site_id
BANDWIDTH_PEER_ID=your_peer_id
BANDWIDTH_ENABLED=true

# Failover Configuration
PROVIDER_MAX_RETRIES=3
PROVIDER_RETRY_DELAY=1000
PROVIDER_HEALTH_CHECK_INTERVAL=60000
PROVIDER_CIRCUIT_BREAKER_TIMEOUT=300000
```

### Provider Priority
Providers are selected based on:
1. **Health status** - Only healthy providers are considered
2. **Feature support** - Provider must support the requested feature
3. **Region support** - Provider must support the target region
4. **Priority ranking** - Lower numbers have higher priority

## 📋 Features

### Number Search
```typescript
const searchRequest: NumberSearchRequest = {
  countryCode: 'US',
  areaCode: '212',
  city: 'New York',
  pattern: '*1234',
  features: ['voice', 'sms'],
  limit: 20,
  maxMonthlyRate: 1000, // $10.00 in cents
};

const results = await providerManager.searchNumbers(searchRequest);
```

### Number Reservation
```typescript
const reservationRequest: NumberReservationRequest = {
  phoneNumber: '+12125551234',
  providerId: 'twilio',
  reservationDuration: 10, // minutes
  customerInfo: {
    name: 'John Doe',
    email: 'john@example.com',
  },
};

const reservation = await providerManager.reserveNumber(reservationRequest);
```

### Number Purchase
```typescript
const purchaseRequest: NumberPurchaseRequest = {
  phoneNumber: '+12125551234',
  providerId: 'twilio',
  reservationId: 'res_123',
  customerInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
  },
};

const purchase = await providerManager.purchaseNumber(purchaseRequest);
```

### Number Porting
```typescript
const portingRequest: PortingRequest = {
  phoneNumber: '+12125551234',
  currentProvider: 'Verizon',
  accountNumber: '123456789',
  pin: '1234',
  authorizedName: 'John Doe',
  serviceAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
};

const porting = await providerManager.portNumber(portingRequest);
```

## 🔄 Failover Mechanism

### Circuit Breaker Pattern
- **Closed State**: Normal operation, requests pass through
- **Open State**: Provider is failing, requests are blocked
- **Half-Open State**: Testing if provider has recovered

### Failover Logic
1. **Primary Provider**: First attempt with highest priority provider
2. **Secondary Provider**: Fallback to next available provider
3. **Circuit Breaker**: Skip providers with open circuit breakers
4. **Health Check**: Only use providers that pass health checks

### Recovery
- **Automatic Recovery**: Circuit breakers reset after timeout
- **Health Monitoring**: Continuous monitoring of provider status
- **Gradual Recovery**: Slowly increase traffic to recovered providers

## 📊 Monitoring & Metrics

### Provider Metrics
```typescript
const metrics = providerManager.getProviderMetrics();
// Returns:
// {
//   twilio: {
//     totalRequests: 1250,
//     successfulRequests: 1200,
//     failedRequests: 50,
//     averageResponseTime: 245,
//     errorRate: 4.0,
//     uptime: 96.0
//   }
// }
```

### Health Status
```typescript
const health = providerManager.getProviderHealth();
// Returns:
// {
//   twilio: {
//     healthy: true,
//     status: 'healthy',
//     uptime: 99.5
//   }
// }
```

## 🧪 Testing

### Unit Tests
```bash
npm test -- --testPathPattern=telecom-provider
```

### Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Provider-Specific Tests
```bash
npm test -- --testPathPattern=twilio-provider
npm test -- --testPathPattern=bandwidth-provider
```

## 🔐 Security

### API Credentials
- **Environment Variables**: Store credentials securely
- **Encryption**: Encrypt sensitive data at rest
- **Rotation**: Regular credential rotation
- **Least Privilege**: Minimal required permissions

### Request Security
- **HTTPS Only**: All API calls use HTTPS
- **Authentication**: Proper API authentication
- **Rate Limiting**: Respect provider rate limits
- **Input Validation**: Validate all input data

## 🚨 Error Handling

### Error Types
- **Network Errors**: Connection timeouts, DNS failures
- **Authentication Errors**: Invalid credentials, expired tokens
- **Rate Limiting**: API quota exceeded
- **Validation Errors**: Invalid request parameters
- **Provider Errors**: Provider-specific error codes

### Error Recovery
- **Retry Logic**: Exponential backoff for retryable errors
- **Fallback Providers**: Automatic failover to backup providers
- **Circuit Breakers**: Prevent cascading failures
- **Graceful Degradation**: Maintain service with reduced functionality

## 📈 Performance Optimization

### Caching Strategy
- **Search Results**: Cache number search results (5 minutes)
- **Availability Checks**: Cache availability status (1 minute)
- **Provider Health**: Cache health status (30 seconds)

### Request Optimization
- **Connection Pooling**: Reuse HTTP connections
- **Request Batching**: Combine multiple requests when possible
- **Parallel Processing**: Execute independent requests concurrently
- **Timeout Management**: Appropriate timeouts for different operations

## 🔧 Adding New Providers

### 1. Create Provider Class
```typescript
export class NewProvider extends BaseTelecomProvider {
  async searchNumbers(request: NumberSearchRequest): Promise<NumberSearchResponse> {
    // Implementation
  }
  
  async reserveNumber(request: NumberReservationRequest): Promise<NumberReservationResponse> {
    // Implementation
  }
  
  // ... other required methods
}
```

### 2. Update Provider Manager
```typescript
// In TelecomProviderManager constructor
case 'newprovider':
  provider = new NewProvider(providerConfig);
  break;
```

### 3. Add Configuration
```typescript
// In config/config.ts
newprovider: {
  apiKey: process.env.NEWPROVIDER_API_KEY || '',
  apiSecret: process.env.NEWPROVIDER_API_SECRET || '',
  enabled: process.env.NEWPROVIDER_ENABLED === 'true',
},
```

### 4. Add Tests
```typescript
describe('NewProvider', () => {
  // Provider-specific tests
});
```

## 🐛 Troubleshooting

### Common Issues

**Provider Authentication Failures**
- Verify API credentials are correct
- Check if credentials have expired
- Ensure proper permissions are granted

**High Error Rates**
- Check provider status pages
- Verify network connectivity
- Review rate limiting settings

**Circuit Breaker Issues**
- Check provider health metrics
- Verify circuit breaker thresholds
- Review error patterns and timing

**Performance Issues**
- Monitor response times
- Check cache hit rates
- Review concurrent request limits

### Debug Tools
```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Check provider status
const status = telecomService.getProviderStatus();
console.log('Provider Status:', status);

// Test specific provider
const result = await providerManager.checkNumberAvailability('+12125551234');
console.log('Availability:', result);
```

## 📚 Provider Documentation

### Twilio
- [API Documentation](https://www.twilio.com/docs/phone-numbers)
- [Available Phone Numbers API](https://www.twilio.com/docs/phone-numbers/api/availablephonenumber-resource)
- [Incoming Phone Numbers API](https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource)

### Bandwidth
- [API Documentation](https://dev.bandwidth.com/docs/numbers/)
- [Available Numbers API](https://dev.bandwidth.com/docs/numbers/availableNumbers/)
- [Phone Number Ordering](https://dev.bandwidth.com/docs/numbers/phoneNumberOrdering/)

## 🔄 Migration from Mock

### Steps to Enable Real Providers
1. **Configure Credentials**: Add provider API credentials to environment
2. **Enable Providers**: Set `PROVIDER_ENABLED=true` for desired providers
3. **Test Integration**: Run integration tests to verify connectivity
4. **Monitor Performance**: Watch metrics and error rates
5. **Gradual Rollout**: Start with test traffic before full deployment

### Backward Compatibility
- **Graceful Fallback**: Falls back to mock if all providers fail
- **Feature Flags**: Can disable real providers and use mock
- **Testing Mode**: Mock providers available for testing

## 📋 Best Practices

### Development
- **Test with Real APIs**: Use sandbox/test environments
- **Mock for Unit Tests**: Use mocks for fast unit testing
- **Integration Testing**: Test with real provider APIs
- **Error Simulation**: Test error conditions and recovery

### Production
- **Monitor Continuously**: Track provider health and performance
- **Set Alerts**: Alert on high error rates or downtime
- **Regular Testing**: Periodic health checks and functionality tests
- **Capacity Planning**: Monitor usage and plan for growth

### Security
- **Credential Management**: Secure storage and rotation
- **Network Security**: Use VPNs or private networks when possible
- **Audit Logging**: Log all provider interactions
- **Compliance**: Ensure compliance with telecom regulations