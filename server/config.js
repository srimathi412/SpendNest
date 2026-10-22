import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Standard allowed CORS origins including Vercel production and local dev
const defaultAllowedOrigins = [
  'https://app-eight-tan-46.vercel.app',
  'https://app-62spwvkq2-srimathi412s-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173'
];

// Append any custom origins provided via environment variable
const customOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [...new Set([...defaultAllowedOrigins, ...customOrigins])];

export const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  allowedOrigins: ALLOWED_ORIGINS,
  dataPath: path.resolve(__dirname, 'data'),
  initialDataPath: path.resolve(__dirname, 'data/01_initial.json'),
  updateDataPath: path.resolve(__dirname, 'data/02_update.json'),
  persistenceFilePath: path.resolve(__dirname, 'data/store.json')
};
