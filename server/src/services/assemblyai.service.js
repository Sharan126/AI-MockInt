import { AssemblyAI } from 'assemblyai';

export const transcribeAudioBuffer = async (buffer) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY is not configured in .env');
  }

  const client = new AssemblyAI({ apiKey });
  const transcript = await client.transcripts.transcribe({
    audio: buffer,
  });

  return transcript.text || '';
};

export default { transcribeAudioBuffer };
