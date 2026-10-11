const Groq = require("groq-sdk");
const dotenv = require("dotenv");

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const solveDoubt = async (req, res) => {
  try {
    const { message, messages, title, description, testCases, startCode } = req.body;

    const userMessage = message || messages;

    if (!userMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    let problemContext = "";

    if (title) problemContext += `\nTitle: ${title}`;
    if (description) problemContext += `\n\nDescription:\n${description}`;

    if (testCases && testCases.length > 0) {
      problemContext += `\n\nTest Cases:`;
      testCases.forEach((tc, i) => {
        problemContext += `\n\nExample ${i + 1}:`;
        if (tc.input) problemContext += `\nInput: ${tc.input}`;
        if (tc.output) problemContext += `\nOutput: ${tc.output}`;
        if (tc.explanation) problemContext += `\nExplanation: ${tc.explanation}`;
      });
    }

    if (startCode && startCode.length > 0) {
      problemContext += `\n\nStarter Code:`;
      startCode.forEach((sc) => {
        problemContext += `\n[${sc.language}]\n${sc.initialCode}`;
      });
    }

    const systemPrompt = `You are DSA Mentor, an AI coding assistant for a LeetCode-style platform.

CURRENT PROBLEM:
${problemContext || "No problem context provided."}

YOUR ROLE:
Help the user solve THIS problem. You are a mentor, not a solution-generator.

RESPONSE RULES:
1. If the user's question is unrelated to coding, DSA, or the current problem, respond with exactly:
   "I can only help with coding and the current problem. Please ask something related to DSA."
2. Explain concepts in simple, clear language.
3. Never dump the full solution immediately. Start with hints.
4. When debugging: explain what's wrong, why, and how to fix it.
5. When asked for complexity: give time and space complexity with reasoning.
6. When asked for dry run: show step-by-step execution.
7. Provide full solution ONLY if user explicitly asks for it.
8. Prefer fixing the user's existing approach over suggesting a new one.
9. Always use markdown code blocks with the language name.
10. Keep responses concise and focused.`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(content);
    }

    res.end();
  } catch (error) {
    console.error("Groq Error:", error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get AI response",
      });
    }

    res.end();
  }
};

module.exports = solveDoubt;