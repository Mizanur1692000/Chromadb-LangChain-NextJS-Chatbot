// vectorStore.js
require('dotenv').config();
const { ChromaClient } = require('chromadb');
const { getEmbeddings } = require('./gemini');
const path = require('path');

// ChromaDB client configuration
// For local development, you need to run ChromaDB server separately
// Or use in-memory mode (data won't persist between restarts)
const client = new ChromaClient({
  path: "http://localhost:8000" // This connects to a local ChromaDB server
});

const COLLECTION_NAME = 'pdf_collection';

// Chroma embedding function using Gemini
const embeddingFunction = {
  generate: async (texts) => {
    return await getEmbeddings(texts);
  }
};

/**
 * Get or create the Chroma collection
 */
async function getCollection() {
  const collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    embeddingFunction,
  });
  return collection;
}

/**
 * Upsert an array of docs into Chroma
 * @param {Array<{id:string,text:string,metadata:any}>} docs
 */
async function upsertDocuments(docs) {
  if (!Array.isArray(docs) || docs.length === 0) return;

  const texts = docs.map(d => d.text);
  const embeddings = await getEmbeddings(texts);
  const collection = await getCollection();

  const ids = docs.map(d => d.id);
  
  // ChromaDB requires non-empty metadata or none at all
  const metadatas = docs.map((d, index) => ({
    source: d.metadata?.source || 'pdf',
    chunk_index: index,
    ...(d.metadata || {})
  }));

  await collection.add({ ids, documents: texts, metadatas, embeddings });
}

/**
 * Retrieve top K docs from Chroma by a question embedding
 * @param {number[]} questionEmbedding
 * @param {number} topK
 */
async function retrieve(questionEmbedding, topK = 3) {
  const collection = await getCollection();
  const results = await collection.query({
    queryEmbeddings: [questionEmbedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances'],
  });

  const docs = (results.documents?.[0] || []).map((doc, i) => ({
    text: doc,
    metadata: results.metadatas?.[0]?.[i] || {},
    distance: results.distances?.[0]?.[i],
  }));

  return docs;
}

/**
 * Clear the entire collection
 */
async function clearCollection() {
  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
    console.log('Collection deleted');
    // Recreate empty collection
    await getCollection();
    console.log('New empty collection created');
  } catch (err) {
    console.error('Error clearing collection:', err);
    throw err;
  }
}

module.exports = { upsertDocuments, retrieve, clearCollection };