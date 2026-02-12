const speech = require('@google-cloud/speech');
const setupGoogleSpeech = (credentialsJson) => {
  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (e) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", e);
    return null;
  }

  const client = new speech.SpeechClient({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });

  return client;
};

const transcribeAudio = async (client, audioBuffer) => {
  if (!client) throw new Error("Google Speech Client not initialized");

  const audioBytes = audioBuffer.toString('base64');

  const audio = {
    content: audioBytes,
  };

  const config = {
    encoding: 'WEBM_OPUS', // Standard for web MediaRecorder
    sampleRateHertz: 48000, // Typical default, but Auto-detect is better if supported or if we don't specify
    languageCode: 'ar-JO',
    alternativeLanguageCodes: ['ar-SA', 'ar-EG'],
    enableAutomaticPunctuation: true,
    model: 'latest_long', // Optimized for longer, continuous speech
    useEnhanced: true,
    maxAlternatives: 5,
  };
  
  // Detect encoding if possible or default to WEBM_OPUS which is standard for web
  // If the browser sends something else, we might need ffmpeg, but Chrome/Edge usually send WEBM.
  
  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);
  
  if (!response.results || response.results.length === 0) {
    return { transcript: "", confidence: 0 };
  }

  // Get best alternative
  const result = response.results
    .map(r => r.alternatives[0])
    .sort((a, b) => b.confidence - a.confidence)[0];

  return {
    transcript: result.transcript,
    confidence: result.confidence,
    alternatives: response.results.flatMap(r => r.alternatives),
  };
};

module.exports = { setupGoogleSpeech, transcribeAudio };
