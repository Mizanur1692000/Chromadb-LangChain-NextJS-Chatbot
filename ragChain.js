const { getEmbeddings, generateWithContext } = require('./gemini');
const { retrieve } = require('./vectorStore');

async function answerWithRAG(question) {
  // 1) embed question
  const [qEmb] = await getEmbeddings(question);
  // 2) retrieve top docs
  const docs = await retrieve(qEmb, 4);
  const contexts = docs.map(d => d.text);
  // 3) ask the LLM with contexts
  const answer = await generateWithContext(question, contexts);
  return { answer, sources: docs.map((d,i) => ({ i, distance: d.distance })) };
}

module.exports = { answerWithRAG };
