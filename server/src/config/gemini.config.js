import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-3.8-flash";

const generateContent = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
};

export { generateContent };