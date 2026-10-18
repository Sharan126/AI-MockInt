import { GoogleGenAI } from "@google/genai";

// Priority order of verified available Gemini models with independent free-tier quotas
const AVAILABLE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
];

const generateContent = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError = null;

  for (const model of AVAILABLE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      lastError = error;
      const isQuotaError =
        error.message?.includes("429") ||
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.message?.includes("quota");

      if (isQuotaError) {
        console.warn(
          `⚠️ Model ${model} quota reached, automatically cascading to next active model...`
        );
      } else {
        console.warn(`⚠️ Model ${model} call failed:`, error.message);
      }
    }
  }

  console.error("All Gemini models in cascade failed:", lastError?.message);
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
};

export { generateContent };