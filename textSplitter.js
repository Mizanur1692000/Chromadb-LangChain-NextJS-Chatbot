const { v4: uuidv4 } = require('uuid');

// Simple chunker: split by roughly chunkSize characters with overlap.
function splitText(text, chunkSize = 1000, overlap = 200, metadata = {}) {
  const chunks = [];
  let start = 0;
  let chunkIndex = 0;
  
  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({ 
        id: uuidv4(), 
        text: chunk, 
        metadata: {
          ...metadata,
          chunk_index: chunkIndex,
          start_pos: start,
          end_pos: end
        }
      });
      chunkIndex++;
    }
    start += chunkSize - overlap;
  }
  return chunks;
}

module.exports = { splitText };