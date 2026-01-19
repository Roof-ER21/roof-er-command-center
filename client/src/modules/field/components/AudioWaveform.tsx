import React from 'react';

export interface AgnesMessageProps {
  message: string;
  isVisible: boolean;
}

export const AgnesMessage: React.FC<AgnesMessageProps> = ({ message, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="text-center mt-4">
      <p className="text-cyan-400 text-lg font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
};

export interface StatusIndicatorProps {
  status: 'idle' | 'listening' | 'speaking' | 'translating' | 'activating' | 'detecting' | 'introducing' | 'ended';
  detectedLanguage?: string;
  languageFlag?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, detectedLanguage, languageFlag }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`w-3 h-3 rounded-full ${status === 'listening' ? 'bg-green-500 animate-pulse' : 'bg-neutral-500'}`} />
      <span className="text-xs uppercase tracking-widest text-neutral-400">{status}</span>
      {detectedLanguage && (
        <span className="text-sm text-white font-bold">
          {languageFlag} {detectedLanguage}
        </span>
      )}
    </div>
  );
};

export default function AudioWaveform({ isActive, status }: { isActive: boolean, status: string, className?: string }) {
  return (
    <div className={`h-16 flex items-center justify-center ${isActive ? 'opacity-100' : 'opacity-30'}`}>
       {/* Simple visual placeholder for waveform */}
       <div className="flex space-x-1">
         {[1,2,3,4,5].map(i => (
           <div key={i} className={`w-1 bg-cyan-500 rounded-full transition-all duration-300 ${isActive ? 'h-8 animate-bounce' : 'h-2'}`} style={{ animationDelay: `${i * 0.1}s` }} />
         ))}
       </div>
    </div>
  );
}
