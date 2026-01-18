/**
 * RoleplayChat Component
 * Interactive chat interface for AI roleplay training
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Lightbulb, AlertCircle, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  score?: number;
  feedback?: string;
}

interface RoleplayChatProps {
  sessionId: string;
  scenarioName: string;
  difficulty: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onEndSession: () => void;
  hints?: string[];
  currentScore?: number;
}

export function RoleplayChat({
  sessionId,
  scenarioName,
  difficulty,
  messages,
  isLoading,
  onSendMessage,
  onEndSession,
  hints = [],
  currentScore,
}: RoleplayChatProps) {
  const [input, setInput] = useState('');
  const [showHints, setShowHints] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500';
      case 'rookie':
        return 'bg-blue-500';
      case 'pro':
        return 'bg-yellow-500';
      case 'veteran':
        return 'bg-orange-500';
      case 'elite':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{scenarioName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
                {currentScore !== undefined && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Score: {currentScore}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onEndSession}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system'
                      ? 'bg-muted border border-border'
                      : 'bg-secondary'
                  )}
                >
                  {message.role === 'system' && (
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-semibold text-sm">System</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.feedback && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs opacity-80">{message.feedback}</p>
                    </div>
                  )}
                  {message.score !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        +{message.score} XP
                      </Badge>
                    </div>
                  )}
                  <p className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Hints Panel */}
        {hints.length > 0 && (
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="w-full justify-start"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              {showHints ? 'Hide' : 'Show'} Coaching Tips ({hints.length})
            </Button>
            {showHints && (
              <div className="mt-2 space-y-2">
                {hints.map((hint, index) => (
                  <div
                    key={index}
                    className="text-sm bg-muted rounded p-2 flex items-start gap-2"
                  >
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p>{hint}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response... (Shift+Enter for new line)"
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Tip: Type "score me" to get feedback anytime
            </p>
            <Button variant="ghost" size="sm" onClick={onEndSession}>
              End Session
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
