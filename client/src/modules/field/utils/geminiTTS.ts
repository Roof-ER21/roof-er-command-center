// TTS Utilities using Browser Speech Synthesis (Fallback for Gemini TTS)

export async function initGeminiTTS() {
  // Check if speech synthesis is ready
  if (window.speechSynthesis.getVoices().length === 0) {
    return new Promise<void>((resolve) => {
      window.speechSynthesis.onvoiceschanged = () => resolve();
    });
  }
}

export async function agnesVoiceSpeak(
  text: string, 
  lang: string, 
  callbacks?: { onEnd?: () => void; onError?: (e: any) => void }
) {
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Select best voice
  const voices = window.speechSynthesis.getVoices();
  const langCode = getLangCode(lang);
  
  // Try to find a voice matching the language
  const voice = voices.find(v => v.lang.startsWith(langCode));
  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (callbacks?.onEnd) {
    utterance.onend = callbacks.onEnd;
  }
  if (callbacks?.onError) {
    utterance.onerror = callbacks.onError;
  }

  window.speechSynthesis.speak(utterance);
}

export function agnesVoiceStop() {
  window.speechSynthesis.cancel();
}

export async function cleanupGeminiTTS() {
  window.speechSynthesis.cancel();
}

function getLangCode(shortCode: string): string {
   const map: Record<string, string> = {
    'en': 'en',
    'es': 'es',
    'ar': 'ar',
    'vi': 'vi',
    'ko': 'ko',
    'zh': 'zh',
    'tl': 'fil' // Tagalog usually maps to Filipino
  };
  return map[shortCode] || shortCode;
}
