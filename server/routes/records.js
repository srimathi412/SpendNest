import express from 'express';
import { storageService } from '../services/storageService.js';

const router = express.Router();

// GET /api/records
router.get('/records', (req, res) => {
  try {
    const records = storageService.getRecords();
    const summary = storageService.getStateSummary();
    const overrides = storageService.getOverrides();

    res.json({
      success: true,
      summary,
      appliedBatches: summary.appliedBatches,
      overrides,
      records
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/records/:sourceType/:sourceId
router.get('/records/:sourceType/:sourceId', (req, res) => {
  const { sourceType, sourceId } = req.params;
  const record = storageService.getRecord(sourceType, sourceId);
  if (!record) {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }
  res.json({ success: true, record });
});

export default router;
