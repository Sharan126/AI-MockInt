// ============================================
// murf.service.js - Murf AI Text-to-Speech Service
// ============================================
// Generates realistic voice audio using Murf AI API.
// ============================================

export const generateAudio = async (text) => {
  const apiKey = process.env.MURF_API_KEY;
  if (!apiKey) {
    console.warn('MURF_API_KEY is not defined in .env');
    return null;
  }

  try {
    const response = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        voiceId: 'en-US-natalie',
        format: 'MP3',
        encodeAsBase64: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Murf API returned status ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.encodedAudio || null;
  } catch (error) {
    console.error('Murf Audio Generation Error:', error.message);
    return null;
  }
};

export default { generateAudio };
