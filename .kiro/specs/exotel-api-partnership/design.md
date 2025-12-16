# Exotel API Partnership Integration Design

## Overview

This design document outlines the technical architecture and implementation approach for integrating Exotel's API services into the VoxLink platform. The integration will enhance VoxLink's capabilities in the Indian market while maintaining the platform's existing functionality and performance standards.

## Architecture

### High-Level System Architecture

The integration follows a microservices architecture pattern with the following key components:

1. **Exotel Integration Service** - Dedicated service for Exotel API interactions
2. **Enhanced Provider Management** - Multi-provider routing and management layer
3. **Regional Routing Engine** - Geographic-based call routing
4. **Webhook Management System** - Real-time event processing
5. **Analytics Enhancement** - Combined reporting across providers

### Integration Patterns

#### 1. Provider Abstraction Pattern
```typescript
interface TelecomProvider {
  name: string;
  region: string[];
  capabilities: ProviderCapabilities;
  makeCall(params: CallParams): Promise<CallResponse>;
  sendSMS(params: SMSParams): Promise<SMSResponse>;
  provisionNumber(criteria: NumberCriteria): Promise<VirtualNumber>;
}

class ExotelProvider implements TelecomProvider {
  // Exotel-specific implementation
}
```

#### 2. Circuit Breaker Pattern
```typescript
class ExotelCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## Components and Interfaces

### 1. Exotel Integration Service

#### Core Service Structure
```typescript
@Injectable()
export class ExotelIntegrationService {
  constructor(
    private httpClient: HttpClient,
    private configService: ConfigService,
    private circuitBreaker: ExotelCircuitBreaker,
    private webhookProcessor: WebhookProcessor
  ) {}

  // Voice Services
  async initiateCall(params: CallInitiationParams): Promise<CallResponse> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.httpClient.post('/calls', {
        from: params.from,
        to: params.to,
        url: params.callbackUrl,
        method: 'POST'
      });
      return this.transformCallResponse(response.data);
    });
  }

  // SMS Services
  async sendSMS(params: SMSParams): Promise<SMSResponse> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.httpClient.post('/sms', {
        from: params.from,
        to: params.to,
        body: params.message
      });
      return this.transformSMSResponse(response.data);
    });
  }

  // Number Provisioning
  async searchAvailableNumbers(criteria: NumberSearchCriteria): Promise<AvailableNumber[]> {
    const response = await this.httpClient.get('/available-numbers', {
      params: {
        country: criteria.country,
        area_code: criteria.areaCode,
        type: criteria.numberType
      }
    });
    return response.data.map(this.transformNumber);
  }
}
```

#### API Client Configuration
```typescript
interface ExotelConfig {
  baseUrl: string;
  accountSid: string;
  authToken: string;
  apiVersion: string;
  timeout: number;
  retryAttempts: number;
  rateLimits: {
    callsPerSecond: number;
    smsPerSecond: number;
  };
}

@Configuration()
export class ExotelConfiguration {
  @Value('${exotel.baseUrl}')
  baseUrl: string;

  @Value('${exotel.accountSid}')
  accountSid: string;

  @Value('${exotel.authToken}')
  authToken: string;

  createHttpClient(): HttpClient {
    return new HttpClient({
      baseURL: this.baseUrl,
      timeout: 30000,
      auth: {
        username: this.accountSid,
        password: this.authToken
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VoxLink/1.0'
      }
    });
  }
}
```

### 2. Provider Management Layer

#### Provider Router
```typescript
@Injectable()
export class ProviderRouter {
  constructor(
    private providers: Map<string, TelecomProvider>,
    private routingRules: RoutingRulesEngine,
    private qualityMonitor: QualityMonitor
  ) {}

  async routeCall(destination: string, preferences: RoutingPreferences): Promise<TelecomProvider> {
    const eligibleProviders = this.getEligibleProviders(destination);
    const qualityScores = await this.qualityMonitor.getProviderScores(eligibleProviders);
    
    return this.routingRules.selectOptimalProvider({
      providers: eligibleProviders,
      qualityScores,
      preferences,
      destination
    });
  }

  private getEligibleProviders(destination: string): TelecomProvider[] {
    const country = this.extractCountryCode(destination);
    return Array.from(this.providers.values())
      .filter(provider => provider.supportsDestination(country));
  }
}
```

#### Routing Rules Engine
```typescript
interface RoutingRule {
  priority: number;
  condition: (context: RoutingContext) => boolean;
  action: (context: RoutingContext) => ProviderSelection;
}

