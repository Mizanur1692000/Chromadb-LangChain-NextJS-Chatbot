const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require("@google/generative-ai/server");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);

async function getEmbeddings(texts) {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  // Ensure texts is an array
  const textArray = Array.isArray(texts) ? texts : [texts];

  const result = await model.batchEmbedContents({
    requests: textArray.map(text => ({
      content: { parts: [{ text }], role: 'user' },
    })),
  });
  return result.embeddings.map(e => e.values);
}

async function generateWithContext(question, contexts) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `Based on the following context, answer the question.
Contexts:
${contexts.join('\n---\n')}

Question: ${question}
Answer:`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { getEmbeddings, generateWithContext, fileManager };

