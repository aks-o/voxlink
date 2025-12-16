import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { healthRouter } from './routes/health';
import { aiAgentsRouter } from './routes/ai-agents';
import { voiceWorkflowsRouter } from './routes/voice-workflows';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
}));

// Routes
app.use('/health', healthRouter);
app.use('/ai-agents', aiAgentsRouter);
app.use('/voice-workflows', voiceWorkflowsRouter);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist',
      path: req.originalUrl,
      method: req.method,
    },
  });
});

// Error handling
app.use(errorHandler);

const PORT = config.port || 3006;

app.listen(PORT, () => {
  logger.info(`AI Agent Service running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;