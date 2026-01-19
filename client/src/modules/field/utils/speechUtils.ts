// Speech Recognition Utilities

export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

let recognition: any = null;

export function startListening(
  lang: string,
  onResult: (result: { transcript: string; isFinal: boolean }) => void,
  onError: (error: any) => void,
  options: { continuous?: boolean; interimResults?: boolean } = {}
) {
  if (!isSpeechRecognitionSupported()) return;

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  // Map our language codes to full BCP 47 tags for better recognition
  const langMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-MX',
    'ar': 'ar-SA',
    'vi': 'vi-VN',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'tl': 'fil-PH'
  };

  recognition.lang = langMap[lang] || lang;
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? true;

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript || interimTranscript) {
      onResult({
        transcript: finalTranscript || interimTranscript,
        isFinal: !!finalTranscript
      });
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error', event.error);
    onError(event.error);
  };

  try {
    recognition.start();
  } catch (e) {
    console.error("Failed to start recognition:", e);
  }
}

export function stopListening() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Ignore
    }
  }
}
