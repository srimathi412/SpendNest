import express from 'express';
import cors from 'cors';
import { config } from './config.js';

import healthRoutes from './routes/health.js';
import recordsRoutes from './routes/records.js';
import ingestRoutes from './routes/ingest.js';
import overridesRoutes from './routes/overrides.js';
import resetRoutes from './routes/reset.js';
import exportsRoutes from './routes/exports.js';

const app = express();

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, node:test, postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or is a vercel preview domain
    const isAllowed = config.allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', healthRoutes);
app.use('/api', recordsRoutes);
app.use('/api', ingestRoutes);
app.use('/api', overridesRoutes);
app.use('/api', resetRoutes);
app.use('/api', exportsRoutes);

// Root greeting / API index
app.get('/', (req, res) => {
  res.json({
    service: 'SpendNest Revenue Intelligence Inbox Backend API',
    version: '1.0.0',
    documentation: 'See README.md and DATA_CONTRACT.md',
    endpoints: {
      health: 'GET /api/health',
      records: 'GET /api/records',
      recordDetail: 'GET /api/records/:sourceType/:sourceId',
      ingest: 'POST /api/ingest',
      overrides: 'GET /api/overrides, POST /api/overrides, DELETE /api/overrides/:sourceType/:sourceId',
      reset: 'POST /api/reset',
      manifestJson: 'GET /api/exports/manifest.json',
      manifestCsv: 'GET /api/exports/manifest.csv',
      zipDownload: 'GET /api/exports/download'
    }
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Only listen if not imported as a module (e.g. for testing)
if (process.env.NODE_ENV !== 'test' && !process.env.NO_LISTEN) {
  app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(` SpendNest Backend API Server listening on port ${config.port}`);
    console.log(` Environment: ${config.nodeEnv}`);
    console.log(` Allowed Origins: ${config.allowedOrigins.join(', ')}`);
    console.log(` Healthcheck: http://localhost:${config.port}/api/health`);
    console.log(`=======================================================`);
  });
}

export default app;
