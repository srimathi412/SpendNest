import express from 'express';
import fs from 'fs';
import path from 'path';
import { storageService } from '../services/storageService.js';
import { config } from '../config.js';

const router = express.Router();

// POST /api/ingest
router.post('/ingest', (req, res) => {
  try {
    let envelope = req.body;

    // Check if client requested a named file import (e.g. 01_initial.json or 02_update.json)
    if (req.body && req.body.file) {
      const fileName = path.basename(req.body.file);
      const filePath = path.join(config.dataPath, fileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: `Dataset file "${fileName}" not found.` });
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      envelope = JSON.parse(raw);
    }

    if (!envelope || typeof envelope !== 'object') {
      return res.status(400).json({ success: false, error: 'Request body must be a JSON object envelope or contain { file }.' });
    }

    const result = storageService.ingest(envelope);
    const summary = storageService.getStateSummary();

    res.json({
      success: true,
      result,
      summary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message || 'Ingestion failed.'
    });
  }
});

export default router;
