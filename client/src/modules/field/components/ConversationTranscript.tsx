import React, { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

export interface TranscriptEntry {
  id: string;
  speaker: 'rep' | 'homeowner' | 'agnes';
  originalText: string;
  originalLang: string;
  translatedText?: string;
  translatedLang?: string;
  timestamp: Date;
}

interface ConversationTranscriptProps {
  entries: TranscriptEntry[];
  onSpeak: (text: string, lang: string) => void;
}

export const TypingIndicator: React.FC<{ speaker: string, text: string }> = ({ speaker, text }) => (
  <div className={`p-3 rounded-lg mb-2 opacity-50 ${speaker === 'rep' ? 'bg-blue-900/20 ml-auto' : 'bg-neutral-800 mr-auto'}`}>
    <p className="text-sm italic">{text}...</p>
  </div>
);

const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({ entries, onSpeak }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div 
          key={entry.id} 
          className={`flex flex-col max-w-[85%] ${entry.speaker === 'rep' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
        >
          <div className={`p-4 rounded-2xl ${
            entry.speaker === 'rep' 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-neutral-800 text-neutral-200 rounded-bl-none'
          }`}>
            <p className="text-sm mb-1 opacity-75 text-xs uppercase tracking-wide">
              {entry.speaker === 'rep' ? 'You' : 'Homeowner'} ({entry.originalLang})
            </p>
            <p className="text-lg font-medium">{entry.originalText}</p>
            
            {entry.translatedText && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm italic text-white/90">{entry.translatedText}</p>
                  <button 
                    onClick={() => onSpeak(entry.translatedText!, entry.translatedLang!)}
                    className="p-1 hover:bg-white/10 rounded-full"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-neutral-500 mt-1">
            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ConversationTranscript;
