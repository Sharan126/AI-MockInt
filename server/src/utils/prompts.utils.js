export const parseGeminiJSON = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input provided to parseGeminiJSON');
  }

  try {
    let cleanText = text.trim();

    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '');
      cleanText = cleanText.replace(/\n?```\s*$/, '');
    }

    return JSON.parse(cleanText.trim());
  } catch (error) {
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        // Fall through to error log
      }
    }

    console.error('Failed to parse Gemini JSON response:', error.message);
    console.error('Raw text was:', text);
    throw new Error('Failed to parse AI response. The AI returned an unexpected format.');
  }
};