import express from 'express';
import { storageService } from '../services/storageService.js';

const router = express.Router();

// POST /api/reset
router.post('/reset', (req, res) => {
  try {
    const result = storageService.reset();
    const summary = storageService.getStateSummary();
    res.json({
      success: true,
      result,
      summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
