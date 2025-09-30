const fs = require('fs');
const pdfParse = require('pdf-parse');

async function loadPdf(filePath) {
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  // basic cleanup and removal of non-printable characters
  const text = (data.text || '').replace(/\s+/g, ' ').trim();
  return text.replace(/[\x00-\x1F\x7F-\x9F\uE000-\uF8FF]/g, "");
}

module.exports = { loadPdf };
