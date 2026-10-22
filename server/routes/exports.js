import express from 'express';
import { buildManifest, manifestToCSV, generateZipBuffer } from '../services/exportService.js';

const router = express.Router();

// GET /api/exports/manifest.json
router.get('/exports/manifest.json', (req, res) => {
  try {
    const manifest = buildManifest();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="manifest.json"');
    res.json(manifest);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exports/manifest.csv
router.get('/exports/manifest.csv', (req, res) => {
  try {
    const manifest = buildManifest();
    const csv = manifestToCSV(manifest);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="manifest.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/exports/download
router.get('/exports/download', async (req, res) => {
  try {
    const manifest = buildManifest();
    const zipBuffer = await generateZipBuffer(manifest);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="spendnest-exports.zip"');
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
