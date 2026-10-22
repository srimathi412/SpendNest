import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { ingestEnvelope, validateEnvelope, countUsableTranscripts } from './replayEngine.js';

/**
 * StorageService
 * Manages in-memory state and disk persistence strategy.
 * 
 * PERSISTENCE STRATEGY DOCUMENTATION:
 * - Local Development: Changes are written to `server/data/store.json`. State survives server restarts.
 * - Production (e.g. Render Free Tier): Render Web Services use ephemeral disks where file writes
 *   are lost upon instance redeployments or container restarts.
 *   To guarantee reliability:
 *     1. StorageService initializes state in-memory on boot.
 *     2. If `store.json` exists and is readable, it rehydrates from disk.
 *     3. Otherwise, it automatically seeds state from `01_initial.json` (44 records, Revision 1).
 *     4. Write failures to ephemeral disk are logged safely without crashing the running process.
 *     5. For durable multi-instance enterprise production, an external database (PostgreSQL, Supabase)
 *        can be plugged into this service interface.
 */
export class StorageService {
  constructor() {
    this.recordsMap = new Map(); // key -> { raw, revision }
    this.overridesMap = {};      // key -> { manualRoute, reviewStatus, notes, updatedAt }
    this.appliedBatches = [];    // array of batch IDs applied
    this.ingestionHistory = [];  // audit history of ingestion results
    this.persistenceFile = config.persistenceFilePath;
    this.initialDataFile = config.initialDataPath;
    this.updateDataFile = config.updateDataPath;

    this.init();
  }

  init() {
    // 1. Try to load from store.json if available
    let loadedFromDisk = false;
    if (fs.existsSync(this.persistenceFile)) {
      try {
        const raw = fs.readFileSync(this.persistenceFile, 'utf8');
        const data = JSON.parse(raw);
        if (data.records && Array.isArray(data.records) && data.records.length > 0) {
          data.records.forEach(entry => {
            const key = `${entry.raw.source_type}:${entry.raw.source_id}`;
            this.recordsMap.set(key, entry);
          });
          this.overridesMap = data.overrides || {};
          this.appliedBatches = data.appliedBatches || ['initial-001'];
          this.ingestionHistory = data.ingestionHistory || [];
          loadedFromDisk = true;
          console.log(`[StorageService] Rehydrated ${this.recordsMap.size} records and ${Object.keys(this.overridesMap).length} overrides from disk.`);
        }
      } catch (err) {
        console.warn('[StorageService] Could not parse existing store.json, falling back to seed initial data:', err.message);
      }
    }

    // 2. If not loaded from disk, seed from 01_initial.json
    if (!loadedFromDisk) {
      this.seedInitial();
    }
  }

  seedInitial() {
    this.recordsMap.clear();
    this.overridesMap = {};
    this.appliedBatches = [];
    this.ingestionHistory = [];

    if (!fs.existsSync(this.initialDataFile)) {
      throw new Error(`Initial data file not found at: ${this.initialDataFile}`);
    }

    const raw = fs.readFileSync(this.initialDataFile, 'utf8');
    const envelope = JSON.parse(raw);
    const validation = validateEnvelope(envelope);
    if (!validation.isValid) {
      throw new Error(`Invalid initial envelope: ${validation.error}`);
    }

    const { updatedStore, result } = ingestEnvelope(new Map(), validation.envelope);
    this.recordsMap = updatedStore;
    this.appliedBatches = [validation.envelope.batch_id];
    this.ingestionHistory = [result];

    this.persistToDisk();
    console.log(`[StorageService] Seeded initial batch: ${result.totalRecordsAfter} records, ${result.usableTranscriptsAfter} transcripts.`);
  }

  persistToDisk() {
    try {
      const recordsArray = Array.from(this.recordsMap.values());
      const payload = {
        savedAt: new Date().toISOString(),
        appliedBatches: this.appliedBatches,
        overrides: this.overridesMap,
        records: recordsArray,
        ingestionHistory: this.ingestionHistory
      };
      
      const dir = path.dirname(this.persistenceFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.persistenceFile, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      // In ephemeral environments (like containerized Render), log warning without throwing
      console.warn('[StorageService] Disk write skipped or failed (ephemeral storage):', err.message);
    }
  }

  getRecords() {
    return Array.from(this.recordsMap.values());
  }

  getRecord(sourceType, sourceId) {
    const key = `${sourceType}:${sourceId}`;
    return this.recordsMap.get(key) || null;
  }

  getOverrides() {
    return { ...this.overridesMap };
  }

  saveOverride(sourceType, sourceId, manualRoute, notes = '', reviewStatus = 'Action Required') {
    const key = `${sourceType}:${sourceId}`;
    const entry = {
      sourceType,
      sourceId,
      manualRoute,
      reviewStatus,
      notes,
      updatedAt: new Date().toISOString()
    };

    this.overridesMap[key] = entry;
    this.overridesMap[sourceId] = entry;

    // Special alias preservation for M07 as per contract
    if (sourceId === '4f304fff-fd40-5cfc-a366-0a134c445c2a' || sourceType === 'M07') {
      this.overridesMap['M07'] = entry;
      this.overridesMap['meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a'] = entry;
    }

    this.persistToDisk();
    return entry;
  }

  clearOverride(sourceType, sourceId) {
    const key = `${sourceType}:${sourceId}`;
    delete this.overridesMap[key];
    delete this.overridesMap[sourceId];
    if (sourceId === '4f304fff-fd40-5cfc-a366-0a134c445c2a' || sourceType === 'M07') {
      delete this.overridesMap['M07'];
      delete this.overridesMap['meeting:4f304fff-fd40-5cfc-a366-0a134c445c2a'];
    }
    this.persistToDisk();
    return true;
  }

  ingest(envelope) {
    const validation = validateEnvelope(envelope);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const { updatedStore, result } = ingestEnvelope(this.recordsMap, validation.envelope);
    this.recordsMap = updatedStore;

    if (!this.appliedBatches.includes(validation.envelope.batch_id)) {
      this.appliedBatches.push(validation.envelope.batch_id);
    }

    this.ingestionHistory.unshift(result);
    this.persistToDisk();

    return result;
  }

  reset() {
    this.seedInitial();
    return {
      success: true,
      message: 'State successfully reset to 01_initial.json. Manual overrides cleared.'
    };
  }

  getStateSummary() {
    return {
      totalRecords: this.recordsMap.size,
      usableTranscripts: countUsableTranscripts(this.recordsMap),
      appliedBatches: [...this.appliedBatches],
      totalOverrides: Object.keys(this.overridesMap).length,
      lastIngestion: this.ingestionHistory[0] || null
    };
  }
}

export const storageService = new StorageService();