@Injectable()
export class RoutingRulesEngine {
  private rules: RoutingRule[] = [
    {
      priority: 1,
      condition: (ctx) => ctx.destination.startsWith('+91'),
      action: (ctx) => this.selectIndianProvider(ctx)
    },
    {
      priority: 2,
      condition: (ctx) => ctx.preferences.costOptimized,
      action: (ctx) => this.selectCostOptimalProvider(ctx)
    },
    {
      priority: 3,
      condition: (ctx) => ctx.preferences.qualityFirst,
      action: (ctx) => this.selectHighestQualityProvider(ctx)
    }
  ];

  selectOptimalProvider(context: RoutingContext): TelecomProvider {
    const applicableRules = this.rules
      .filter(rule => rule.condition(context))
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      const selection = rule.action(context);
      if (selection.provider) {
        return selection.provider;
      }
    }

    return this.getDefaultProvider(context);
  }
}
```

### 3. Webhook Management System

#### Webhook Processor
```typescript
@Injectable()
export class ExotelWebhookProcessor {
  constructor(
    private signatureValidator: WebhookSignatureValidator,
    private eventHandlers: Map<string, WebhookEventHandler>
  ) {}

  async processWebhook(payload: any, signature: string): Promise<void> {
    // Validate webhook signature
    if (!this.signatureValidator.validate(payload, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = this.parseWebhookEvent(payload);
    const handler = this.eventHandlers.get(event.type);

    if (!handler) {
      console.warn(`No handler found for event type: ${event.type}`);
      return;
    }

    await handler.handle(event);
  }

  private parseWebhookEvent(payload: any): WebhookEvent {
    return {
      type: payload.EventType,
      callSid: payload.CallSid,
      status: payload.CallStatus,
      duration: payload.CallDuration,
      timestamp: new Date(payload.Timestamp),
      data: payload
    };
  }
}
```

#### Event Handlers
```typescript
@Injectable()
export class CallStatusWebhookHandler implements WebhookEventHandler {
  constructor(
    private callRecordService: CallRecordService,
    private billingService: BillingService,
    private notificationService: NotificationService
  ) {}

  async handle(event: WebhookEvent): Promise<void> {
    switch (event.status) {
      case 'completed':
        await this.handleCallCompleted(event);
        break;
      case 'failed':
        await this.handleCallFailed(event);
        break;
      case 'busy':
        await this.handleCallBusy(event);
        break;
    }
  }

  private async handleCallCompleted(event: WebhookEvent): Promise<void> {
    // Update call record
    await this.callRecordService.updateCallStatus(event.callSid, {
      status: 'completed',
      duration: event.duration,
      endTime: event.timestamp
    });

    // Process billing
    await this.billingService.recordUsage({
      callSid: event.callSid,
      duration: event.duration,
      provider: 'exotel',
      cost: this.calculateCost(event.duration)
    });

    // Send notification
    await this.notificationService.sendCallCompletedNotification(event.callSid);
  }
}
```

## Data Models

### 1. Call Records
```typescript
interface CallRecord {
  id: string;
  externalCallId: string; // Exotel Call SID
  from: string;
  to: string;
  status: CallStatus;
  direction: 'inbound' | 'outbound';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  provider: string;
  cost?: number;
  qualityScore?: number;
  recordingUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BUSY = 'busy',
  NO_ANSWER = 'no-answer'
}
```

### 2. Virtual Numbers
```typescript
interface VirtualNumber {
  id: string;
  phoneNumber: string;
  country: string;
  region: string;
  provider: string;
  externalNumberId: string; // Exotel Number ID
  capabilities: NumberCapabilities;
  configuration: NumberConfiguration;
  status: NumberStatus;
  monthlyRental: number;
  purchaseDate: Date;
  expiryDate?: Date;
  customerId: string;
  metadata: Record<string, any>;
}

interface NumberCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
  fax: boolean;
}

interface NumberConfiguration {
  forwardingRules: ForwardingRule[];
  voicemailEnabled: boolean;
  recordingEnabled: boolean;
  smsWebhookUrl?: string;
  voiceWebhookUrl?: string;
}
```

### 3. SMS Records
```typescript
interface SMSRecord {
  id: string;
  externalMessageId: string; // Exotel Message SID
  from: string;
  to: string;
  message: string;
  direction: 'inbound' | 'outbound';
  status: SMSStatus;
  provider: string;
  cost?: number;
  segments: number;
  sentAt: Date;
  deliveredAt?: Date;
  metadata: Record<string, any>;
}

enum SMSStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  UNDELIVERED = 'undelivered'
}
```

## Error Handling

### 1. Error Classification
```typescript
enum ExotelErrorType {
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  INVALID_REQUEST = 'invalid_request',
  NETWORK_ERROR = 'network_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  INSUFFICIENT_BALANCE = 'insufficient_balance'
}

