import express from 'express';
import { storageService } from '../services/storageService.js';
import { config } from '../config.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const summary = storageService.getStateSummary();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    storage: {
      mode: config.nodeEnv === 'production' ? 'hybrid-ephemeral-resilient' : 'local-file-backed',
      ...summary
    }
  });
});

export default router;
