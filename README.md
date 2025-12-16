# 🚀 VoxLink - Cloud Communication Platform

## 📋 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Test the system
node scripts/test-provider-setup.js

# 4. Start development
npm run dev
```

## 📁 Project Structure

```
VoxLink/
├── packages/
│   ├── api-gateway/          # API Gateway service
│   ├── billing-service/      # Billing and pricing
│   ├── number-service/       # Virtual number management
│   ├── notification-service/ # Notifications
│   ├── ai-agent-service/     # AI voice agents
│   ├── dashboard/            # React dashboard
│   └── shared/               # Shared types and utilities
├── infrastructure/           # Deployment configs
├── tests/                   # Test suites
├── scripts/                 # Utility scripts
└── .kiro/                   # Kiro IDE specs
```

## 🔧 Key Features

- **Virtual Phone Numbers**: Cloud-based phone numbers for businesses
- **Regional Pricing**: India-optimized pricing (₹199-999/month)
- **Provider Integration**: Airtel, Jio, BSNL, Vi, Twilio support
- **AI Voice Agents**: Automated call handling
- **Real-time Dashboard**: Live metrics and analytics
- **Multi-tenant**: Support for multiple customers

## 📖 Documentation

- **Provider Integration**: See PROVIDER_INTEGRATION_GUIDE.md
- **Action Plan**: See ACTION_PLAN.md for 30-day roadmap
- **Setup Summary**: See SETUP_SUMMARY.md for current status

## 🚀 Deployment

- **Development**: `npm run dev`
- **Production**: See infrastructure/ directory
- **Testing**: `npm test`

## 📞 Support

- **Technical**: Create GitHub issues
- **Business**: Use provider integration guide
- **Documentation**: Check individual package READMEs