class ExotelError extends Error {
  constructor(
    public type: ExotelErrorType,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ExotelError';
  }
}
```

### 2. Retry Strategy
```typescript
@Injectable()
export class ExotelRetryStrategy {
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorClassifier: (error: any) => boolean = this.isRetryableError
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!errorClassifier(error) || attempt === this.maxRetries) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof ExotelError) {
      return [
        ExotelErrorType.RATE_LIMIT_ERROR,
        ExotelErrorType.NETWORK_ERROR,
        ExotelErrorType.SERVICE_UNAVAILABLE
      ].includes(error.type);
    }
    return false;
  }

  private calculateDelay(attempt: number): number {
    return this.baseDelay * Math.pow(2, attempt); // Exponential backoff
  }
}
```

## Testing Strategy

### 1. Unit Testing
```typescript
describe('ExotelIntegrationService', () => {
  let service: ExotelIntegrationService;
  let httpClient: jest.Mocked<HttpClient>;
  let circuitBreaker: jest.Mocked<ExotelCircuitBreaker>;

  beforeEach(() => {
    const module = Test.createTestingModule({
      providers: [
        ExotelIntegrationService,
        { provide: HttpClient, useValue: createMockHttpClient() },
        { provide: ExotelCircuitBreaker, useValue: createMockCircuitBreaker() }
      ]
    }).compile();

    service = module.get<ExotelIntegrationService>(ExotelIntegrationService);
    httpClient = module.get(HttpClient);
    circuitBreaker = module.get(ExotelCircuitBreaker);
  });

  describe('initiateCall', () => {
    it('should successfully initiate a call', async () => {
      const mockResponse = { CallSid: 'test-call-id', Status: 'initiated' };
      httpClient.post.mockResolvedValue({ data: mockResponse });

      const result = await service.initiateCall({
        from: '+911234567890',
        to: '+919876543210',
        callbackUrl: 'https://voxlink.com/webhook'
      });

      expect(result.callId).toBe('test-call-id');
      expect(result.status).toBe('initiated');
    });

    it('should handle API errors gracefully', async () => {
      const error = new ExotelError(
        ExotelErrorType.AUTHENTICATION_ERROR,
        '20003',
        'Authentication failed'
      );
      httpClient.post.mockRejectedValue(error);

      await expect(service.initiateCall({
        from: '+911234567890',
        to: '+919876543210',
        callbackUrl: 'https://voxlink.com/webhook'
      })).rejects.toThrow(ExotelError);
    });
  });
});
```

### 2. Integration Testing
```typescript
describe('Exotel Integration Tests', () => {
  let app: INestApplication;
  let exotelService: ExotelIntegrationService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ExotelModule.forTest()]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    exotelService = app.get<ExotelIntegrationService>(ExotelIntegrationService);
  });

  it('should handle webhook events correctly', async () => {
    const webhookPayload = {
      EventType: 'CallCompleted',
      CallSid: 'test-call-id',
      CallStatus: 'completed',
      CallDuration: '120',
      Timestamp: new Date().toISOString()
    };

    const response = await request(app.getHttpServer())
      .post('/webhooks/exotel')
      .send(webhookPayload)
      .expect(200);

    // Verify call record was updated
    const callRecord = await exotelService.getCallRecord('test-call-id');
    expect(callRecord.status).toBe('completed');
    expect(callRecord.duration).toBe(120);
  });
});
```

### 3. Contract Testing
```typescript
describe('Exotel API Contract Tests', () => {
  const pact = new Pact({
    consumer: 'VoxLink',
    provider: 'Exotel',
    port: 1234
  });

  beforeAll(() => pact.setup());
  afterAll(() => pact.finalize());

  it('should initiate a call successfully', async () => {
    await pact
      .given('a valid account with sufficient balance')
      .uponReceiving('a call initiation request')
      .withRequest({
        method: 'POST',
        path: '/calls',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': like('Basic dGVzdDp0ZXN0')
        },
        body: {
          from: like('+911234567890'),
          to: like('+919876543210'),
          url: like('https://voxlink.com/webhook')
        }
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          CallSid: like('CA1234567890abcdef'),
          Status: 'initiated'
        }
      });

    const result = await exotelService.initiateCall({
      from: '+911234567890',
      to: '+919876543210',
      callbackUrl: 'https://voxlink.com/webhook'
    });

    expect(result.callId).toBeDefined();
    expect(result.status).toBe('initiated');
  });
});
```

This comprehensive design provides a robust foundation for integrating Exotel's services into the VoxLink platform while maintaining high standards for reliability, performance, and maintainability.