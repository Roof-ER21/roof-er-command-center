/**
 * RoleplayPage Component
 * AI-powered roleplay training system integrated from Agnes-21
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, ArrowLeft, Trophy, Target, Zap, Shield, Skull, Loader2, Clock, Award } from "lucide-react";
import {
  INSURANCE_SCENARIOS,
  RETAIL_SCENARIOS,
  DifficultyLevel,
  type RoleplayScenario
} from './data/scenarios';
import { RoleplayChat, type ChatMessage } from './components/RoleplayChat';
import { useToast } from '@/hooks/useToast';
import { apiRequest } from '@/lib/queryClient';

type SessionState = 'selection' | 'active' | 'complete';

export function RoleplayPage() {
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>('selection');
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [division, setDivision] = useState<'insurance' | 'retail'>('insurance');

  const scenarios = division === 'insurance' ? INSURANCE_SCENARIOS : RETAIL_SCENARIOS;

  // Fetch recent roleplay sessions
  const { data: recentSessionsData, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['training', 'roleplay', 'recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/training/roleplay/sessions/recent');
      return response.data;
    },
    enabled: sessionState === 'selection', // Only fetch when in selection view
  });

  const getDifficultyIcon = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: return <Target className="h-4 w-4" />;
      case DifficultyLevel.ROOKIE: return <Zap className="h-4 w-4" />;
      case DifficultyLevel.PRO: return <Trophy className="h-4 w-4" />;
      case DifficultyLevel.VETERAN: return <Shield className="h-4 w-4" />;
      case DifficultyLevel.ELITE: return <Skull className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.BEGINNER: return 'bg-green-500';
      case DifficultyLevel.ROOKIE: return 'bg-blue-500';
      case DifficultyLevel.PRO: return 'bg-yellow-500';
      case DifficultyLevel.VETERAN: return 'bg-orange-500';
      case DifficultyLevel.ELITE: return 'bg-red-500';
    }
  };

  const startSession = async (scenario: RoleplayScenario) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/training/roleplay/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          difficulty: scenario.difficulty,
          division,
        }),
      });

      if (!response.ok) throw new Error('Failed to start session');

      const data = await response.json();
      setSessionId(data.data.sessionId);
      setSelectedScenario(scenario);

      // Add initial system message
      const systemMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: `Roleplay session started: ${scenario.name}\n\n${scenario.context}\n\nThe homeowner will respond based on their personality. Good luck!`,
        timestamp: new Date(),
      };

      // Add AI's initial message
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'ai',
        content: scenario.initialMessage,
        timestamp: new Date(),
      };

      setMessages([systemMessage, aiMessage]);
      setSessionState('active');

      toast({
        title: 'Session Started',
        description: `You are now practicing with ${scenario.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start roleplay session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!sessionId || !selectedScenario) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsLoading(true);
      const response = await fetch(`/api/training/roleplay/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: data.data.response,
        timestamp: new Date(),
        feedback: data.data.feedback,
        score: data.data.scoreAwarded,
      };
      setMessages(prev => [...prev, aiMessage]);

      // Update score if provided
      if (data.data.totalScore !== undefined) {
        setCurrentScore(data.data.totalScore);
      }

      // Check for session end
      if (data.data.sessionEnded) {
        handleSessionEnd(data.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionEnd = (finalData?: any) => {
    setSessionState('complete');

    if (finalData?.finalScore) {
      const summaryMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: `Session Complete!\n\nFinal Score: ${finalData.finalScore}/100\n\n${finalData.summary || 'Great work!'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, summaryMessage]);
    }

    toast({
      title: 'Session Complete',
      description: `You earned ${finalData?.xpAwarded || 0} XP!`,
    });
  };

  const endSession = () => {
    setSessionState('selection');
    setSelectedScenario(null);
    setSessionId(null);
    setMessages([]);
    setCurrentScore(0);
  };

  if (sessionState === 'active' && selectedScenario && sessionId) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <RoleplayChat
          sessionId={sessionId}
          scenarioName={selectedScenario.name}
          difficulty={selectedScenario.difficulty}
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onEndSession={endSession}
          currentScore={currentScore}
          hints={[
            'Remember the 5 non-negotiables',
            'Build rapport before pitching',
            'Listen actively to objections',
            'Stay professional under pressure',
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Roleplay Training</h1>
        <p className="text-muted-foreground">Practice your pitch with AI-powered homeowner scenarios</p>
      </div>

      <Tabs value={division} onValueChange={(v) => setDivision(v as 'insurance' | 'retail')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="insurance">Insurance Division</TabsTrigger>
          <TabsTrigger value="retail">Retail Division</TabsTrigger>
        </TabsList>

        <TabsContent value={division} className="space-y-4 mt-6">
          {/* Beginner Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Beginner Level
              </CardTitle>
              <CardDescription>Perfect for new reps. Friendly homeowners who want to help you succeed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scenarios.filter(s => s.difficulty === DifficultyLevel.BEGINNER).map(scenario => (
                  <Card key={scenario.id} className="hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{scenario.icon}</span>
                        <Badge className={getDifficultyColor(scenario.difficulty)}>
                          {scenario.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                      <Button
                        className="w-full"
                        onClick={() => startSession(scenario)}
                        disabled={isLoading}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Intermediate Scenarios */}
          {scenarios.some(s => s.difficulty === DifficultyLevel.ROOKIE || s.difficulty === DifficultyLevel.PRO) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Intermediate Level
                </CardTitle>
                <CardDescription>Realistic scenarios with common objections and time pressure.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scenarios.filter(s => s.difficulty === DifficultyLevel.ROOKIE || s.difficulty === DifficultyLevel.PRO).map(scenario => (
                    <Card key={scenario.id} className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{scenario.icon}</span>
                          <Badge className={getDifficultyColor(scenario.difficulty)}>
                            {scenario.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                        <Button
                          className="w-full"
                          onClick={() => startSession(scenario)}
                          disabled={isLoading}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Scenarios */}
          {scenarios.some(s => s.difficulty === DifficultyLevel.VETERAN || s.difficulty === DifficultyLevel.ELITE) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Skull className="h-5 w-5 text-red-500" />
                  Advanced Level
                </CardTitle>
                <CardDescription>Challenging scenarios with hostile homeowners and door slam mechanics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scenarios.filter(s => s.difficulty === DifficultyLevel.VETERAN || s.difficulty === DifficultyLevel.ELITE).map(scenario => (
                    <Card key={scenario.id} className="hover:bg-muted/50 transition-colors border-destructive/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{scenario.icon}</span>
                          <Badge className={getDifficultyColor(scenario.difficulty)}>
                            {scenario.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{scenario.description}</p>
                        <p className="text-xs text-destructive mb-3">
                          ⚠️ Door slam after {scenario.doorSlamThreshold} {scenario.doorSlamThreshold === 1 ? 'mistake' : 'mistakes'}
                        </p>
                        <Button
                          className="w-full"
                          variant="destructive"
                          onClick={() => startSession(scenario)}
                          disabled={isLoading}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your roleplay training history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentSessionsData?.sessions && recentSessionsData.sessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessionsData.sessions.map((session: any) => {
                const difficultyColors: Record<string, string> = {
                  'BEGINNER': 'bg-green-500',
                  'ROOKIE': 'bg-blue-500',
                  'PRO': 'bg-yellow-500',
                  'VETERAN': 'bg-orange-500',
                  'ELITE': 'bg-red-500',
                };

                const formattedDate = new Date(session.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const durationMinutes = session.duration
                  ? Math.floor(session.duration / 60)
                  : null;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{session.scenarioTitle}</h4>
                        <Badge className={`${difficultyColors[session.difficulty]} text-xs`}>
                          {session.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formattedDate}
                        </span>
                        {durationMinutes && (
                          <span>{durationMinutes} min</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {session.score !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold">{session.score}</div>
                          <div className="text-xs text-muted-foreground">score</div>
                        </div>
                      )}
                      {session.xpEarned > 0 && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Award className="h-4 w-4" />
                          <span className="font-medium">{session.xpEarned} XP</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No recent sessions yet. Start your first roleplay above!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
