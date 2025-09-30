// server.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const { loadPdf } = require('./pdfLoader');
const { splitText } = require('./textSplitter');
const { upsertDocuments, clearCollection } = require('./vectorStore');
const { answerWithRAG } = require('./ragChain');

// ensure uploads folder exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({ dest: UPLOADS_DIR });
const app = express();

// Enable CORS in development so the frontend can call /upload and /ask easily.
// For production, replace with a tighter origin allowlist.
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}

app.use(express.json());

// Serve static frontend files from ./public
const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  console.warn('Warning: public/ directory not found. Create public/index.html to serve the frontend.');
} else {
  app.use(express.static(PUBLIC_DIR));
  // explicit root route (optional)
  app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
}

/*
  Upload endpoint:
  - field name: "pdf"
  - file saved under uploads/
  - post-upload: parse -> chunk -> embed -> upsert into Chroma via upsertDocuments
*/
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No PDF file uploaded.');

    console.log('Uploaded file:', req.file.path, req.file.originalname);

    // parse PDF -> get text
    const fullText = await loadPdf(req.file.path);

    // split into chunks/docs with metadata
    const docs = splitText(fullText, 1000, 200, {
      filename: req.file.originalname,
      upload_date: new Date().toISOString(),
      source: 'pdf_upload'
    });

    // upsert into Chroma
    await upsertDocuments(docs);

    return res.status(200).json({
      message: 'PDF processed and indexed into Chroma.',
      chunks: docs.length,
      filename: req.file.originalname
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).send('Error processing PDF: ' + (err.message || err));
  }
});

/*
  Ask endpoint:
  - body: { question: "..." }
  - returns: { answer: ... }
*/
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).send('Missing question in body.');

    console.log('Question received:', question);

    const result = await answerWithRAG(question);

    return res.json(result);
  } catch (err) {
    console.error('Ask error:', err);
    return res.status(500).send('Error answering question: ' + (err.message || err));
  }
});

/*
  Clear collection endpoint (for admin):
  - Deletes the entire collection and recreates it
*/
app.post('/clear', async (req, res) => {
  try {
    const { clearCollection } = require('./vectorStore');
    await clearCollection();
    console.log('Collection cleared');
    return res.json({ message: 'Knowledge base cleared successfully' });
  } catch (err) {
    console.error('Clear error:', err);
    return res.status(500).send('Error clearing collection: ' + (err.message || err));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));