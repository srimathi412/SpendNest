import express from 'express';
import { storageService } from '../services/storageService.js';

const router = express.Router();

// GET /api/overrides
router.get('/overrides', (req, res) => {
  try {
    const overrides = storageService.getOverrides();
    res.json({
      success: true,
      overrides
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/overrides
router.post('/overrides', (req, res) => {
  try {
    const { sourceType, sourceId, manualRoute, notes, reviewStatus } = req.body;

    if (!sourceType || !sourceId || !manualRoute) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceType, sourceId, and manualRoute are required.'
      });
    }

    const entry = storageService.saveOverride(
      sourceType,
      sourceId,
      manualRoute,
      notes || '',
      reviewStatus || 'Action Required'
    );

    res.json({
      success: true,
      entry,
      overrides: storageService.getOverrides()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/overrides/:sourceType/:sourceId
router.delete('/overrides/:sourceType/:sourceId', (req, res) => {
  try {
    const { sourceType, sourceId } = req.params;
    storageService.clearOverride(sourceType, sourceId);
    res.json({
      success: true,
      message: `Override cleared for ${sourceType}:${sourceId}`,
      overrides: storageService.getOverrides()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
