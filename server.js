const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname);
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');

app.use(express.json({ limit: '1mb' }));

// Serve static files from project root
app.use(express.static(ROOT));

// Simple CORS headers for development (adjust for production)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Endpoint to write accounts.json via PUT
app.put('/accounts.json', (req, res) => {
  const payload = req.body;
  if (!Array.isArray(payload) && typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to write accounts.json:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}/`);
  console.log('PUT /accounts.json will write to', ACCOUNTS_FILE);
});
