/**
 * Agnes the Linguist - Field Translator (Orb Edition)
 * Voice-first, seamless interaction design.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  AgnesState,
} from '../types';
import {
  translateText,
  getLanguageName,
} from '../utils/translationUtils';
import {
  startListening,
  stopListening,
  isSpeechRecognitionSupported,
} from '../utils/speechUtils';
import {
  agnesVoiceSpeak,
  agnesVoiceStop,
  initGeminiTTS,
} from '../utils/geminiTTS';
import {
  getRandomHellos,
} from '../utils/agnesPersona';
import AudioWaveform, { StatusIndicator, AgnesMessage } from './AudioWaveform';
import ConversationTranscript, { TranscriptEntry } from './ConversationTranscript';
import {
  ArrowLeft,
  Settings,
} from 'lucide-react';

interface FieldTranslatorProps {
  onBack: () => void;
}

const FieldTranslator: React.FC<FieldTranslatorProps> = ({ onBack }) => {
  const { user } = useAuth();

  // State
  const [agnesState, setAgnesState] = useState<AgnesState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimText, setInterimText] = useState<string>('');
  const [agnesMessage, setAgnesMessage] = useState<string>('');
  const [activeLanguage, setActiveLanguage] = useState<string>('es'); // Default to Spanish target
  const [detectedLangDisplay, setDetectedLangDisplay] = useState<string>('Auto');

  // Refs
  const sessionActiveRef = useRef<boolean>(false);
  const listenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Initialize TTS
  useEffect(() => {
    initGeminiTTS();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  // Helper: Stop everything
  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
    stopListening();
    agnesVoiceStop();
    if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
    setAgnesState('idle');
    setAgnesMessage('');
    setInterimText('');
    isSpeakingRef.current = false;
  }, []);

  // Helper: Speak
  const speak = useCallback((text: string, lang: string = 'en') => {
    return new Promise<void>((resolve, reject) => {
      if (!sessionActiveRef.current) {
        resolve();
        return;
      }
      isSpeakingRef.current = true;
      setAgnesMessage(text);
      setAgnesState('speaking');
      
      agnesVoiceSpeak(text, lang, {
        onEnd: () => {
          isSpeakingRef.current = false;
          setAgnesMessage('');
          if (sessionActiveRef.current) setAgnesState('listening');
          resolve();
        },
        onError: (e) => {
          isSpeakingRef.current = false;
          setAgnesMessage('');
          reject(e);
        }
      });
    });
  }, []);

  // Helper: Process User Input (The "Brain")
  const processInput = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Check for commands (Simple regex for now, could be LLM powered)
    const lower = text.toLowerCase();
    
    // Command: Stop/Mute
    if (lower.includes('stop') || lower.includes('mute') || lower.includes('pause')) {
      stopSession();
      return;
    }

    // Command: Switch Language
    // "Switch to German", "Ask in French"
    const langMatch = SUPPORTED_LANGUAGES.find(l => 
      lower.includes(l.name.toLowerCase()) || lower.includes(l.nativeName?.toLowerCase() || '')
    );

    if (langMatch && (lower.includes('switch') || lower.includes('change') || lower.includes('speak'))) {
      setActiveLanguage(langMatch.code);
      setDetectedLangDisplay(langMatch.name);
      await speak(`Okay, switching to ${langMatch.name}.`, 'en');
      return;
    }

    // Normal Conversation Flow
    // We assume:
    // 1. If it looks like English, it's the Rep asking to translate TO Target.
    // 2. If it looks like Target, it's Homeowner speaking.
    // NOTE: Browser ASR needs a lang. We default to 'en-US' usually. 
    // To support "Any language", we'd ideally cycle or use 'auto' if supported. 
    // For this demo, we'll assume the browser is set to English but we try to detect intent.
    // OR we default to the activeLanguage if it's not English.
    
    // Simple heuristic: If we are in "Spanish mode", and input is English, translate to Spanish.
    // If input is Spanish (hard to detect if ASR is English), we might get gibberish.
    // *Workaround*: We toggle listening languages or rely on the user to say "Ask him..."
    
    // Let's assume input is English (Rep) for "Ask him..." commands
    if (lower.startsWith("ask him") || lower.startsWith("tell him") || lower.startsWith("ask her") || lower.startsWith("tell her")) {
        // Translate remainder to Target
        const contentToTranslate = text.replace(/^(ask|tell) (him|her|them) /i, "");
        setAgnesState('translating');
        const translation = await translateText(contentToTranslate, activeLanguage);
        
        // Add to transcript
        setTranscript(prev => [...prev, {
            id: Date.now().toString(),
            speaker: 'rep',
            originalText: text,
            originalLang: 'en',
            translatedText: translation,
            translatedLang: activeLanguage,
            timestamp: new Date()
        }]);

        await speak(translation, activeLanguage);
    } else {
        // Assume it's the homeowner speaking in Target Language OR Rep speaking general English
        // Since we can't easily auto-detect lang with standard Web Speech API without toggling,
        // We will treat this as "Rep speaking" -> Translate to Target for now, 
        // unless we add a "Listen in Spanish" toggle or command.
        // IMPROVEMENT: We'll assume everything is English -> Target unless specified.
        
        setAgnesState('translating');
        const translation = await translateText(text, activeLanguage); // English -> Target
        
        // Check if the translation is the same (means it didn't translate well or was already target)
        // For now, just speak it.
        setTranscript(prev => [...prev, {
            id: Date.now().toString(),
            speaker: 'rep',
            originalText: text,
            originalLang: 'en',
            translatedText: translation,
            translatedLang: activeLanguage,
            timestamp: new Date()
        }]);
        
        await speak(translation, activeLanguage);
    }

  }, [activeLanguage, speak, stopSession]);

  // Main Loop
  const startLoop = useCallback(() => {
    if (!sessionActiveRef.current) return;

    setAgnesState('listening');
    
    // Default to English listening for commands/rep
    // Ideally we'd alternate or use a more advanced ASR
    startListening(
        'en', 
        async (result) => {
            setInterimText(result.transcript);
            if (result.isFinal) {
                setInterimText('');
                stopListening(); // Stop briefly to process
                await processInput(result.transcript);
                if (sessionActiveRef.current && !isSpeakingRef.current) {
                    startLoop(); // Restart loop
                }
            }
        },
        (err) => {
            // If error or no speech, restart loop
            if (sessionActiveRef.current && !isSpeakingRef.current) {
                setTimeout(startLoop, 1000); 
            }
        }
    );

  }, [processInput]);

  // Activation Handler
  const handleOrbClick = useCallback(async () => {
    if (agnesState !== 'idle') {
      // Deactivate
      stopSession();
      return;
    }

    // Activate
    sessionActiveRef.current = true;
    setAgnesState('activating');
    setTranscript([]);

    // 1. Play 5 Random Hellos
    const hellos = getRandomHellos();
    for (const hello of hellos) {
        if (!sessionActiveRef.current) return;
        setAgnesMessage(`${hello.text}`);
        await new Promise<void>(resolve => {
            agnesVoiceSpeak(hello.text, hello.lang, { onEnd: () => resolve() });
        });
        await new Promise(r => setTimeout(r, 200)); // gap
    }
    setAgnesMessage('');

    // 2. Waiting for instructions
    if (!sessionActiveRef.current) return;
    setAgnesState('listening');
    await speak("I'm ready. I'll translate to Spanish by default, or just tell me which language to use.", 'en');

    // 3. Start Listening Loop
    startLoop();

  }, [agnesState, stopSession, speak, startLoop]);


  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${agnesState !== 'idle' ? 'opacity-20' : 'opacity-0'}`}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-white/80" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{detectedLangDisplay}</span>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Settings className="w-6 h-6 text-white/80" />
        </button>
      </div>

      {/* Main Orb Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        
        {/* The Orb */}
        <button 
            onClick={handleOrbClick}
            className={`relative group transition-all duration-500 ${agnesState !== 'idle' ? 'scale-110' : 'scale-100 hover:scale-105'}`}
        >
            {/* Core */}
            <div className={`w-40 h-40 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 shadow-[0_0_60px_rgba(6,182,212,0.6)] flex items-center justify-center transition-all duration-300 ${agnesState === 'listening' ? 'animate-pulse' : ''}`}>
                {/* Inner Glow */}
                <div className="w-36 h-36 rounded-full bg-black/20 blur-sm" />
            </div>
            
            {/* Rings */}
            {agnesState !== 'idle' && (
                <>
                    <div className="absolute inset-0 -m-4 rounded-full border border-cyan-500/30 animate-[spin_4s_linear_infinite]" />
                    <div className="absolute inset-0 -m-8 rounded-full border border-blue-500/20 animate-[spin_7s_linear_infinite_reverse]" />
                </>
            )}
        </button>

        {/* Status Text */}
        <div className="mt-12 text-center h-24">
            {agnesState === 'idle' ? (
                <p className="text-white/50 text-lg font-light tracking-wide">Tap to Activate</p>
            ) : (
                <div className="space-y-2">
                    <p className="text-cyan-400 text-xl font-medium animate-pulse">
                        {agnesMessage || (agnesState === 'listening' ? "Listening..." : "Processing...")}
                    </p>
                    {interimText && (
                        <p className="text-white/60 text-sm max-w-md mx-auto px-4 italic">
                            "{interimText}"
                        </p>
                    )}
                </div>
            )}
        </div>

      </div>

      {/* Transcript / Waveform */}
      <div className="h-1/3 bg-white/5 backdrop-blur-lg border-t border-white/10 z-10 flex flex-col">
        <div className="p-4 border-b border-white/5">
            <AudioWaveform isActive={agnesState === 'speaking' || agnesState === 'listening'} status={agnesState} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
            <ConversationTranscript entries={transcript} onSpeak={() => {}} />
        </div>
      </div>

    </div>
  );
};

export default FieldTranslator;