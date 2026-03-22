import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initializing the app
const app = express();
const port = process.env.PORT || 3033;

// Cache directory setup
const CACHE_DIR = path.join(__dirname, '.cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCachePath(key) {
  const hash = crypto.createHash('md5').update(key).digest('hex');
  return path.join(CACHE_DIR, `${hash}.json`);
}

function getFromCache(key) {
  const cachePath = getCachePath(key);
  if (fs.existsSync(cachePath)) {
    try {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

function saveToCache(key, data) {
  const cachePath = getCachePath(key);
  try {
    fs.writeFileSync(cachePath, JSON.stringify(data));
  } catch (err) {
    console.error("Cache Write Error:", err);
  }
}

// Use the API key from the environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set in the environment.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500; // 1.5s gap between any Gemini calls

async function throttle() {
  const now = Date.now();
  const diff = now - lastRequestTime;
  if (diff < MIN_REQUEST_INTERVAL) {
    const wait = MIN_REQUEST_INTERVAL - diff;
    console.log(`[Staggering] Waiting ${wait}ms to protect API quota...`);
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastRequestTime = Date.now();
}

// Proxy Gemini requests
app.get('/api/gemini/models', async (req, res) => {
  const cacheKey = 'gemini-models';
  const cached = getFromCache(cacheKey);
  if (cached) return res.json(cached);

  await throttle();
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    saveToCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error("Gemini Models Error:", error);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

app.post('/api/gemini/:action', async (req, res) => {
  const { action } = req.params;
  const { model: modelInBody, contents, generationConfig } = req.body;
  const modelName = modelInBody || 'gemini-1.5-flash';

  const cacheKey = JSON.stringify({ modelName, action, contents });
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] ${modelName}/${action}`);
    return res.json(cached);
  }

  await throttle();
  try {
    const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
    
    if (action === 'generateContent') {
      const result = await model.generateContent(contents);
      const response = await result.response;
      const text = response.text();
      const responseBody = {
        candidates: [{
          content: { parts: [{ text }] }
        }]
      };
      saveToCache(cacheKey, responseBody);
      res.json(responseBody);
    } else {
      res.status(400).json({ error: "Unsupported action" });
    }
  } catch (error) {
    console.error("Gemini Backend Error:", error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || "Failed to generate content",
      quotaExceeded: status === 429 || error.message?.includes('429')
    });
  }
});

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Custom 404 for JSON
app.use((req, res) => {
  console.log(`[404 Not Found] ${req.method} ${req.url}`);
  res.status(404).json({ error: `Path Not Found: ${req.url}`, method: req.method });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Fatal Backend Error]", err);
  res.status(500).json({ error: "Interal Server Error", message: err.message });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
